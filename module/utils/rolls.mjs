import Chat from "./chat.mjs";

/**
 * Handles the various rolls across the system.
 */
export default class Rolls {
    /**
     * Rolls the stamina reduction for a given piece of armour and creates a
     * ChatMessage for it.
     *
     * @param {WarlockActor} actor The Actor object of the character
     * @param {WarlockItem} armour The WarlockItem corresponding to the armour
     */
    static async rollStaminaLossReduction(actor, armour) {
        const roll = new Roll(
            `${armour.data.data.reductionRoll}`,
            {},
        );

        await roll.evaluate({
            async: true,
        });

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({
                actor: actor,
            }),
            flavor: `Stamina Loss Reduction Roll - ${armour.name}`,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls the initiative to determine which side acts first in combat and
     * creates a ChatMessage for it.
     */
    static async rollInitiative() {
        const rollFormula = "1d6";
        let playerRoll = new Roll(rollFormula, {});
        let gmRoll = new Roll(rollFormula, {});

        await playerRoll.evaluate({
            async: true,
        });
        await gmRoll.evaluate({
            async: true,
        });

        // Reroll both Rolls until neither are equal.
        while (playerRoll.total === gmRoll.total) {
            playerRoll = await playerRoll.reroll({
                async: true,
            });
            gmRoll = await gmRoll.reroll({
                async: true,
            });
        }

        await Chat.createRollChatMessage(
            playerRoll,
            ChatMessage.getSpeaker(),
            "systems/warlock/templates/chat/initiative-card.hbs",
            {
                formula: rollFormula,
                total: "",
                playerTotal: playerRoll.total,
                playerTooltip: await Rolls._getToolTip(playerRoll),
                gmTotal: gmRoll.total,
                gmTooltip: await Rolls._getToolTip(gmRoll),
            },
        );
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls for a generic Pluck event using the given Pluck.
     *
     * @param {WarlockActor} actor The Actor object of the character
     * @param {number} pluck The character's current Pluck
     */
    static async rollPluckEvent(actor, pluck) {
        const rollFlavor = "Pluck Event";
        const rollFormula = "2d6 + @pluck";
        const roll = new Roll(rollFormula, {
            pluck: pluck,
        });

        await roll.evaluate({
            async: true,
        });

        await roll.toMessage({
            flavor: rollFlavor,
            speaker: ChatMessage.getSpeaker({
                actor: actor,
            }),
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a basic or opposed skill test and creates the ChatMessage for it.
     *
     * @todo Refactor testType to be an enumeration.
     *
     * @param {WarlockActor} actor The Actor object of the character
     * @param {string} name The name of the skill
     * @param {number} level The level of the skill
     */
    static async rollSkillTest(
        actor,
        name,
        level,
    ) {
        const testOptions = await Rolls._getSkillTestOptions(name);

        // Exit early if the skill test was cancelled.
        if (testOptions.cancelled) {
            return;
        }

        let rollFlavor = "";

        if (testOptions.isOpposedTest) {
            rollFlavor += "Opposed Skill Test";
        } else {
            rollFlavor += "Basic Skill Test";
        }

        rollFlavor += ` - ${name} - Level ${level}`;

        let rollFormula = "1d20 + @level";

        if (testOptions.modifier > 0) {
            rollFormula += " + @modifier";
        } else if (testOptions.modifier < 0) {
            rollFormula += " - @modifier";
        }

        const roll = new Roll(rollFormula, {
            level: level,
            modifier: Math.abs(testOptions.modifier),
        });

        await roll.evaluate({
            async: true,
        });

        await Chat.createRollChatMessage(
            roll,
            ChatMessage.getSpeaker({
                actor: actor,
            }),
            "systems/warlock/templates/chat/skill-test-card.hbs",
            {
                formula: roll.formula,
                total: roll.total,
                tooltip: await Rolls._getToolTip(roll),
                flavor: rollFlavor,
                isOpposedTest: testOptions.isOpposedTest,
            },
        );
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls the damage for a given weapon and creates a ChatMessage for it.
     *
     * @param {WarlockActor} actor The Actor object of the character
     * @param {WarlockItem} weapon The WarlockItem corresponding to the weapon
     */
    static async rollDamage(actor, weapon) {
        const roll = new Roll(
            `max(${weapon.data.data.damage.roll}, 1)`,
            {},
        );

        await roll.evaluate({
            async: true,
        });

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({
                actor: actor,
            }),
            flavor: `Damage Roll - ${weapon.name} - ${weapon.data.data.damage.type.value}`,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Converts the dice of a Roll to an HTML representation.
     *
     * @param {Roll} roll The roll used for rendering the tooltip
     * @returns {string} The rendered HTML template for the tooltip
     *
     * @private
     */
    static async _getToolTip(roll) {
        // Extract the tooltip data for each dice in the Roll.
        const parts = roll.dice.map(d => d.getTooltipData());

        return await renderTemplate("systems/warlock/templates/chat/tooltip.hbs", {
            parts,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates a Dialog for a skill test and returns the options selected by the
     * user.
     *
     * @param {string} skill The skill name to show in the dialog titlebar
     * @returns {Promise<object>} The options from the dialog
     *
     * @private
     */
    static async _getSkillTestOptions(skill) {
        const content = await renderTemplate(
            "systems/warlock/templates/dialogs/skill-test-dialog.hbs",
            {},
        );

        return new Promise(resolve => {
            new Dialog({
                title: `${game.i18n.localize("WARLOCK.SkillTest")}: ${skill}`,
                content: content,
                buttons: {
                    opposed: {
                        icon: "<i class=\"fas fa-users\"></i>",
                        label: game.i18n.localize("WARLOCK.OpposedTest"),
                        callback: (html) => resolve({
                            modifier: html[0].querySelector("form").modifier.value,
                            isOpposedTest: true,
                        }),
                    },
                    cancel: {
                        icon: "<i class=\"fas fa-times\"></i>",
                        label: game.i18n.localize("WARLOCK.Cancel"),
                        callback: (html) => resolve({
                            cancelled: true,
                        }),
                    },
                    basic: {
                        icon: "<i class=\"fas fa-user\"></i>",
                        label: game.i18n.localize("WARLOCK.BasicTest"),
                        callback: (html) => resolve({
                            modifier: html[0].querySelector("form").modifier.value,
                            isOpposedTest: false,
                        }),
                    }
                },
                default: "cancel",
                close: () => resolve({
                    cancelled: true,
                }),
            }, null).render(true);
        });
    }
}