import { WarlockActor } from "./document/warlock-actor.mjs";
import { WarlockItem } from "./document/warlock-item.mjs";

import { WarlockCharacterSheet } from "./sheet/warlock-character-sheet.mjs";
import { WarlockMonsterSheet } from "./sheet/warlock-monster-sheet.mjs";
import { WarlockVehicleSheet } from "./sheet/warlock-vehicle-sheet.mjs";

import { WarlockAbilitySheet } from "./sheet/warlock-ability-sheet.mjs";
import { WarlockArmourSheet } from "./sheet/warlock-armour-sheet.mjs";
import { WarlockCareerSheet } from "./sheet/warlock-career-sheet.mjs";
import { WarlockEquipmentSheet } from "./sheet/warlock-equipment-sheet.mjs";
import { WarlockGlyphSheet } from "./sheet/warlock-glyph-sheet.mjs";
import { WarlockSpellSheet } from "./sheet/warlock-spell-sheet.mjs";
import { WarlockWeaponSheet } from "./sheet/warlock-weapon-sheet.mjs";

import { WarlockCombat } from "./combat/combat.mjs";
import { WarlockCombatTracker } from "./combat/combat-tracker.mjs";

import { Migrations } from "./utils/migrations.mjs";
import { Rolls } from "./utils/rolls.mjs";

/**
 * Initializes the global game variable.
 *
 * @private
 */
 function initializeGame() {
    game.warlock = {
        migrations: Migrations,
        rolls: Rolls,
    };
}

/* -------------------------------------------------------------------------- */

/**
 * Initializes the global CONFIG variable.
 *
 * @private
 */
function initializeCONFIG() {
    CONFIG.Actor.documentClass = WarlockActor;
    CONFIG.Combat.documentClass = WarlockCombat;
    CONFIG.Item.documentClass = WarlockItem;
    CONFIG.ui.combat = WarlockCombatTracker;
}

/* -------------------------------------------------------------------------- */

/**
 * Registers and unregisters various sheets.
 *
 * @private
 */
function initializeSheets() {
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

    Items.registerSheet("warlock", WarlockAbilitySheet, {
        types: [
            "Ability",
        ],
        makeDefault: false,
    });

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

/* -------------------------------------------------------------------------- */

/**
 * Registers game settings.
 *
 * @private
 */
function initializeSettings() {
    game.settings.register("warlock", "systemMigrationVersion", {
        name: game.i18n.localize("WARLOCK.Settings.SystemMigrationVersion"),
        scope: "world",
        config: false,
        type: String,
        default: ""
    });

    game.settings.register("warlock", "activeSystem", {
        name: game.i18n.localize("WARLOCK.Settings.ActiveSystem"),
        hint: game.i18n.localize("WARLOCK.Settings.ActiveSystemHint"),
        scope: "world",
        config: true,
        type: String,
        choices: {
            "warlock": game.i18n.localize("WARLOCK.Settings.ActiveSystemWarlock"),
            "warpstar": game.i18n.localize("WARLOCK.Settings.ActiveSystemWarpstar"),
        },
        default: "warlock",
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });

    game.settings.register("warlock", "careerLevelCalculation", {
        name: game.i18n.localize("WARLOCK.Settings.CareerLevelCalculation"),
        hint: game.i18n.localize("WARLOCK.Settings.CareerLevelCalculationHint"),
        scope: "world",
        config: true,
        type: String,
        choices: {
            "lowestSkill": game.i18n.localize("WARLOCK.Settings.CareerLevelCalculationLowestSkill"),
            "averageSkill": game.i18n.localize("WARLOCK.Settings.CareerLevelCalculationAverageSkill"),
        },
        default: "lowestSkill",
    });

    game.settings.register("warlock", "pluckEnabled", {
        name: game.i18n.localize("WARLOCK.Settings.Pluck"),
        hint: game.i18n.localize("WARLOCK.Settings.PluckHint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });

    game.settings.register("warlock", "reputationEnabled", {
        name: game.i18n.localize("WARLOCK.Settings.Reputation"),
        hint: game.i18n.localize("WARLOCK.Settings.ReputationHint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });

    game.settings.register("warlock", "talentEnabled", {
        name: game.i18n.localize("WARLOCK.Settings.Talent"),
        hint: game.i18n.localize("WARLOCK.Settings.TalentHint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });

    game.settings.register("warlock", "passionsEnabled", {
        name: game.i18n.localize("WARLOCK.Settings.Passions"),
        hint: game.i18n.localize("WARLOCK.Settings.PassionsHint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    });

    game.settings.register("warlock", "automaticStaminaGain", {
        name: game.i18n.localize("WARLOCK.Settings.AutomaticStaminaGain"),
        hint: game.i18n.localize("WARLOCK.Settings.AutomaticStaminaGainHint"),
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
        onChange: _ => foundry.utils.debounce(() => window.location.reload(), 250)(),
    })
}

/* -------------------------------------------------------------------------- */

/**
 * Loads Handlebars templates used as partials.
 *
 * @private
 */
function initializeHandlebarsTemplates() {
    loadTemplates([
        "systems/warlock/templates/actors/partials/armour-table.hbs",
        "systems/warlock/templates/actors/partials/equipment-table.hbs",
        "systems/warlock/templates/actors/partials/glyphs-table.hbs",
        "systems/warlock/templates/actors/partials/spells-table.hbs",
        "systems/warlock/templates/actors/partials/weapons-table.hbs",
        "systems/warlock/templates/actors/partials/combat-tab.hbs",
    ]);
}

/* -------------------------------------------------------------------------- */

/**
 * Registers custom Handlebars helpers.
 *
 * @private
 */
function initializeHandlebarsHelpers() {
    Handlebars.registerHelper("getSkill", (careers, skill) => {
        const activeCareer = careers.find(career => career.system.isActive);
        if (activeCareer) {
            return activeCareer.system.adventuringSkills[skill];
        } else {
            return {};
        }
    });
}

/* -------------------------------------------------------------------------- */

Hooks.once("init", () => {
    initializeGame();
    initializeCONFIG();
    initializeSheets();
    initializeSettings();
    initializeHandlebarsTemplates();
    initializeHandlebarsHelpers();
});

/* -------------------------------------------------------------------------- */

/**
 * Sets the tracked resource for combatants in the combat tracker.
 *
 * @private
 */
function initializeTrackedResource() {
    game.settings.set("core", Combat.CONFIG_SETTING, {
        resource: "resources.actionsPerRound.value",
    });
}

/* -------------------------------------------------------------------------- */

/**
 * Migrates the world and its documents if necessary.
 *
 * @private
 */
function initializeMigration() {
    if (!game.user.isGM) {
        return;
    }

    const currentVersion = game.settings.get("warlock", "systemMigrationVersion");
    const needsMigrationVersion = "2.0.0";
    const needsMigration = (
        !currentVersion
        || foundry.utils.isNewerVersion(needsMigrationVersion, currentVersion)
    );

    if (needsMigration) {
        Migrations.migrateWorld();
    }
}

/* -------------------------------------------------------------------------- */

Hooks.once("ready", () => {
    initializeTrackedResource();
    initializeMigration();
});

/* -------------------------------------------------------------------------- */

/**
 * Highlights a successful basic test with green and a failed basic test with
 * red.
 *
 * @param {ChatMessage} message The message being rendered
 * @param {Function} html The jQuery HTML of the message
 * @param {Object} data Additional data associated with the message
 *
 * @private
 */
function highlightSuccessOrFailure(message, html, data) {
    if (message.isRoll
        && message.isContentVisible
        && message.flags.isBasicTest) {
        if (message.rolls[0].total >= 20) {
            html.find(".dice-total").addClass("dice-total--success");
        } else {
            html.find(".dice-total").addClass("dice-total--failure");
        }
    }
}

/* -------------------------------------------------------------------------- */

Hooks.on("renderChatMessage", (app, html, data) => {
    highlightSuccessOrFailure(app, html, data);
});

/* -------------------------------------------------------------------------- */

Hooks.on("renderSidebarTab", (app, html) => {
    if (app.options.id === "settings") {
        const text = $(`<p>${game.i18n.localize("WARLOCK.Sidebar.Settings.Blurb")}</p>`);
        text.insertAfter(html.find("#game-details .modules"));
    } else if (app.options.id === "combat"
               && game.combat) {
        // Hide the irrelevant combat controls.
        html.find(`.combat-control[data-control="rollAll"]`).css("visibility", "hidden");
        html.find(`.combat-control[data-control="rollNPC"]`).css("visibility", "hidden");
        html.find(`.combat-control[data-control="resetAll"]`).css("visibility", "hidden");
        html.find(`.combat-control[data-control="previousTurn"]`).css("visibility", "hidden");
        html.find(`.combat-control[data-control="nextTurn"]`).css("visibility", "hidden");
        html.find(".token-initiative").hide();

        for (const [_, combatant] of game.combat.combatants.entries()) {
            // Add the class to turns to show the token's disposition.
            if (combatant.token?.disposition) {
                const element = html.find(`.combatant[data-combatant-id=${combatant.id}]`);
                switch (combatant.token.disposition) {
                    case -1: // Hostile
                        element.addClass("combat-tracker__combatant--hostile");
                        break;
                    case 0: // Neutral
                        element.addClass("combat-tracker__combatant--neutral");
                        break;
                    case 1: // Friendly
                        element.addClass("combat-tracker__combatant--friendly");
                        break;
                    default:
                        break;
                }
            }

            // Add the class to turns to show the amount of actions left per
            // round.
            if (combatant.actor.system.resources?.actionsPerRound?.value === 0) {
                element.addClass("combat-tracker__combatant--greyed-out");
            }
        }
    }
});

/* -------------------------------------------------------------------------- */

Hooks.on("i18nInit", () => {
    game.warlock.skills = {
        warlock: {
            "Appraise": game.i18n.localize("WARLOCK.Skills.Appraise"),
            "Athletics": game.i18n.localize("WARLOCK.Skills.Athletics"),
            "Bargain": game.i18n.localize("WARLOCK.Skills.Bargain"),
            "Blunt": game.i18n.localize("WARLOCK.Skills.Blunt"),
            "Bow": game.i18n.localize("WARLOCK.Skills.Bow"),
            "Brawling": game.i18n.localize("WARLOCK.Skills.Brawling"),
            "Command": game.i18n.localize("WARLOCK.Skills.Command"),
            "Crossbow": game.i18n.localize("WARLOCK.Skills.Crossbow"),
            "Diplomacy": game.i18n.localize("WARLOCK.Skills.Diplomacy"),
            "Disguise": game.i18n.localize("WARLOCK.Skills.Disguise"),
            "Dodge": game.i18n.localize("WARLOCK.Skills.Dodge"),
            "Endurance": game.i18n.localize("WARLOCK.Skills.Endurance"),
            "History": game.i18n.localize("WARLOCK.Skills.History"),
            "Incantation": game.i18n.localize("WARLOCK.Skills.Incantation"),
            "Intimidate": game.i18n.localize("WARLOCK.Skills.Intimidate"),
            "Language": game.i18n.localize("WARLOCK.Skills.Language"),
            "Large blade": game.i18n.localize("WARLOCK.Skills.LargeBlade"),
            "Lie": game.i18n.localize("WARLOCK.Skills.Lie"),
            "Medicine": game.i18n.localize("WARLOCK.Skills.Medicine"),
            "Navigation": game.i18n.localize("WARLOCK.Skills.Navigation"),
            "Ostler": game.i18n.localize("WARLOCK.Skills.Ostler"),
            "Persuasion": game.i18n.localize("WARLOCK.Skills.Persuasion"),
            "Pole arm": game.i18n.localize("WARLOCK.Skills.PoleArm"),
            "Repair": game.i18n.localize("WARLOCK.Skills.Repair"),
            "Sleight of hand": game.i18n.localize("WARLOCK.Skills.SleightOfHand"),
            "Small blade": game.i18n.localize("WARLOCK.Skills.SmallBlade"),
            "Spot": game.i18n.localize("WARLOCK.Skills.Spot"),
            "Stealth": game.i18n.localize("WARLOCK.Skills.Stealth"),
            "Streetwise": game.i18n.localize("WARLOCK.Skills.Streetwise"),
            "Survival": game.i18n.localize("WARLOCK.Skills.Survival"),
            "Swimming": game.i18n.localize("WARLOCK.Skills.Swimming"),
            "Thrown": game.i18n.localize("WARLOCK.Skills.Thrown"),
        },
        warpstar: {
            "Animal handler": game.i18n.localize("WARLOCK.Skills.AnimalHandler"),
            "Appraise": game.i18n.localize("WARLOCK.Skills.Appraise"),
            "Astronav": game.i18n.localize("WARLOCK.Skills.Astronav"),
            "Athletics": game.i18n.localize("WARLOCK.Skills.Athletics"),
            "Bargain": game.i18n.localize("WARLOCK.Skills.Bargain"),
            "Blades": game.i18n.localize("WARLOCK.Skills.Blades"),
            "Blunt": game.i18n.localize("WARLOCK.Skills.Blunt"),
            "Brawling": game.i18n.localize("WARLOCK.Skills.Brawling"),
            "Command": game.i18n.localize("WARLOCK.Skills.Command"),
            "Diplomacy": game.i18n.localize("WARLOCK.Skills.Diplomacy"),
            "Disguise": game.i18n.localize("WARLOCK.Skills.Disguise"),
            "Dodge": game.i18n.localize("WARLOCK.Skills.Dodge"),
            "Endurance": game.i18n.localize("WARLOCK.Skills.Endurance"),
            "History": game.i18n.localize("WARLOCK.Skills.History"),
            "Intimidate": game.i18n.localize("WARLOCK.Skills.Intimidate"),
            "Language": game.i18n.localize("WARLOCK.Skills.Language"),
            "Lie": game.i18n.localize("WARLOCK.Skills.Lie"),
            "Medicine": game.i18n.localize("WARLOCK.Skills.Medicine"),
            "Navigation": game.i18n.localize("WARLOCK.Skills.Navigation"),
            "Persuasion": game.i18n.localize("WARLOCK.Skills.Persuasion"),
            "Pilot": game.i18n.localize("WARLOCK.Skills.Pilot"),
            "Repair": game.i18n.localize("WARLOCK.Skills.Repair"),
            "Ship gunner": game.i18n.localize("WARLOCK.Skills.ShipGunner"),
            "Small arms": game.i18n.localize("WARLOCK.Skills.SmallArms"),
            "Sleight of hand": game.i18n.localize("WARLOCK.Skills.SleightOfHand"),
            "Spot": game.i18n.localize("WARLOCK.Skills.Spot"),
            "Stealth": game.i18n.localize("WARLOCK.Skills.Stealth"),
            "Streetwise": game.i18n.localize("WARLOCK.Skills.Streetwise"),
            "Survival": game.i18n.localize("WARLOCK.Skills.Survival"),
            "Thrown": game.i18n.localize("WARLOCK.Skills.Thrown"),
            "Warp focus": game.i18n.localize("WARLOCK.Skills.WarpFocus"),
            "Zero G": game.i18n.localize("WARLOCK.Skills.ZeroG"),
        },
    };
});
