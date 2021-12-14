import * as Chat from "./chat.mjs";

export async function rollArmour(armour) {
    let rollFormula = `${armour.data.data.reductionRoll}`;

    let rollFlavor = `Rolling ${armour.name} stamina loss reduction`;

    const roll = new Roll(rollFormula, {});

    await roll.evaluate({
        async: true,
    });

    const rollTemplate = "systems/warlock/templates/chat/stamina-loss-reduction-card.hbs";
    const rollHtml = await renderTemplate(rollTemplate, {
        formula: roll.formula,
        total: game.i18n.format("{total} reduced stamina loss", {
            total: roll.total,
        }),
        tooltip: await _getToolTip(roll),
        flavor: rollFlavor,
    });

    Chat.createRollChatMessage(rollHtml, roll);
}

export async function rollSkillTest(name, level, testType = "basic") {
    const testOptions = await _getSkillTestOptions(testType);

    if (testOptions.cancelled) {
        return;
    }

    const roll = await _createRoll(level, testOptions);

    let rollFlavor = "";

    if (testOptions.isOpposed) {
        rollFlavor += "Opposed Test | ";
    } else {
        rollFlavor += "Basic Test | ";
    }

    rollFlavor += `${name} at level ${level}`;

    const rollTemplate = "systems/warlock/templates/chat/skill-test-card.hbs";
    const rollHtml = await renderTemplate(rollTemplate, {
        formula: roll.formula,
        total: roll.total,
        tooltip: await _getToolTip(roll),
        flavor: rollFlavor,
        isOpposed: testOptions.isOpposed,
    });

    Chat.createRollChatMessage(rollHtml, roll);
}

export async function rollWeapon(weapon) {
    let rollFormula = `${weapon.data.data.damage.roll}`;

    let rollFlavor = `Rolling ${weapon.name} damage`;

    const roll = new Roll(rollFormula, {});

    await roll.evaluate({
        async: true,
    });

    const rollTemplate = "systems/warlock/templates/chat/damage-card.hbs";
    const rollHtml = await renderTemplate(rollTemplate, {
        formula: roll.formula,
        total: game.i18n.format("{total} {type} damage", {
            total: roll.total,
            type: weapon.data.data.damage.type.value.toLowerCase(),
        }),
        tooltip: await _getToolTip(roll),
        flavor: rollFlavor,
    });

    Chat.createRollChatMessage(rollHtml, roll);
}

async function _createRoll(level, testOptions) {
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

    return roll;
}

async function _getToolTip(roll) {
    const tooltipTemplate = "systems/warlock/templates/chat/tooltip.hbs";
    const parts = roll.dice.map(d => d.getTooltipData());
    return await renderTemplate(tooltipTemplate, {
        parts,
    });
}

async function _getSkillTestOptions(defaultButton = "basic") {
    const dialogTemplate = "systems/warlock/templates/dialogs/skill-test-dialog.hbs";
    const dialogHtml = await renderTemplate(dialogTemplate, {});

    return new Promise(resolve => {
        new Dialog({
            title: game.i18n.localize("WARLOCK.Test"),
            content: dialogHtml,
            buttons: {
                opposed: {
                    label: game.i18n.localize("WARLOCK.OpposedTest"),
                    callback: (html) => resolve(_processSkillTestOptions(html[0].querySelector("form"), true)),
                },
                cancel: {
                    label: game.i18n.localize("WARLOCK.Cancel"),
                    callback: (html) => resolve({cancelled: true}),
                },
                basic: {
                    label: game.i18n.localize("WARLOCK.BasicTest"),
                    callback: (html) => resolve(_processSkillTestOptions(html[0].querySelector("form"), false))
                }
            },
            default: defaultButton,
            close: () => resolve({cancelled: true}),
        }, null).render(true);
    });
}

function _processSkillTestOptions(form, isOpposed) {
    return {
        isOpposed: isOpposed,
        modifier: form.modifier.value,
    };
}