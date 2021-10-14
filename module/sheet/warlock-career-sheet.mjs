export default class WarlockCareerSheet extends ItemSheet {
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

        html.find(".toggle-career-skill").click(this._onToggleCareerSkill.bind(this));
    }

    getData() {
        const context = super.getData();

        context.data.data.activeSystem = game.settings.get("warlock", "activeSystem");

        return context;
    }

    async _onToggleCareerSkill(event) {
        if (!this.isEditable) {
            return;
        }

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