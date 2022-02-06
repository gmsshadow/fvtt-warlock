import * as Chat from "./chat.mjs";

/**
 * Rolls the stamina reduction for a given piece of armour and creates a
 * ChatMessage for it.
 *
 * @param {WarlockActor} actor The Actor object of the character
 * @param {WarlockItem} armour The WarlockItem corresponding to the armour
 */
export async function rollArmour(actor, armour) {
    const rollFormula = `${armour.data.data.reductionRoll}`;
    const rollFlavor = `Rolling ${armour.name} stamina loss reduction`;
    const roll = new Roll(rollFormula, {});

    await roll.evaluate({
        async: true,
    });

    await Chat.createRollChatMessage(
        roll,
        ChatMessage.getSpeaker({
            actor: actor,
        }),
        "systems/warlock/templates/chat/stamina-loss-reduction-card.hbs",
        {
            formula: roll.formula,
            total: game.i18n.format("{total} reduced stamina loss", {
                total: roll.total,
            }),
            tooltip: await _getToolTip(roll),
            flavor: rollFlavor,
        },
    );
}

/* -------------------------------------------- */

/**
 * Rolls the initiative to determine which side acts first in combat and creates
 * a ChatMessage for it.
 */
export async function rollInitiative() {
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
            playerTooltip: await _getToolTip(playerRoll),
            gmTotal: gmRoll.total,
            gmTooltip: await _getToolTip(gmRoll),
        }
    );
}

/* -------------------------------------------- */

/**
 * Rolls for a generic Pluck event using the given Pluck.
 *
 * @param {WarlockActor} actor The Actor object of the character
 * @param {number} pluck The character's current Pluck
 */
export async function rollPluckEvent(actor, pluck) {
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

/* -------------------------------------------- */

/**
 * Rolls a basic or opposed skill test and creates the ChatMessage for it.
 *
 * @todo Refactor testType to be an enumeration.
 *
 * @param {WarlockActor} actor The Actor object of the character
 * @param {string} name The name of the skill
 * @param {number} level The level of the skill
 * @param {string} testType The type of test
 */
export async function rollSkillTest(actor, name, level, testType = "basic") {
    const testOptions = await _getSkillTestOptions(name, testType);

    // Exit early if the skill test was cancelled.
    if (testOptions.cancelled) {
        return;
    }

    let rollFlavor = "";

    if (testOptions.isOpposed) {
        rollFlavor += "Opposed Skill Test";
    } else {
        rollFlavor += "Basic Skill Test";
    }

    rollFlavor += " | ";
    rollFlavor += `${name} at level ${level}`;

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
            tooltip: await _getToolTip(roll),
            flavor: rollFlavor,
            isOpposed: testOptions.isOpposed,
        }
    );
}

/* -------------------------------------------- */

/**
 * Rolls the damage for a given weapon and creates a ChatMessage for it.
 *
 * @param {WarlockActor} actor The Actor object of the character
 * @param {WarlockItem} weapon The WarlockItem corresponding to the weapon
 */
export async function rollWeapon(actor, weapon) {
    const rollFormula = `${weapon.data.data.damage.roll}`;
    const rollFlavor = `Rolling ${weapon.name} damage`;
    const roll = new Roll(rollFormula, {});

    await roll.evaluate({
        async: true,
    });

    await Chat.createRollChatMessage(
        roll,
        ChatMessage.getSpeaker({
            actor: actor,
        }),
        "systems/warlock/templates/chat/damage-card.hbs",
        {
            formula: roll.formula,
            total: game.i18n.format("{total} {type} damage", {
                // Set the damage to 1 if the roll was negative.
                total: Math.max(roll.total, 1),
                type: weapon.data.data.damage.type.value.toLowerCase(),
            }),
            tooltip: await _getToolTip(roll),
            flavor: rollFlavor,
        }
    );
}

/* -------------------------------------------- */

/**
 * Converts the dice of a Roll to an HTML representation.
 *
 * @param {Roll} roll The roll used for rendering the tooltip
 * @returns {string} The rendered HTML template for the tooltip
 *
 * @private
 */
async function _getToolTip(roll) {
    // Extract the tooltip data for each dice in the Roll.
    const parts = roll.dice.map(d => d.getTooltipData());

    return await renderTemplate("systems/warlock/templates/chat/tooltip.hbs", {
        parts,
    });
}

/* -------------------------------------------- */

/**
 * Creates a Dialog for a skill test and returns the options selected by the
 * user.
 *
 * @todo Refactor defaultButton to be an enumeration.
 *
 * @param {string} skill The skill name to show in the dialog titlebar
 * @param {string} defaultButton The name of the button that corresponds to the
 * key name in the buttons object passed to the Dialog constructor
 * @returns {Promise<object>} The options from the dialog
 *
 * @private
 */
async function _getSkillTestOptions(skill, defaultButton) {
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
                        isOpposed: true,
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
                        isOpposed: false,
                    }),
                }
            },
            default: defaultButton,
            close: () => resolve({
                cancelled: true,
            }),
        }, null).render(true);
    });
}