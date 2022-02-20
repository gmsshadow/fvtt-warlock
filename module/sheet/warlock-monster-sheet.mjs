import WarlockActorSheet from "./warlock-actor-sheet.mjs";

import Rolls from "../utils/rolls.mjs";

/**
 * The custom WarlockMonsterSheet that extends the custom WarlockActorSheet.
 *
 * @extends WarlockActorSheet
 */
export default class WarlockMonsterSheet extends WarlockActorSheet {
    /**
     * @override
     * @inheritdoc
     */
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

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".test-adventuring-skills").click(this._onTestAdventuringSkills.bind(this));
        html.find(".test-spell").click(this._onTestSpell.bind(this));
        html.find(".test-weapon-skill").click(this._onTestWeaponSkill.bind(this));
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    getData() {
        const context = super.getData();

        context.data.data.spells = context.actor.itemTypes["Spell"]
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.glyphs = context.actor.itemTypes["Glyph"]
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });

        return context;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a skill test using Adventuring Skills.
     *
     * @param {Event} event The click event to test Adventuring Skills
     *
     * @private
     */
    async _onTestAdventuringSkills(event) {
        event.preventDefault();

        await Rolls.rollSkillTest(
            this.actor,
            "Adventuring Skills",
            this.actor.data.data.adventuringSkills,
        );
    }

    /* ---------------------------------------------------------------------- */

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

        switch (activeSystem) {
            case "warlock":
                await Rolls.rollSkillTest(
                    this.actor,
                    "Adventuring Skills",
                    this.actor.data.data.adventuringSkills,
                );
                break;
            case "warpstar":
                await Rolls.rollSkillTest(
                    this.actor,
                    "Adventuring Skills",
                    this.actor.data.data.adventuringSkills,
                );
                break;
            default:
                break;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a skill test using Weapon Skill.
     *
     * @param {Event} event The click event to test Weapon Skill
     *
     * @private
     */
    async _onTestWeaponSkill(event) {
        event.preventDefault();

        await Rolls.rollSkillTest(
            this.actor,
            "Weapon Skill",
            this.actor.data.data.weaponSkill,
        );
    }
}