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

import * as Migrations from "./migrations.mjs";

function _initializeCONFIG() {
    CONFIG.Actor.documentClass = WarlockActor;
    CONFIG.Item.documentClass = WarlockItem;
}

function _initializeSheets() {
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
}

function _initializeSettings() {
    game.settings.register("warlock", "systemMigrationVersion", {
        name: "System Migration Version",
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    game.settings.register("warlock", "activeSystem", {
        name: game.i18n.localize("WARLOCK.ActiveSystem"),
        hint: game.i18n.localize("WARLOCK.ActiveSystemHint"),
        scope: "world",
        config: true,
        type: String,
        choices: {
            "warlock": "Warlock!",
            "warpstar": "Warpstar!",
        },
        default: "warlock",
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });
    game.settings.register("warlock", "pluckEnabled", {
        name: game.i18n.localize("WARLOCK.Pluck"),
        hint: game.i18n.localize("WARLOCK.PluckHint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });
    game.settings.register("warlock", "reputationEnabled", {
        name: game.i18n.localize("WARLOCK.Reputation"),
        hint: game.i18n.localize("WARLOCK.ReputationHint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });
    game.settings.register("warlock", "talentEnabled", {
        name: game.i18n.localize("WARLOCK.Talent"),
        hint: game.i18n.localize("WARLOCK.TalentHint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });
}

function _initializeHandlebarsTemplates() {
    loadTemplates([
        "systems/warlock/templates/actors/partials/armour-table.hbs",
        "systems/warlock/templates/actors/partials/equipment-table.hbs",
        "systems/warlock/templates/actors/partials/glyphs-table.hbs",
        "systems/warlock/templates/actors/partials/spells-table.hbs",
        "systems/warlock/templates/actors/partials/weapons-table.hbs",
    ]);
}

function _initializeHandlebarsHelpers() {
    Handlebars.registerHelper("getSkill", (careers, skillName) => {
        const activeSystem = game.settings.get("warlock", "activeSystem");
        const activeCareer = careers.find(career => career.data.data.isActive);
        if (activeCareer) {
            return activeCareer.data.data.adventuringSkills[activeSystem][skillName];
        } else {
            return {};
        }
    });

    Handlebars.registerHelper("enrichHTML", (html) => {
        return TextEditor.enrichHTML(html);
    });
}

/**
 * Initialize the various world settings once Foundry has started initialization.
 */
Hooks.once("init", () => {
    _initializeCONFIG();
    _initializeSheets();
    _initializeSettings();
    _initializeHandlebarsTemplates();
    _initializeHandlebarsHelpers();
});

/**
 * Migrate the world, if necessary, once Foundry has completely initialized.
 */
Hooks.once("ready", () => {
    // Exit early if the user isn't the GM.
    if (!game.user.isGM) {
        return;
    }

    // Determine if a migration needs to take place.
    const currentVersion = game.settings.get("warlock", "systemMigrationVersion");
    const NEEDS_MIGRATION_VERSION = "0.2.1";
    const needsMigration = !currentVersion || foundry.utils.isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);

    // Return if a migration doesn't need to occur.
    if (!needsMigration) {
        return;
    }

    // Migrate the world.
    Migrations.migrateWorld();
});