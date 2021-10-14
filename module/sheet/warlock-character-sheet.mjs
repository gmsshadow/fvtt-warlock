import * as Roll from "../roll.mjs";
import WarlockActorSheet from "./warlock-actor-sheet.mjs";

export default class WarlockCharacterSheet extends WarlockActorSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/actors/character-sheet.hbs",
            classes: [
                "warlock",
            ],
            width: 620,
            height: 745,
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".body",
                    initial: "main",
                },
            ],
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".activate-career").click(this._onActivateCareer.bind(this));
        html.find(".consolidate-money").click(this._onConsolidateMoney.bind(this));
        html.find(".edit-quantity").change(this._onEditQuantity.bind(this));
        html.find(".skill-level").change(this._onSkillLevelChange.bind(this));
        html.find(".test-career").click(this._onTestCareer.bind(this));
        html.find(".test-luck").click(this._onTestLuck.bind(this));
        html.find(".test-pluck").click(this._onTestPluck.bind(this));
        html.find(".test-reputation").click(this._onTestReputation.bind(this));
        html.find(".test-skill").click(this._onTestSkill.bind(this));
        html.find(".toggle-reputation-description").click(this._onToggleReputationDescription.bind(this));
    }

    getData() {
        const context = super.getData();

        context.data.data.careers = context.actor.items.filter((item) => {
            return item.type === "Career";
        });
        context.data.data.spells = context.actor.items.filter((item) => {
            return item.type === "Spell";
        });
        context.data.data.glyphs = context.actor.items.filter((item) => {
            return item.type === "Glyph";
        });

        context.data.data.activeSystem = game.settings.get("warlock", "activeSystem");
        context.data.data.resources.reputation.enabled = game.settings.get("warlock", "reputationEnabled");
        context.data.data.biography.talent.enabled = game.settings.get("warlock", "talentEnabled");
        context.data.data.resources.pluck.enabled = game.settings.get("warlock", "pluckEnabled");

        return context;
    }

    async _onActivateCareer(event) {
        if (!this.isEditable) {
            return;
        }

        const itemId = event.currentTarget.closest(".table__entry").dataset.id;
        const careerData = this.actor.items
            .filter((item) => {
                return item.type === "Career";
            })
            .map((career) => {
                return career.id;
            })
            .filter((careerId) => {
                return careerId !== itemId;
            })
            .map((careerId) => {
                return {
                    _id: careerId,
                    data: {
                        isActive: false,
                    },
                };
            });

        this.actor.updateEmbeddedDocuments("Item", [
            {
                _id: itemId,
                data: {
                    isActive: true,
                }
            }
        ].concat(careerData));

        await this.actor.items.get(itemId).updateCareerSkill();

        this.render(true);
    }

    async _onConsolidateMoney(event) {
        let gold = this.actor.data.data.gear.money.gold;
        let silver = this.actor.data.data.gear.money.silver;
        let pennies = this.actor.data.data.gear.money.pennies;

        silver += Math.floor(pennies / 10);
        pennies %= 10;
        gold += Math.floor(silver / 10);
        silver %= 10;

        await this.actor.update({
            data: {
                gear: {
                    money: {
                        gold: gold,
                        silver: silver,
                        pennies: pennies,
                    },
                },
            },
        });
    }

    async _onEditQuantity(event) {
        const itemId = event.currentTarget.closest(".table__entry").dataset.id;
        const item = this.actor.items.get(itemId);

        await item.update({
            data: {
                quantity: event.currentTarget.value,
            },
        });
    }

    async _onSkillLevelChange(event) {
        const skill = event.currentTarget.closest(".table__entry").dataset.skill;
        const activeSystem = game.settings.get("warlock", "activeSystem");

        await this.actor.update({
            data: {
                adventuringSkills: {
                    [activeSystem]: {
                        [skill]: parseInt(event.currentTarget.value, 10),
                    },
                },
            },
        });

        this.actor.items
            .filter((item) => {
                return item.type === "Career";
            })
            .forEach(async (career) => {
                await career.updateCareerSkillLevel();
            });
    }

    async _onTestCareer(event) {
        const careerId = event.currentTarget.closest(".table__entry").dataset.id;
        const career = this.actor.items.get(careerId);

        await Roll.rollSkillTest(career.name, career.data.data.currentLevel);
    }

    async _onTestLuck(event) {
        await Roll.rollSkillTest("Luck", this.actor.data.data.resources.luck.value);
    }

    async _onTestPluck(event) {
        await Roll.rollSkillTest("Pluck", this.actor.data.data.resources.pluck.value);
    }

    async _onTestReputation(event) {
        await Roll.rollSkillTest(`Reputation (${this.actor.data.data.resources.reputation.description})`, this.actor.data.data.resources.reputation.value);
    }

    async _onTestSkill(event) {
        const activeSystem = game.settings.get("warlock", "activeSystem");
        const skill = event.currentTarget.closest(".table__entry").dataset.skill;
        const level = this.actor.data.data.adventuringSkills[activeSystem][skill];

        await Roll.rollSkillTest(skill, level);
    }

    _onToggleReputationDescription(event) {
        $(event.currentTarget).toggleClass("resource__name--active");
        $(event.currentTarget).closest(".resource__body").children(".resource__value--hideable").toggleClass("resource__value--hidden");
    }
}