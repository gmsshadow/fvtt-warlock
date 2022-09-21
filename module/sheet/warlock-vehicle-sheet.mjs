import { WarlockActorSheet } from "./warlock-actor-sheet.mjs";

import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockVehicleSheet that extends the custom WarlockActorSheet.
 *
 * @extends WarlockActorSheet
 */
export class WarlockVehicleSheet extends WarlockActorSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/actors/vehicle-sheet.hbs",
            width: 575,
            height: 550,
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".body",
                    initial: "combat",
                },
            ],
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);

        const activeSystem = game.settings.get("warlock", "activeSystem");

        if (activeSystem === "warpstar") {
            html.find(".test-skill").click(this._onTestSkill.bind(this));
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a skill test using the current actor or token's relevant skill.
     *
     * @param {Event} event The click event to test the actor or token's skill
     *
     * @private
     */
    async _onTestSkill(event) {
        event.preventDefault();

        let actor;
        const speaker = ChatMessage.getSpeaker();

        if (speaker.actor) {
            actor = game.actors.get(speaker.actor);
        } else if (speaker.token) {
            actor = game.scenes.active.tokens.get(speaker.token).actor;
        } else {
            return;
        }

        const skill = event.currentTarget.dataset.skill ?? event.currentTarget.closest(".table__entry").dataset.skill;
        const baseModifier = event.currentTarget.dataset.capability ? this.actor.system.capabilities[event.currentTarget.dataset.capability] : 0;

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
                    showVehicleCombatCapabilities: !event.currentTarget.dataset.capability,
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
                    }
                );
            }
        }
    }
}
