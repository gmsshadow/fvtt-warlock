import { WarlockActorSheet } from "./warlock-actor-sheet.mjs";

import { Rolls } from "../utils/rolls.mjs";
import { activeGameId, gameConfig, skillName } from "../config/systems.mjs";
import { cyberwareBudget, cyberwareCastingPenalty, resourceRoll, rollAncestry } from "../utils/wetwired.mjs";
import { completeSkillList, DEFAULT_CHARACTER_SKILL_LEVEL, skillAdvanceCap } from "../utils/skills.mjs";

/**
 * The custom WarlockCharacterSheet that extends the custom WarlockActorSheet.
 *
 * @extends WarlockActorSheet
 */
export class WarlockCharacterSheet extends WarlockActorSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["warlock", "sheet", "actor", "character"],
        position: {
            width: 620,
            height: 745,
        },
        actions: {
            ...WarlockActorSheet.DEFAULT_OPTIONS.actions,
            activateCareer: WarlockCharacterSheet._onActivateCareer,
            consolidateMoney: WarlockCharacterSheet._onConsolidateMoney,
            incrementSkillLevel: WarlockCharacterSheet._onIncrementSkillLevel,
            testCareer: WarlockCharacterSheet._onTestCareer,
            testLuck: WarlockCharacterSheet._onTestLuck,
            testPluck: WarlockCharacterSheet._onTestPluck,
            testReputation: WarlockCharacterSheet._onTestReputation,
            testSkill: WarlockCharacterSheet._onTestSkill,
            testSpell: WarlockCharacterSheet._onTestSpell,
            openReputationDialog: WarlockCharacterSheet._onOpenReputationDialog,
            restShort: WarlockCharacterSheet._onShortRest,
            restLong: WarlockCharacterSheet._onLongRest,
            rollAncestry: WarlockCharacterSheet._onRollAncestry,
            resourceRoll: WarlockCharacterSheet._onResourceRoll,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/actors/character-sheet.hbs",
        },
    };

    /** @override */
    static TABS = {
        primary: {
            initial: "skills",
            tabs: [
                { id: "skills", label: "WARLOCK.Tabs.Skills" },
                { id: "combat", label: "WARLOCK.Tabs.Combat" },
                { id: "gear", label: "WARLOCK.Tabs.Gear" },
                { id: "spells", label: "WARLOCK.Tabs.Spells" },
                { id: "notes", label: "WARLOCK.Tabs.Notes" },
            ],
        },
    };

    /* ---------------------------------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        // Handle the edit-skill-level change event.
        this.element.querySelectorAll(".edit-skill-level").forEach((el) => {
            el.addEventListener("change", this._onEditSkillLevel.bind(this));
        });

        // Save the last focused skill level input element for refocus.
        this.element.querySelectorAll(".edit-skill-level").forEach((el) => {
            el.addEventListener("focusin", (event) => {
                this.saveFocus = event.currentTarget.dataset.skill;
            });
        });

        // Refocus the last selected skill level input field after render.
        if (this.saveFocus) {
            const element = this.element.querySelector(`input[data-skill="${this.saveFocus}"]`);
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
        // localized name, using stored levels where present.
        context.data.system.adventuringSkills = completeSkillList(
            context.data.system.adventuringSkills,
            () => DEFAULT_CHARACTER_SKILL_LEVEL,
        );

        // Wetwired: ancestry choices and notes, cyberware budget and penalty.
        const config = gameConfig();
        if (config.features.ancestry) {
            context.ancestryChoices = { "": game.i18n.localize("WARLOCK.Ancestry.Label") };
            for (const type of Object.keys(config.ancestry.types)) {
                context.ancestryChoices[type] = game.i18n.localize(`WARLOCK.Ancestry.Types.${type}`);
            }
            const notesKey = config.ancestry.types[context.data.system.biography?.ancestry]?.notes;
            context.ancestryNotes = notesKey ? game.i18n.localize(notesKey) : "";
        }
        context.cyberwareBudget = cyberwareBudget(this.actor);
        context.cyberwarePenalty = cyberwareCastingPenalty(this.actor);

        // Rows per skill column, so both columns are even.
        context.skillRows = Math.ceil(Object.keys(context.data.system.adventuringSkills).length / 2);

        // Which skills an advance can raise: skills of the active career that
        // are below that career's maximum.
        const advances = Number(context.data.system.resources?.advances) || 0;
        context.skillAdvance = {};
        for (const [skill, level] of Object.entries(context.data.system.adventuringSkills)) {
            const max = skillAdvanceCap(this.actor, skill);
            context.skillAdvance[skill] = {
                can: (advances > 0) && (max !== null) && (level < max),
                max,
                next: level + 1,
            };
        }

        context.data.system.careers = this.actor.itemTypes["Career"]
            .sort((a, b) => a.sort - b.sort);
        context.data.system.spells = this.actor.itemTypes["Spell"]
            .sort((a, b) => a.sort - b.sort);
        context.data.system.glyphs = this.actor.itemTypes["Glyph"]
            .sort((a, b) => a.sort - b.sort);

        context.data.system.resources.reputation.enabled = game.settings.get("warlock", "reputationEnabled");
        context.data.system.resources.pluck.enabled = game.settings.get("warlock", "pluckEnabled");
        context.data.system.biography.talent.enabled = game.settings.get("warlock", "talentEnabled");
        context.data.system.biography.passions.enabled = game.settings.get("warlock", "passionsEnabled");

        const biography = context.data.system.biography;
        context.enriched.biography = {
            description: await this.enrich(biography.description),
            notes: await this.enrich(biography.notes),
            talent: {
                description: await this.enrich(biography.talent?.description),
            },
        };

        return context;
    }


    /* ---------------------------------------------------------------------- */

    /**
     * Activates a career.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onActivateCareer(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const itemId = target.closest(".table__entry").dataset.itemId;
        const careerData = this.actor.itemTypes["Career"]
            .map((career) => career.id)
            .filter((careerId) => careerId !== itemId)
            .map((careerId) => ({
                _id: careerId,
                system: { isActive: false },
            }));

        await this.actor.updateEmbeddedDocuments("Item", [
            {
                _id: itemId,
                system: { isActive: true },
            },
        ].concat(careerData));
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Consolidates money to the highest note.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onConsolidateMoney(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        let gold = this.actor.system.gear.money.gold;
        let silver = this.actor.system.gear.money.silver;
        let pennies = this.actor.system.gear.money.pennies;

        silver += Math.floor(pennies / 10);
        pennies %= 10;
        gold += Math.floor(silver / 10);
        silver %= 10;

        await this.actor.update({
            system: {
                gear: {
                    money: { gold, silver, pennies },
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Edits a skill level.
     * Called from the change event listener in _onRender.
     *
     * @param {Event} event The change event
     */
    async _onEditSkillLevel(event) {
        event.preventDefault();

        if (!this.isEditable) return;

        const skill = event.currentTarget.closest(".table__entry").dataset.skill;
        const level = parseInt(event.currentTarget.value, 10);

        await this.actor.update({
            system: {
                adventuringSkills: {
                    [skill]: level,
                },
            },
        });

        for (const career of this.actor.itemTypes["Career"]) {
            await career.updateCareerSkillLevel(skill, level);
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Increments a skill level by one.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onIncrementSkillLevel(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const skill = target.closest(".table__entry").dataset.skill;
        const level = this.actor.system.adventuringSkills?.[skill] ?? DEFAULT_CHARACTER_SKILL_LEVEL;
        const max = skillAdvanceCap(this.actor, skill);

        if ((Number(this.actor.system.resources?.advances) || 0) <= 0) {
            ui.notifications.warn(game.i18n.localize("WARLOCK.Notifications.NoAdvances"));
            return;
        }
        const displayName = skillName(skill);
        if (max === null) {
            ui.notifications.warn(game.i18n.format("WARLOCK.Notifications.NotCareerSkill", { skill: displayName }));
            return;
        }
        if (level >= max) {
            ui.notifications.warn(game.i18n.format("WARLOCK.Notifications.SkillAtMaximum", { skill: displayName, max }));
            return;
        }

        await this.actor.update({
            system: {
                adventuringSkills: {
                    [skill]: level + 1,
                },
            },
        });

        for (const career of this.actor.itemTypes["Career"]) {
            const currentLevel = career.system.currentLevel;
            await career.updateCareerSkillLevel(
                skill,
                this.actor.system.adventuringSkills?.[skill] ?? DEFAULT_CHARACTER_SKILL_LEVEL,
            );

            const isAutomaticStaminaGainEnabled = game.settings.get("warlock", "automaticStaminaGain");
            if (isAutomaticStaminaGainEnabled
                && career.system.isActive
                && (currentLevel < career.system.currentLevel)) {
                await this.actor.update({
                    system: {
                        resources: {
                            stamina: {
                                max: this.actor.system.resources.stamina.max + (career.system.currentLevel - currentLevel),
                            },
                        },
                    },
                });
            }
        }

        await this.actor.update({
            system: {
                resources: {
                    advances: this.actor.system.resources.advances - 1,
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Opens the reputation configuration Dialog.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onOpenReputationDialog(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const template = "systems/warlock/templates/dialogs/reputation-configuration-dialog.hbs";
        const content = await foundry.applications.handlebars.renderTemplate(template, {
            description: this.actor.system.resources.reputation.description,
        });

        const result = await foundry.applications.api.DialogV2.wait({
            window: {
                title: game.i18n.localize("WARLOCK.Dialogs.ReputationConfiguration.Title"),
            },
            content: content,
            buttons: [
                {
                    action: "cancel",
                    icon: "fas fa-times",
                    label: game.i18n.localize("WARLOCK.Dialogs.ReputationConfiguration.Cancel"),
                },
                {
                    action: "submit",
                    icon: "fas fa-check",
                    label: game.i18n.localize("WARLOCK.Dialogs.ReputationConfiguration.Submit"),
                    default: true,
                    callback: (event, button, dialog) => {
                        return button.form.elements.description.value;
                    },
                },
            ],
            close: () => null,
        });

        if (!result) return;

        await this.actor.update({
            system: {
                resources: {
                    reputation: {
                        description: result,
                    },
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Roll a skill test using the career skill.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestCareer(event, target) {
        event.preventDefault();

        const careerId = target.closest(".table__entry").dataset.itemId;
        const career = this.actor.items.get(careerId);

        await Rolls.rollSkillTest(
            this.actor,
            career.name,
            career.system.currentLevel,
            { showCombatOptions: false },
        );
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Roll a Luck test with automatic Luck deduction.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestLuck(event, target) {
        event.preventDefault();
        await Rolls.rollLuckTest(this.actor);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls 2d6 for the character's ancestry (Wetwired).
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onRollAncestry(event, target) {
        event.preventDefault();
        if (!this.isEditable) return;
        await rollAncestry(this.actor);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Makes a Resource roll against the character's Wealth Points (Wetwired).
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onResourceRoll(event, target) {
        event.preventDefault();
        if (!this.isEditable) return;
        await resourceRoll(this.actor);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Short rest: recover half lost stamina.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onShortRest(event, target) {
        event.preventDefault();
        await Rolls.restShort(this.actor);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Long rest: recover all stamina.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onLongRest(event, target) {
        event.preventDefault();
        await Rolls.restLong(this.actor);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Roll a skill test using Pluck, or roll for a Pluck result if Shift is held.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestPluck(event, target) {
        event.preventDefault();

        if (event.shiftKey) {
            await Rolls.rollPluckEvent(
                this.actor,
                this.actor.system.resources.pluck.value,
            );
        } else {
            await Rolls.rollSkillTest(
                this.actor,
                game.i18n.localize("WARLOCK.Resources.Pluck"),
                this.actor.system.resources.pluck.value,
                { showCombatOptions: false },
            );
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Roll a skill test using Reputation.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestReputation(event, target) {
        event.preventDefault();

        await Rolls.rollSkillTest(
            this.actor,
            game.i18n.format("WARLOCK.Resources.ReputationTest", {
                description: this.actor.system.resources.reputation.description,
            }),
            this.actor.system.resources.reputation.value,
            { showCombatOptions: false },
        );
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Roll a skill test.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestSkill(event, target) {
        event.preventDefault();

        const skill = target.closest(".table__entry").dataset.skill;
        const level = this.actor.system.adventuringSkills?.[skill] ?? DEFAULT_CHARACTER_SKILL_LEVEL;

        await Rolls.rollSkillTest(
            this.actor,
            skillName(skill),
            level,
            {
                showCombatOptions: true,
                skipDialog: event.shiftKey || event.altKey,
                isBasicTest: event.shiftKey,
            },
        );
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Roll a spell casting test with Wrath of the Otherworld automation.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestSpell(event, target) {
        event.preventDefault();

        const itemId = target.closest(".table__entry")?.dataset?.itemId;
        const spellItem = itemId ? this.actor.items.get(itemId) : null;

        // The game's casting skill: the first configured skill the game has
        // for the name, and the first the character has a level in.
        const castingSkills = gameConfig().magic.skills;
        const names = game.warlock.skills[activeGameId()] ?? {};
        const nameKey = castingSkills.find((key) => names[key] !== undefined) ?? castingSkills[0];
        const stored = this.actor.system.adventuringSkills ?? {};
        const levelKey = castingSkills.find((key) => stored[key] !== undefined);
        const castingSkillLevel = levelKey ? stored[levelKey] : DEFAULT_CHARACTER_SKILL_LEVEL;

        await Rolls.rollSpellTest(
            this.actor,
            names[nameKey] ?? nameKey,
            castingSkillLevel,
            {
                // Wetwired: -2 per full point of installed cyberware.
                baseModifier: cyberwareCastingPenalty(this.actor),
                spellName: spellItem?.name ?? "",
                staminaCost: spellItem?.system?.staminaCost ?? 0,
            },
        );
    }
}
