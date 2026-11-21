import { activeGameId } from "../config/systems.mjs";

/**
 * Wetwired weapons saved before 2.5.10 used "Small Arms" (which matched no
 * skill) and Warpstar!'s damage types. Map them to Wetwired's own values
 * (p109): Small arms, and Crushing to Blunt. Ship has no Wetwired equivalent
 * and is left for the GM to change. Runs on world load for the GM, only in
 * Wetwired worlds, and only touches weapons that still have the old values.
 */
const WETWIRED_WEAPON_FIXES = {
    skill: { "Small Arms": "Small arms" },
    damage: { "Crushing": "Blunt" },
};

function weaponFix(item) {
    if (item.type !== "Weapon") return null;
    const update = {};
    const skill = WETWIRED_WEAPON_FIXES.skill[item.system.skill?.value];
    const damage = WETWIRED_WEAPON_FIXES.damage[item.system.damage?.type?.value];
    if (skill) update["system.skill.value"] = skill;
    if (damage) update["system.damage.type.value"] = damage;
    return Object.keys(update).length ? { _id: item.id, ...update } : null;
}

export async function fixWetwiredWeapons() {
    if (!game.user.isGM || activeGameId() !== "wetwired") return;

    let fixed = 0;
    const worldUpdates = game.items.map(weaponFix).filter(Boolean);
    if (worldUpdates.length) {
        await Item.implementation.updateDocuments(worldUpdates);
        fixed += worldUpdates.length;
    }
    for (const actor of game.actors) {
        const updates = actor.items.map(weaponFix).filter(Boolean);
        if (updates.length) {
            await actor.updateEmbeddedDocuments("Item", updates);
            fixed += updates.length;
        }
    }
    if (fixed) console.log(`Warlock | Updated ${fixed} Wetwired weapon(s) to Wetwired skills and damage types.`);
}
