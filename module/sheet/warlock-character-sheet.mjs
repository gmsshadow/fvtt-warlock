import WarlockActorSheet from "./warlock-actor-sheet.mjs";

import * as Roll from "../utils/roll.mjs";

/**
 * The custom WarlockCharacterSheet that extends the custom WarlockActorSheet.
 *
 * @extends WarlockActorSheet
 */
export default class WarlockCharacterSheet extends WarlockActorSheet {
    /**
     * @override
     * @inheritdoc
     */
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

    /* -------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
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

    /* -------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
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

        // Save the last focused skill level input element.
        html.find(".edit-skill-level").focusin((event) => {
            this.saveFocus = event.currentTarget.dataset.skill;
        });
    }

    /* -------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    getData() {
        const context = super.getData();

        context.data.data.careers = context.actor.itemTypes["Career"]
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.spells = context.actor.itemTypes["Spell"]
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.glyphs = context.actor.itemTypes["Glyph"]
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });

        context.data.data.resources.reputation.enabled = game.settings.get("warlock", "reputationEnabled");
        context.data.data.biography.talent.enabled = game.settings.get("warlock", "talentEnabled");
        context.data.data.resources.pluck.enabled = game.settings.get("warlock", "pluckEnabled");

        return context;
    }

    /* -------------------------------------------- */

    /**
     * Activates a career.
     *
     * @param {Event} event The click event to activate a career
     *
     * @private
     */
    async _onActivateCareer(event) {
        if (!this.isEditable) {
            return;
        }

        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const careerData = this.actor.itemTypes["Career"]
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

    /* -------------------------------------------- */

    /**
     * Consolidates money to the highest note.
     *
     * @param {Event} event The click event to consolidate money
     *
     * @private
     */
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

    /* -------------------------------------------- */

    /**
     * Edits a skill level.
     *
     * @param {Event} event The change event to edit a skill level
     *
     * @private
     */
    async _onEditSkillLevel(event) {
        let skill = event.currentTarget.closest(".table__entry").dataset.skill;
        let level = parseInt(event.currentTarget.value, 10);
        this.actor.itemTypes["Career"]
            .forEach(async (career) => {
                await career.updateCareerSkillLevel(skill, level);
            });
    }

    /* -------------------------------------------- */

    /**
     * Increments a skill level by one.
     *
     * @param {Event} event The click event to increment a skill level
     *
     * @private
     */
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
        this.actor.itemTypes["Career"]
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

    /* -------------------------------------------- */

    /**
     * Roll a skill test using the career skill.
     *
     * @param {Event} event The click event to test with a career skill
     *
     * @private
     */
    async _onTestCareer(event) {
        event.preventDefault();

        const careerId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const career = this.actor.items.get(careerId);

        await Roll.rollSkillTest(career.name, career.data.data.currentLevel);
    }

    /* -------------------------------------------- */

    /**
     * Roll a skill test using luck.
     *
     * @param {Event} event The click event to test Luck
     *
     * @private
     */
    async _onTestLuck(event) {
        event.preventDefault();

        await Roll.rollSkillTest("Luck", this.actor.data.data.resources.luck.value);
    }

    /* -------------------------------------------- */

    /**
     * Roll a skill test using Pluck.
     *
     * @param {Event} event The click event to test Pluck
     *
     * @private
     */
    async _onTestPluck(event) {
        event.preventDefault();

        await Roll.rollSkillTest("Pluck", this.actor.data.data.resources.pluck.value);
    }

    /* -------------------------------------------- */

    /**
     * Roll a skill test using Reputation.
     *
     * @param {Event} event The click event to test Reputation
     *
     * @private
     */
    async _onTestReputation(event) {
        event.preventDefault();

        await Roll.rollSkillTest(`Reputation (${this.actor.data.data.resources.reputation.description})`, this.actor.data.data.resources.reputation.value);
    }

    /* -------------------------------------------- */

    /**
     * Roll a skill test.
     *
     * @param {Event} event The click event to test a skill
     *
     * @private
     */
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

    /* -------------------------------------------- */

    /**
     * Roll a skill test for a spell or glyph.
     *
     * @param {Event} event The click event to test for a spell or glyph
     *
     * @private
     */
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

    /* -------------------------------------------- */

    /**
     * Opens the reputation configuration Dialog.
     *
     * @param {Event} event The click event to open the reputation configuration
     * Dialog
     *
     * @private
     */
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