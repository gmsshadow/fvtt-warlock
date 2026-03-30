import { WarlockActorSheet } from "./warlock-actor-sheet.mjs";

import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockMonsterSheet that extends the custom WarlockActorSheet.
 *
 * @extends WarlockActorSheet
 */
export class WarlockMonsterSheet extends WarlockActorSheet {
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
                    initial: "abilities",
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
        html.find(".test-skill").click(this._onTestWeaponSkill.bind(this));
        html.find(".test-spell").click(this._onTestAdventuringSkills.bind(this));
        html.find(".test-weapon-skill").click(this._onTestWeaponSkill.bind(this));
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    async getData() {
        const context = await super.getData();

        context.data.system.abilities = context.actor.itemTypes["Ability"]
            .sort((a, b) => {
                return a.sort - b.sort;
            });
        context.data.system.spells = context.actor.itemTypes["Spell"]
            .sort((a, b) => {
                return a.sort - b.sort;
            });
        context.data.system.glyphs = context.actor.itemTypes["Glyph"]
            .sort((a, b) => {
                return a.sort - b.sort;
            });

        context.data.system.biography.description = await TextEditor.enrichHTML(
            context.data.system.biography.description,
            {
                async: true,
            },
        );

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
     * @param {Event} event The click event to test Weapon Skill
     *
     * @private
     */
    async _onTestWeaponSkill(event) {
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
