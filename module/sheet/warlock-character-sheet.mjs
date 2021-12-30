import * as Roll from "../roll.mjs";
import WarlockActorSheet from "./warlock-actor-sheet.mjs";

export default class WarlockCharacterSheet extends WarlockActorSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/actors/character-sheet.hbs",
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

    render(force=false, options={}) {
        super.render(force, options);

        // Refocus the last selected skill level input field when the sheet is
        // rendered. This situation occurs if an input is focused, changed, and
        // another input field is focused. The sheet renders at least twice,
        // once for the character data update and one or more times for the
        // career level update(s). The renders after the first cause the
        // latter-focused input field to blur which makes it very annoying to
        // modify multiple skill levels at once, like in character creation.
        //
        // This idea was graciously adapted from Moo Man's WFRP 4th Edition
        // system.
        if (this.saveFocus) {
            const element = $(`input[data-skill="${this.saveFocus}"]`)[0];
            if (element) {
                element.focus();
            }
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".activate-career").click(this._onActivateCareer.bind(this));
        html.find(".consolidate-money").click(this._onConsolidateMoney.bind(this));
        html.find(".edit-skill-level").change(this._onEditSkillLevel.bind(this));
        html.find(".increment-skill-level").click(this._onIncrementSkillLevel.bind(this));
        html.find(".test-career").click(this._onTestCareer.bind(this));
        html.find(".test-luck").click(this._onTestLuck.bind(this));
        html.find(".test-pluck").click(this._onTestPluck.bind(this));
        html.find(".test-reputation").click(this._onTestReputation.bind(this));
        html.find(".test-skill").click(this._onTestSkill.bind(this));
        html.find(".test-spell").click(this._onTestSpell.bind(this));
        html.find(".open-reputation-dialog").click(this._onOpenReputationDialog.bind(this));

        // Set up the event listener to save the last focused skill level input
        // element.
        html.find(".edit-skill-level").focusin((event) => {
            this.saveFocus = event.currentTarget.dataset.skill;
        });
    }

    getData() {
        const context = super.getData();

        context.data.data.careers = context.actor.items
            .filter((item) => {
                return item.type === "Career";
            })
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.spells = context.actor.items
            .filter((item) => {
                return item.type === "Spell";
            })
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.glyphs = context.actor.items
            .filter((item) => {
                return item.type === "Glyph";
            })
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });

        context.data.data.resources.reputation.enabled = game.settings.get("warlock", "reputationEnabled");
        context.data.data.biography.talent.enabled = game.settings.get("warlock", "talentEnabled");
        context.data.data.resources.pluck.enabled = game.settings.get("warlock", "pluckEnabled");

        return context;
    }

    async _onActivateCareer(event) {
        if (!this.isEditable) {
            return;
        }

        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
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
    }

    async _onConsolidateMoney(event) {
        event.preventDefault();

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

    async _onEditSkillLevel(event) {
        let skill = event.currentTarget.closest(".table__entry").dataset.skill;
        let level = parseInt(event.currentTarget.value, 10);
        this.actor.items
            .filter((item) => {
                return item.type === "Career";
            })
            .forEach(async (career) => {
                await career.updateCareerSkillLevel(skill, level);
            });
    }

    async _onIncrementSkillLevel(event) {
        // Increase the skill level.
        const skill = event.currentTarget.closest(".table__entry").dataset.skill;
        const activeSystem = game.settings.get("warlock", "activeSystem");

        await this.actor.update({
            data: {
                adventuringSkills: {
                    [activeSystem]: {
                        [skill]: this.actor.data.data.adventuringSkills[activeSystem][skill] + 1,
                    },
                },
            },
        });

        // Notify the careers of the level increase.
        this.actor.items
            .filter((item) => {
                return item.type === "Career";
            })
            .forEach(async (career) => {
                let currentLevel = career.data.data.currentLevel;
                await career.updateCareerSkillLevel();

                // Check if the active career level has changed.
                if (career.data.data.isActive && (currentLevel < career.data.data.currentLevel)) {
                    // If it has, add the difference to the maximum stamina.
                    await this.actor.update({
                        data: {
                            resources: {
                                stamina: {
                                    max: this.actor.data.data.resources.stamina.max + (career.data.data.currentLevel - currentLevel),
                                },
                            },
                        },
                    });
                }
            });

        // Deduct one advance.
        await this.actor.update({
            data: {
                resources: {
                    advances: this.actor.data.data.resources.advances - 1,
                },
            },
        });
    }

    async _onTestCareer(event) {
        event.preventDefault();

        const careerId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const career = this.actor.items.get(careerId);

        await Roll.rollSkillTest(career.name, career.data.data.currentLevel);
    }

    async _onTestLuck(event) {
        event.preventDefault();

        await Roll.rollSkillTest("Luck", this.actor.data.data.resources.luck.value);
    }

    async _onTestPluck(event) {
        event.preventDefault();

        await Roll.rollSkillTest("Pluck", this.actor.data.data.resources.pluck.value);
    }

    async _onTestReputation(event) {
        event.preventDefault();

        await Roll.rollSkillTest(`Reputation (${this.actor.data.data.resources.reputation.description})`, this.actor.data.data.resources.reputation.value);
    }

    async _onTestSkill(event) {
        event.preventDefault();

        const activeSystem = game.settings.get("warlock", "activeSystem");
        const skill = event.currentTarget.closest(".table__entry").dataset.skill;
        const level = this.actor.data.data.adventuringSkills[activeSystem][skill];

        let testType = "";

        switch (activeSystem) {
            case "warlock":
                if (["Blunt", "Bow", "Brawling", "Crossbow", "Large blade", "Pole arm", "Small blade", "Thrown"].includes(skill)) {
                    testType = "opposed";
                }
                break;
            case "warpstar":
                if (["Blades", "Blunt", "Brawling", "Ship gunner", "Small arms", "Thrown"].includes(skill)) {
                    testType = "opposed";
                }
                break;
            default:
                break;
        }

        await Roll.rollSkillTest(skill, level, testType);
    }

    async _onTestSpell(event) {
        event.preventDefault();

        const activeSystem = game.settings.get("warlock", "activeSystem");

        let skill, level;

        switch (activeSystem) {
            case "warlock":
                skill = "Incantation";
                level = this.actor.data.data.adventuringSkills[activeSystem][skill];

                await Roll.rollSkillTest(skill, level, "basic");
                break;
            case "warpstar":
                skill = "Warp focus";
                level = this.actor.data.data.adventuringSkills[activeSystem][skill];

                const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
                const item = this.actor.items.get(itemId);
                const testType = item.data.data.test.value.toLowerCase();

                await Roll.rollSkillTest(skill, level, testType);
                break;
            default:
                break;
        }
    }

    async _onOpenReputationDialog(event) {
        event.preventDefault();

        const dialogTemplate = "systems/warlock/templates/dialogs/reputation-configuration-dialog.hbs";
        const dialogHtml = await renderTemplate(dialogTemplate, {
            description: this.actor.data.data.resources.reputation.description,
        });

        const options = await new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("WARLOCK.Reputation"),
                content: dialogHtml,
                buttons: {
                    cancel: {
                        icon: "<i class=\"fas fa-times\"></i>",
                        label: game.i18n.localize("WARLOCK.Cancel"),
                        callback: (html) => resolve({cancelled: true}),
                    },
                    submit: {
                        icon: "<i class=\"fas fa-check\"></i>",
                        label: game.i18n.localize("WARLOCK.Submit"),
                        callback: (html) => resolve({description: html[0].querySelector("form").description.value}),
                    },
                },
                default: "submit",
                close: () => resolve({cancelled: true}),
            }, null).render(true);
        });

        if (options.cancelled) {
            return;
        }

        await this.actor.update({
            data: {
                resources: {
                    reputation: {
                        description: options.description,
                    }
                }
            }
        });
    }
}