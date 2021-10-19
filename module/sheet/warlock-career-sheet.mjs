import WarlockItemSheet from "./warlock-item-sheet.mjs";

export default class WarlockCareerSheet extends WarlockItemSheet {
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

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".toggle-career-skill").click(this._onToggleCareerSkill.bind(this));

        // Set up the event listener to save the last focused skill level input
        // element.
        html.find(".edit-career-skill-level").focusin((event) => {
            this.saveFocus = event.currentTarget.dataset.skill;
        });
    }

    async getData() {
        const context = super.getData();

        context.data.data.activeSystem = game.settings.get("warlock", "activeSystem");

        return context;
    }

    async _onToggleCareerSkill(event) {
        if (!this.isEditable) {
            return;
        }

        event.preventDefault();

        const skillName = event.currentTarget.closest(".table__entry").dataset.skill;
        const activeSystem = game.settings.get("warlock", "activeSystem");
        const isCareerSkill = this.item.data.data.adventuringSkills[activeSystem][skillName].isCareerSkill;

        await this.item.update({
            data: {
                adventuringSkills: {
                    [activeSystem]: {
                        [skillName]: {
                            isCareerSkill: !isCareerSkill,
                        },
                    },
                },
            },
        });

        await this.item.updateCareerSkillLevel();
    }
}