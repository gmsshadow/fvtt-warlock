import WarlockItemSheet from "./warlock-item-sheet.mjs";

export default class WarlockCareerSheet extends WarlockItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/career-sheet.hbs",
            classes: [
                "warlock",
            ],
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

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".edit-career-skill-level").change(this._onEditCareerSkillLevel.bind(this));
        html.find(".toggle-career-skill").click(this._onToggleCareerSkill.bind(this));
    }

    getData() {
        const context = super.getData();

        context.data.data.activeSystem = game.settings.get("warlock", "activeSystem");

        return context;
    }

    async _onEditCareerSkillLevel(event) {
        if (!this.isEditable) {
            return;
        }

        event.preventDefault();

        const skillName = event.currentTarget.closest(".table__entry").dataset.skill;
        const activeSystem = game.settings.get("warlock", "activeSystem");

        await this.item.update({
            data: {
                adventuringSkills: {
                    [activeSystem]: {
                        [skillName]: {
                            maximumLevel: event.currentTarget.value,
                        },
                    },
                },
            },
        });

        await this.item.updateCareerSkills();
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
        await this.item.updateCareerSkills();
    }
}