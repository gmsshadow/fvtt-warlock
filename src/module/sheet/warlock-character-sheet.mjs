import { WarlockActorSheet } from "./warlock-actor-sheet.mjs";

import { Rolls } from "../utils/rolls.mjs";
import { completeSkillList, DEFAULT_CHARACTER_SKILL_LEVEL } from "../utils/skills.mjs";

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

        await this.actor.update({
            system: {
                adventuringSkills: {
                    [skill]: (this.actor.system.adventuringSkills?.[skill] ?? DEFAULT_CHARACTER_SKILL_LEVEL) + 1,
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

        const activeSystem = game.settings.get("warlock", "activeSystem");
        const skill = target.closest(".table__entry").dataset.skill;
        const level = this.actor.system.adventuringSkills?.[skill] ?? DEFAULT_CHARACTER_SKILL_LEVEL;

        await Rolls.rollSkillTest(
            this.actor,
            game.warlock.skills[activeSystem][skill],
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

        const activeSystem = game.settings.get("warlock", "activeSystem");

        const itemId = target.closest(".table__entry")?.dataset?.itemId;
        const spellItem = itemId ? this.actor.items.get(itemId) : null;

        let skillName;
        let skillLevel;

        switch (activeSystem) {
            case "warlock":
                skillName = game.warlock.skills.warlock["Incantation"];
                skillLevel = this.actor.system.adventuringSkills?.["Incantation"] ?? DEFAULT_CHARACTER_SKILL_LEVEL;
                break;
            case "warpstar":
                skillName = game.warlock.skills.warpstar["Warp focus"];
                skillLevel = this.actor.system.adventuringSkills?.["Warp focus"] ?? DEFAULT_CHARACTER_SKILL_LEVEL;
                break;
            case "wetwired":
                skillName = game.warlock.skills.wetwired["Sorcery"] ?? game.warlock.skills.wetwired["Conjuring"];
                skillLevel = this.actor.system.adventuringSkills?.["Sorcery"]
                    ?? this.actor.system.adventuringSkills?.["Conjuring"] ?? DEFAULT_CHARACTER_SKILL_LEVEL;
                break;
            default:
                return;
        }

        await Rolls.rollSpellTest(
            this.actor,
            skillName,
            skillLevel,
            {
                spellName: spellItem?.name ?? "",
                staminaCost: spellItem?.system?.staminaCost ?? 0,
            },
        );
    }
}
