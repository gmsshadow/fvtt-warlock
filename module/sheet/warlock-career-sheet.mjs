import { WarlockItemSheet } from "./warlock-item-sheet.mjs";

/**
 * The custom WarlockCareerSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockCareerSheet extends WarlockItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/career-sheet.hbs",
            width: 600,
            height: 615,
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".body",
                    initial: "skills",
                },
            ],
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    render(force=false, options={}) {
        super.render(force, options);

        // Refocus the last selected career skill level input field when the
        // sheet is rendered. This situation occurs if an input is focused,
        // changed, and another input field is focused. The sheet renders at
        // least twice, once for the character data update and one or more times
        // for the career skill level update(s). The renders after the first
        // cause the latter-focused input field to blur which makes it very
        // annoying to modify multiple skill levels at once.
        //
        // This idea was graciously adapted from Moo Man's WFRP 4th Edition
        // system.
        if (this.saveFocus) {
            const element = $(`input[data-career-skill="${this.saveFocus}]`)[0];
            if (element) {
                element.focus();
            }
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".edit-career-skill-level").change(this._onEditCareerSkillLevel.bind(this));
        html.find(".toggle-career-skill").click(this._onToggleCareerSkill.bind(this));

        // Save the last focused skill level input element.
        html.find(".edit-career-skill-level").focusin((event) => {
            this.saveFocus = event.currentTarget.dataset.skill;
        });
    }

    async _onEditCareerSkillLevel(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const skill = event.currentTarget.closest(".table__entry").dataset.skill;
        const level = parseInt(event.currentTarget.value, 10);

        await this.item.update({
            system: {
                adventuringSkills: {
                    [skill]: {
                        maximumLevel: level,
                    },
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Toggles a career skill.
     *
     * @param {Event} event The click event to toggle a career skill
     *
     * @private
     */
    async _onToggleCareerSkill(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const skill = event.currentTarget.closest(".table__entry").dataset.skill;
        const isCareerSkill = this.item.system.adventuringSkills[skill].isCareerSkill;

        await this.item.update({
            system: {
                adventuringSkills: {
                    [skill]: {
                        isCareerSkill: !isCareerSkill,
                    },
                },
            },
        });

        await this.item.updateCareerSkillLevel();
    }
}
