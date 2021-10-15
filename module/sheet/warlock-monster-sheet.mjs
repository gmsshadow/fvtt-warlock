import * as Roll from "../roll.mjs";
import WarlockActorSheet from "./warlock-actor-sheet.mjs";

export default class WarlockMonsterSheet extends WarlockActorSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/actors/monster-sheet.hbs",
            classes: [
                "warlock",
            ],
            width: 640,
            height: 550,
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".test-adventuring-skills").click(this._onTestAdventuringSkills.bind(this));
        html.find(".test-weapon-skill").click(this._onTestWeaponSkill.bind(this));
    }

    async _onTestAdventuringSkills(event) {
        event.preventDefault();

        await Roll.rollSkillTest("Adventuring Skills", this.actor.data.data.adventuringSkills);
    }

    async _onTestWeaponSkill(event) {
        event.preventDefault();

        await Roll.rollSkillTest("Weapon Skill", this.actor.data.data.weaponSkill);
    }
}