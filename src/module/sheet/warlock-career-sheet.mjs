import { WarlockItemSheet } from "./warlock-item-sheet.mjs";
import { completeSkillList, DEFAULT_CAREER_SKILL } from "../utils/skills.mjs";

/**
 * The custom WarlockCareerSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockCareerSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            width: 600,
            height: 615,
        },
        actions: {
            toggleCareerSkill: WarlockCareerSheet._onToggleCareerSkill,
            toggleEtiquette: WarlockCareerSheet._onToggleEtiquette,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/items/career-sheet.hbs",
        },
    };

    /** @override */
    static TABS = {
        primary: {
            initial: "skills",
            tabs: [
                { id: "skills", label: "WARLOCK.Tabs.Skills" },
                { id: "description", label: "WARLOCK.Tabs.Description" },
            ],
        },
    };

    /* ---------------------------------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        // Bind change listener for career skill level editing.
        const skillLevelInputs = this.element.querySelectorAll(".edit-career-skill-level");
        for (const input of skillLevelInputs) {
            input.addEventListener("change", this._onEditCareerSkillLevel.bind(this));

            // Save the last focused skill level input element for refocus.
            input.addEventListener("focusin", (event) => {
                this.saveFocus = event.currentTarget.dataset.skill;
            });
        }

        // Refocus the last selected career skill level input field when the
        // sheet is rendered. This situation occurs if an input is focused,
        // changed, and another input field is focused. The sheet renders at
        // least twice, once for the character data update and one or more times
        // for the career skill level update(s). The renders after the first
        // cause the latter-focused input field to blur which makes it very
        // annoying to modify multiple skill levels at once.
        if (this.saveFocus) {
            const element = this.element.querySelector(`input[data-career-skill="${this.saveFocus}"]`);
            if (element) {
                element.focus();
            }
        }
    }

    /* ---------------------------------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Always show the active subsystem's full skill list, sorted by
        // localized name, using stored values where present.
        context.data.system.adventuringSkills = completeSkillList(
            context.data.system.adventuringSkills,
            () => ({ ...DEFAULT_CAREER_SKILL }),
        );

        // Rows per skill column, so both columns are even.
        context.skillRows = Math.ceil(Object.keys(context.data.system.adventuringSkills).length / 2);

        return context;
    }


    /* ---------------------------------------------------------------------- */

    /**
     * Handles editing a career skill level.
     *
     * @param {Event} event The change event
     * @private
     */
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
     * Toggles an extra etiquette the career grants (Wetwired p27).
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onToggleEtiquette(event, target) {
        event.preventDefault();
        if (!this.isEditable) return;

        const name = target.dataset.etiquette;
        const current = this.item.system.etiquette?.additional ?? [];
        const additional = current.includes(name)
            ? current.filter((e) => e !== name)
            : [...current, name];
        await this.item.update({ "system.etiquette.additional": additional });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Toggles whether a skill is a career skill.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onToggleCareerSkill(event, target) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const skill = target.closest(".table__entry").dataset.skill;
        const isCareerSkill = this.item.system.adventuringSkills?.[skill]?.isCareerSkill ?? false;

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
