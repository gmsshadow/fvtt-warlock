import { WarlockActorSheet } from "./warlock-actor-sheet.mjs";

import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockMonsterSheet that extends the custom WarlockActorSheet.
 *
 * @extends WarlockActorSheet
 */
export class WarlockMonsterSheet extends WarlockActorSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            width: 640,
            height: 550,
        },
        actions: {
            ...WarlockActorSheet.DEFAULT_OPTIONS.actions,
            testAdventuringSkills: WarlockMonsterSheet._onTestAdventuringSkills,
            testWeaponSkill: WarlockMonsterSheet._onTestWeaponSkill,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/actors/monster-sheet.hbs",
        },
    };

    /** @override */
    static TABS = {
        primary: {
            initial: "abilities",
            tabs: [
                { id: "abilities", label: "WARLOCK.Tabs.Abilities" },
                { id: "combat", label: "WARLOCK.Tabs.Combat" },
                { id: "gear", label: "WARLOCK.Tabs.Gear" },
                { id: "spells", label: "WARLOCK.Tabs.Spells" },
                { id: "description", label: "WARLOCK.Tabs.Description" },
            ],
        },
    };

    /* ---------------------------------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        // Monster sheets reuse test-skill class from weapon tables for weapon skill tests,
        // and test-spell class from spell tables for adventuring skill tests.
        // These are handled via data-action in templates now.
    }

    /* ---------------------------------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.data.system.abilities = this.actor.itemTypes["Ability"]
            .sort((a, b) => a.sort - b.sort);
        context.data.system.spells = this.actor.itemTypes["Spell"]
            .sort((a, b) => a.sort - b.sort);
        context.data.system.glyphs = this.actor.itemTypes["Glyph"]
            .sort((a, b) => a.sort - b.sort);

        context.enriched.biography = {
            description: await this.enrich(context.data.system.biography?.description),
        };

        return context;
    }


    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a skill test using Adventuring Skills.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestAdventuringSkills(event, target) {
        event.preventDefault();

        await Rolls.rollSkillTest(
            this.actor,
            game.i18n.localize("WARLOCK.Skills.AdventuringSkills"),
            this.actor.system.adventuringSkills,
            {
                showCombatOptions: true,
                skipDialog: event.shiftKey || event.altKey,
                isBasicTest: event.shiftKey,
            },
        );
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a skill test using Weapon Skill.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestWeaponSkill(event, target) {
        event.preventDefault();

        await Rolls.rollSkillTest(
            this.actor,
            game.i18n.localize("WARLOCK.Skills.WeaponSkill"),
            this.actor.system.weaponSkill,
            {
                showCombatOptions: true,
                skipDialog: event.shiftKey || event.altKey,
                isBasicTest: event.shiftKey,
            },
        );
    }
}
