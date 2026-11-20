import { WarlockActorSheet } from "./warlock-actor-sheet.mjs";

import { Rolls } from "../utils/rolls.mjs";
import { DEFAULT_CHARACTER_SKILL_LEVEL } from "../utils/skills.mjs";

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
            initial: "combat",
            tabs: [
                { id: "combat", label: "WARLOCK.Tabs.Combat" },
                { id: "gear", label: "WARLOCK.Tabs.Gear" },
                { id: "description", label: "WARLOCK.Tabs.Description" },
            ],
        },
    };

    /* ---------------------------------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.enriched.biography = {
            description: await this.enrich(context.data.system.biography?.description),
        };

        return context;
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
                actor.system.adventuringSkills?.[skill] ?? DEFAULT_CHARACTER_SKILL_LEVEL,
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
