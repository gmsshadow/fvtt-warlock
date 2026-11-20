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
            abilities: { id: "abilities", group: "primary", label: "WARLOCK.Tabs.Abilities" },
            combat: { id: "combat", group: "primary", label: "WARLOCK.Tabs.Combat" },
            gear: { id: "gear", group: "primary", label: "WARLOCK.Tabs.Gear" },
            spells: { id: "spells", group: "primary", label: "WARLOCK.Tabs.Spells" },
            description: { id: "description", group: "primary", label: "WARLOCK.Tabs.Description" },
        },
    };

    /** @override */
    tabGroups = {
        primary: "abilities",
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

        context.data.system.biography.description = await foundry.applications.ux.TextEditor.enrichHTML(
            context.data.system.biography.description,
            { async: true },
        );

        context.tabs = this._getTabs();

        return context;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Build tab metadata for the template.
     * @returns {Object}
     */
    _getTabs() {
        const tabs = {};
        for (const [groupId, groupTabs] of Object.entries(this.constructor.TABS)) {
            for (const [tabId, tabConfig] of Object.entries(groupTabs)) {
                tabs[tabId] = {
                    ...tabConfig,
                    active: this.tabGroups[groupId] === tabId,
                    cssClass: this.tabGroups[groupId] === tabId ? "active" : "",
                };
            }
        }
        return tabs;
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
