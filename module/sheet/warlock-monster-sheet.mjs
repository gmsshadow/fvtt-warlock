import * as Roll from "../roll.mjs";
import WarlockActorSheet from "./warlock-actor-sheet.mjs";

export default class WarlockMonsterSheet extends WarlockActorSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/actors/monster-sheet.hbs",
            width: 640,
            height: 550,
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".body",
                    initial: "gear",
                },
            ],
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find(".test-adventuring-skills").click(this._onTestAdventuringSkills.bind(this));
        html.find(".test-spell").click(this._onTestSpell.bind(this));
        html.find(".test-weapon-skill").click(this._onTestWeaponSkill.bind(this));
    }

    getData() {
        const context = super.getData();

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

        return context;
    }

    async _onTestAdventuringSkills(event) {
        event.preventDefault();

        await Roll.rollSkillTest("Adventuring Skills", this.actor.data.data.adventuringSkills);
    }

    async _onTestSpell(event) {
        event.preventDefault();

        const activeSystem = game.settings.get("warlock", "activeSystem");

        switch (activeSystem) {
            case "warlock":
                await Roll.rollSkillTest("Adventuring Skills", this.actor.data.data.adventuringSkills);
                break;
            case "warpstar":
                const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
                const item = this.actor.items.get(itemId);
                const testType = item.data.data.test.value.toLowerCase();

                await Roll.rollSkillTest("Adventuring Skills", this.actor.data.data.adventuringSkills, testType);
                break;
            default:
                break;
        }
    }

    async _onTestWeaponSkill(event) {
        event.preventDefault();

        await Roll.rollSkillTest("Weapon Skill", this.actor.data.data.weaponSkill, "opposed");
    }
}