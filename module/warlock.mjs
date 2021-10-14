import WarlockActor from "./document/warlock-actor.mjs";
import WarlockItem from "./document/warlock-item.mjs";

import WarlockCharacterSheet from "./sheet/warlock-character-sheet.mjs";
import WarlockMonsterSheet from "./sheet/warlock-monster-sheet.mjs";
import WarlockVehicleSheet from "./sheet/warlock-vehicle-sheet.mjs";

import WarlockArmourSheet from "./sheet/warlock-armour-sheet.mjs";
import WarlockCareerSheet from "./sheet/warlock-career-sheet.mjs";
import WarlockEquipmentSheet from "./sheet/warlock-equipment-sheet.mjs";
import WarlockGlyphSheet from "./sheet/warlock-glyph-sheet.mjs";
import WarlockSpellSheet from "./sheet/warlock-spell-sheet.mjs";
import WarlockWeaponSheet from "./sheet/warlock-weapon-sheet.mjs";

Hooks.once("init", () => {
    CONFIG.Actor.documentClass = WarlockActor;
    CONFIG.Item.documentClass = WarlockItem;

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("warlock", WarlockCharacterSheet, {
        types: [
            "Character",
        ],
        makeDefault: true,
    });
    Actors.registerSheet("warlock", WarlockMonsterSheet, {
        types: [
            "Monster",
        ],
        makeDefault: false,
    });
    Actors.registerSheet("warlock", WarlockVehicleSheet, {
        types: [
            "Vehicle",
        ],
        makeDefault: false,
    });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("warlock", WarlockArmourSheet, {
        types: [
            "Armour",
        ],
        makeDefault: false,
    });
    Items.registerSheet("warlock", WarlockCareerSheet, {
        types: [
            "Career",
        ],
        makeDefault: false,
    });
    Items.registerSheet("warlock", WarlockEquipmentSheet, {
        types: [
            "Equipment",
        ],
        makeDefault: false,
    });
    Items.registerSheet("warlock", WarlockGlyphSheet, {
        types: [
            "Glyph",
        ],
        makeDefault: false,
    });
    Items.registerSheet("warlock", WarlockSpellSheet, {
        types: [
            "Spell",
        ],
        makeDefault: false,
    });
    Items.registerSheet("warlock", WarlockWeaponSheet, {
        types: [
            "Weapon",
        ],
        makeDefault: false,
    });

    loadTemplates([
        "systems/warlock/templates/actors/partials/armour-table.hbs",
        "systems/warlock/templates/actors/partials/weapons-table.hbs",
    ]);

    game.settings.register("warlock", "activeSystem", {
        name: game.i18n.localize("WARLOCK.Active System"),
        hint: game.i18n.localize("WARLOCK.Active System Hint"),
        scope: "world",
        config: true,
        type: String,
        choices: {
            "warlock": "Warlock",
            "warpstar": "Warpstar",
        },
        default: "warlock",
    });
    game.settings.register("warlock", "reputationEnabled", {
        name: game.i18n.localize("WARLOCK.Reputation"),
        hint: game.i18n.localize("WARLOCK.Reputation Hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    game.settings.register("warlock", "talentEnabled", {
        name: game.i18n.localize("WARLOCK.Talent"),
        hint: game.i18n.localize("WARLOCK.Talent Hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });
    game.settings.register("warlock", "pluckEnabled", {
        name: game.i18n.localize("WARLOCK.Pluck"),
        hint: game.i18n.localize("WARLOCK.Pluck Hint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
    });

    Handlebars.registerHelper("getSkill", (careers, skillName) => {
        const activeSystem = game.settings.get("warlock", "activeSystem");
        for (let career of careers) {
            if (career.data.data.isActive) {
                return career.data.data.adventuringSkills[activeSystem][skillName];
            }
        }

        return {};
    })
});