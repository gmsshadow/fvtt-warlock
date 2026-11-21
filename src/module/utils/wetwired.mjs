import { gameConfig } from "../config/systems.mjs";

/**
 * Wetwired rules that read the character's ancestry, cyberware and Wealth
 * Points. Every function returns a neutral value (no modifier, no penalty)
 * when the active game doesn't use the feature, so callers can use them in
 * all three games.
 */

/* -------------------------------------------------------------------------- */
/* Ancestry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * The ancestry modifiers the automation applies (p17-18).
 *
 * @param {Actor} actor
 * @returns {{ dodge: number, melee: number, ranged: number, stamina: number, luck: number }}
 */
export function ancestryModifiers(actor) {
    const none = { dodge: 0, melee: 0, ranged: 0, stamina: 0, luck: 0 };
    const config = gameConfig();
    if (!config.features.ancestry) return none;
    const ancestry = config.ancestry.types[actor?.system?.biography?.ancestry];
    return { ...none, ...(ancestry ?? {}) };
}

/**
 * Rolls 2d6 on the ancestry table (p17) and sets the result, with the
 * ancestry's own allergy when it has one.
 *
 * @param {Actor} actor
 */
export async function rollAncestry(actor) {
    const config = gameConfig();
    if (!config.features.ancestry) return;

    const roll = new Roll("2d6");
    await roll.evaluate();
    const ancestry = config.ancestry.table[roll.total];

    // An ancestry with a fixed allergy (orks: sunlight) sets it. Otherwise a
    // fixed allergy left over from the previous ancestry is cleared, and an
    // allergy the player chose is kept.
    const fixed = config.ancestry.types[ancestry]?.allergy;
    const previousFixed = config.ancestry.types[actor.system.biography?.ancestry]?.allergy;
    let allergy = actor.system.biography?.allergy ?? "";
    if (fixed) allergy = fixed;
    else if (previousFixed && allergy === previousFixed) allergy = "";

    await actor.update({ system: { biography: { ancestry, allergy } } });
    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor }),
        flavor: `${game.i18n.localize("WARLOCK.Ancestry.Roll")}: ${game.i18n.localize(`WARLOCK.Ancestry.Types.${ancestry}`)}`,
    });
}

/* -------------------------------------------------------------------------- */
/* Cyberware                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Points of cyberware each category allows and uses. Each Cybertech skill
 * level above 4 buys one point in that category (p148).
 *
 * @param {Actor} actor
 * @returns {Array<{ category: string, label: string, used: number, available: number, over: boolean }>}
 */
export function cyberwareBudget(actor) {
    const config = gameConfig();
    if (!config.features.cyberware) return [];

    const installed = (actor.itemTypes?.["Cyberware"] ?? []).filter((i) => i.system.isInstalled);
    return Object.entries(config.cyberware).map(([category, skill]) => {
        const level = Number(actor.system.adventuringSkills?.[skill]) || 4;
        const available = Math.max(0, level - 4);
        const used = installed
            .filter((i) => i.system.category?.value === category)
            .reduce((sum, i) => sum + (Number(i.system.points) || 0), 0);
        return {
            category,
            label: game.i18n.localize(`WARLOCK.Items.Cyberware.Categories.${category}`),
            used,
            available,
            over: used > available,
        };
    });
}

/**
 * The casting penalty from installed cyberware: -2 per full point
 * (p133, p149), as a negative number, or 0.
 *
 * @param {Actor} actor
 * @returns {number}
 */
export function cyberwareCastingPenalty(actor) {
    const perPoint = gameConfig().magic.cyberwarePenaltyPerPoint ?? 0;
    if (!perPoint) return 0;
    const points = (actor.itemTypes?.["Cyberware"] ?? [])
        .filter((i) => i.system.isInstalled)
        .reduce((sum, i) => sum + (Number(i.system.points) || 0), 0);
    return -perPoint * Math.floor(points);
}

/* -------------------------------------------------------------------------- */
/* Wealth                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * A Resource roll (p155-156): d20 + Wealth Points must reach the item's
 * Resource cost. Anything costing less than current Wealth needs no roll.
 * Attempting the roll always costs 1 Wealth Point; on a failure the
 * character may spend the shortfall in Wealth Points to get the item anyway.
 *
 * @param {Actor} actor
 */
export async function resourceRoll(actor) {
    if (!gameConfig().features.wealth) return;
    const { DialogV2 } = foundry.applications.api;
    const wealth = Number(actor.system.resources?.wealth?.value) || 0;

    const cost = await DialogV2.prompt({
        window: { title: game.i18n.localize("WARLOCK.Dialogs.ResourceRoll.Title") },
        content: `
            <div class="form-group">
                <label>${game.i18n.localize("WARLOCK.Dialogs.ResourceRoll.Cost")}</label>
                <input type="number" name="cost" value="${Math.ceil(wealth) + 1}" min="0" step="1" autofocus>
                <p class="hint">${game.i18n.localize("WARLOCK.Dialogs.ResourceRoll.Hint")}</p>
            </div>`,
        ok: {
            label: game.i18n.localize("WARLOCK.Dialogs.ResourceRoll.Roll"),
            icon: "fas fa-dice-d20",
            callback: (event, button) => button.form.elements.cost.valueAsNumber,
        },
        rejectClose: false,
    });
    if (cost === null || cost === undefined || Number.isNaN(cost)) return;

    const speaker = ChatMessage.getSpeaker({ actor });
    if (cost < wealth) {
        await ChatMessage.create({
            speaker,
            content: `<div class="warlock chat-card"><p>${game.i18n.format("WARLOCK.Chat.Resource.Affordable", { wealth, cost })}</p></div>`,
        });
        return;
    }

    const roll = new Roll("1d20 + @wealth", { wealth });
    await roll.evaluate();
    const success = roll.total >= cost;
    const afterAttempt = Math.max(0, wealth - 1);
    const shortfall = success ? 0 : cost - roll.total;

    await actor.update({ system: { resources: { wealth: { value: afterAttempt } } } });

    const lines = [
        success
            ? game.i18n.localize("WARLOCK.Chat.Resource.Success")
            : game.i18n.format("WARLOCK.Chat.Resource.Failure", { diff: shortfall }),
        game.i18n.format("WARLOCK.Chat.Resource.Spent", { old: wealth, new: afterAttempt }),
    ];
    await roll.toMessage({
        speaker,
        flavor: `${game.i18n.format("WARLOCK.Chat.Resource.Flavor", { cost, wealth })}<br>${lines.join("<br>")}`,
    });

    // Offer to spend the shortfall (p156).
    if (!success && shortfall <= afterAttempt) {
        const pay = await DialogV2.confirm({
            window: { title: game.i18n.localize("WARLOCK.Dialogs.ResourceRoll.Title") },
            content: `<p>${game.i18n.format("WARLOCK.Chat.Resource.Failure", { diff: shortfall })}</p>`,
            yes: { label: game.i18n.format("WARLOCK.Chat.Resource.PayDifference", { diff: shortfall }) },
            rejectClose: false,
        });
        if (pay) {
            const final = afterAttempt - shortfall;
            await actor.update({ system: { resources: { wealth: { value: final } } } });
            await ChatMessage.create({
                speaker,
                content: `<div class="warlock chat-card"><p>${game.i18n.localize("WARLOCK.Chat.Resource.Success")} ${game.i18n.format("WARLOCK.Chat.Resource.Spent", { old: afterAttempt, new: final })}</p></div>`,
            });
        }
    }
}
