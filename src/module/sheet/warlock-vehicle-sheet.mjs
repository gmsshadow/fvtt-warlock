import { WarlockActorSheet } from "./warlock-actor-sheet.mjs";

import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockVehicleSheet that extends the custom WarlockActorSheet.
 *
 * @extends WarlockActorSheet
 */
export class WarlockVehicleSheet extends WarlockActorSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            width: 575,
            height: 550,
        },
        actions: {
            ...WarlockActorSheet.DEFAULT_OPTIONS.actions,
            testVehicleSkill: WarlockVehicleSheet._onTestSkill,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/actors/vehicle-sheet.hbs",
        },
    };

    /** @override */
    static TABS = {
        primary: {
            combat: { id: "combat", group: "primary", label: "WARLOCK.Tabs.Combat" },
            gear: { id: "gear", group: "primary", label: "WARLOCK.Tabs.Gear" },
            description: { id: "description", group: "primary", label: "WARLOCK.Tabs.Description" },
        },
    };

    /** @override */
    tabGroups = {
        primary: "combat",
    };

    /* ---------------------------------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.data.system.biography ??= {};
        context.data.system.biography.description = await foundry.applications.ux.TextEditor.enrichHTML(
            context.data.system.biography?.description ?? "",
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
     * Rolls a skill test using the current actor or token's relevant skill.
     * Only active for Warpstar subsystem.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onTestSkill(event, target) {
        event.preventDefault();

        const activeSystem = game.settings.get("warlock", "activeSystem");
        if (activeSystem !== "warpstar") return;

        let actor;
        const speaker = ChatMessage.getSpeaker();

        if (speaker.actor) {
            actor = game.actors.get(speaker.actor);
        } else if (speaker.token) {
            actor = game.scenes.active.tokens.get(speaker.token).actor;
        } else {
            return;
        }

        const skill = target.dataset.skill ?? target.closest(".table__entry")?.dataset?.skill;
        const baseModifier = target.dataset.capability
            ? this.actor.system.capabilities[target.dataset.capability]
            : 0;

        if (actor.type === "Character") {
            await Rolls.rollSkillTest(
                actor,
                skill,
                actor.system.adventuringSkills[skill],
                {
                    baseModifier: baseModifier,
                    showCombatOptions: true,
                    skipDialog: event.shiftKey || event.altKey,
                    isBasicTest: event.shiftKey,
                    showVehicleCombatCapabilities: !target.dataset.capability,
                    shipGun: this.actor.system.capabilities.shipGun,
                    antiPersonnelGun: this.actor.system.capabilities.antiPersonnelGun,
                },
            );
        } else if (actor.type === "Monster") {
            if (skill === game.warlock.skills.warpstar["Ship gunner"]) {
                await Rolls.rollSkillTest(
                    actor,
                    game.i18n.localize("WARLOCK.Skills.WeaponSkill"),
                    actor.system.weaponSkill,
                    {
                        baseModifier: baseModifier,
                        showCombatOptions: true,
                        skipDialog: event.shiftKey || event.altKey,
                        isBasicTest: event.shiftKey,
                    },
                );
            } else {
                await Rolls.rollSkillTest(
                    actor,
                    game.i18n.localize("WARLOCK.Skills.AdventuringSkills"),
                    actor.system.adventuringSkills,
                    {
                        baseModifier: baseModifier,
                        showCombatOptions: true,
                        skipDialog: event.shiftKey || event.altKey,
                        isBasicTest: event.shiftKey,
                    },
                );
            }
        }
    }
}
