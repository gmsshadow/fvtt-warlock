/**
 * Per-game rules configuration for Warlock!, Warpstar! and Wetwired.
 *
 * The three games share one engine. Everything that differs between them
 * only in data (names, lists, numbers, which options exist) lives here, so
 * the shared code reads the active game's entry instead of branching on the
 * game's name. Rules that work differently, rather than just using different
 * values, stay as code and are switched on by a flag here.
 *
 * Skill keys are the untranslated keys of game.warlock.skills[game], which
 * the i18nInit hook builds; display names come from there or from the
 * localization keys below.
 */

/** @typedef {"warlock"|"warpstar"|"wetwired"} GameId */

export const SYSTEMS = Object.freeze({
    warlock: {
        id: "warlock",

        weapons: {
            /** Values for a weapon's type (Warlock!: casual or martial, p80). */
            types: ["Casual", "Martial"],
            /** Damage types, each with its own critical table (p80, p85-88). */
            damageTypes: ["Crushing", "Piercing", "Slashing", "Blast"],
            /** Skills a weapon can use. */
            skills: ["Blunt", "Bow", "Brawling", "Crossbow", "Large blade", "Pole arm", "Small blade", "Thrown"],
            /** Weapon skills that make an attack ranged (tested against Dodge, p79). */
            rangedSkills: ["Bow", "Crossbow", "Thrown"],
            /** The unarmed weapon every new character receives. */
            unarmed: { pack: "warlock.weapons-warlock", id: "yeHpzUBivahsQLOE" },
        },

        combat: {
            /** Defender's shield adds +3 / +5 to Dodge against missiles (p79). */
            shields: true,
            /** Pinning and flanking options. */
            pinAndFlank: false,
            /** Bonus for the attacker in a ranged attack (melee always gets +5). */
            rangedAttackerBonus: 0,
            /** Close range also carries the -5 range penalty. */
            closeRangePenalty: false,
            /** Every equipped armour layer rolls its reduction (otherwise the first equipped). */
            armourLayers: false,
            /** Damage types that bypass armour unless it stops them. */
            armourIgnoredBy: [],
            /**
             * Critical hits: dice rolled, plus the stamina below 0 (p83), and
             * the compendium table for each damage type. Totals above a
             * table's top result take that result.
             */
            criticals: {
                dice: "1d6",
                pack: "warlock.rollable-tables-warlock",
                tables: {
                    Crushing: "Critical - Crushing",
                    Piercing: "Critical - Piercing",
                    Slashing: "Critical - Slashing",
                    Blast: "Critical - Blast",
                },
            },
        },

        magic: {
            /** Skill used to cast; fallback is tried when the first is missing. */
            skills: ["Incantation"],
            /** A natural 1 makes the caster pay the stamina cost again. */
            natural1PaysCostAgain: false,
            /** Penalty to casting per full point of installed cyberware. */
            cyberwarePenaltyPerPoint: 0,
            /**
             * What a failed second test rolls on after a natural 1 (p92-94).
             * addCostToRoll adds the spell's stamina cost to the d20;
             * followUps roll a further table for particular results.
             */
            miscast: {
                pack: "warlock.rollable-tables-warlock",
                table: "Miscast",
                label: "WARLOCK.Chat.Spell.Miscast",
                addCostToRoll: false,
                followUps: {},
            },
        },

        vehicles: {
            /** The vehicle sheet's skill and capability tests. */
            skillTests: false,
        },

        /** Setting-specific features; Wetwired turns these on. */
        features: {
            ancestry: false,
            wealth: false,
            cyberware: false,
            matrix: false,
            contacts: false,
            firearms: false,
        },
    },

    warpstar: {
        id: "warpstar",

        weapons: {
            types: ["Small", "Medium", "Large"],
            damageTypes: ["Crushing", "Piercing", "Slashing", "Energy", "Ship"],
            skills: ["Blades", "Blunt", "Brawling", "Ship gunner", "Small arms", "Thrown"],
            rangedSkills: ["Small arms", "Ship gunner", "Thrown"],
            unarmed: { pack: "warlock.weapons-warpstar", id: "qoU38GyqIbB5i38w" },
        },

        combat: {
            shields: false,
            pinAndFlank: true,
            rangedAttackerBonus: 0,
            closeRangePenalty: false,
            armourLayers: false,
            armourIgnoredBy: [],
            // 2d6 + negative stamina (p113); ship weapons use the ship table (p126).
            criticals: {
                dice: "2d6",
                pack: "warlock.rollable-tables-warpstar",
                tables: {
                    Crushing: "Critical - Crushing",
                    Piercing: "Critical - Piercing",
                    Slashing: "Critical - Slashing",
                    Energy: "Critical - Energy",
                    Ship: "Critical - Ship",
                },
            },
        },

        magic: {
            skills: ["Warp focus"],
            natural1PaysCostAgain: false,
            cyberwarePenaltyPerPoint: 0,
            // Warp bleed: d20 + the glyph's stamina cost (p152); results 18 and
            // 19 give a lesser or greater mutation (p156-159).
            miscast: {
                pack: "warlock.rollable-tables-warpstar",
                table: "Warp Bleed",
                label: "WARLOCK.Chat.Spell.WarpBleed",
                addCostToRoll: true,
                followUps: {
                    18: "Lesser Mutations",
                    19: "Greater Mutations",
                },
            },
        },

        vehicles: {
            skillTests: true,
        },

        /** Setting-specific features; Wetwired turns these on. */
        features: {
            ancestry: false,
            wealth: false,
            cyberware: false,
            matrix: false,
            contacts: false,
            firearms: false,
        },
    },

    wetwired: {
        id: "wetwired",

        weapons: {
            types: ["Small", "Medium", "Large"],
            // Slashing, piercing, blunt, concussive, energy, matrix (p109).
            damageTypes: ["Slashing", "Piercing", "Blunt", "Concussive", "Energy", "Matrix"],
            skills: ["Melee", "Gunnery", "Primitive Ranged", "Small arms"],
            rangedSkills: ["Gunnery", "Primitive Ranged", "Small arms"],
            unarmed: { pack: "warlock.weapons-wetwired", id: "12DBByUTnIMbTXOj" },
        },

        combat: {
            shields: false,
            pinAndFlank: true,
            // The attacker's +5 applies to ranged attacks too; close and
            // faraway both carry -5 (p107).
            rangedAttackerBonus: 5,
            closeRangePenalty: true,
            // Three armour layers whose dice add together (p112, p166).
            armourLayers: true,
            // Concussive damage ignores armour, except power armour (p109).
            armourIgnoredBy: ["Concussive"],
            /** Fire modes and their to-hit modifier (p165). */
            fireModes: { SA: 0, SS: 0, BF: -3, FA: -6 },
            // 2d6 + negative stamina (p113), six tables (p116-122).
            criticals: {
                dice: "2d6",
                pack: "warlock.rollable-tables-wetwired",
                tables: {
                    Slashing: "Critical - Slashing",
                    Piercing: "Critical - Piercing",
                    Blunt: "Critical - Blunt",
                    Concussive: "Critical - Concussive",
                    Energy: "Critical - Energy",
                    Matrix: "Critical - Matrix",
                },
            },
        },

        magic: {
            skills: ["Sorcery", "Conjuring"],
            // A natural 1 costs the stamina again (p134); -2 per full point of
            // cyberware to Sorcery and Conjuration (p133, p149).
            natural1PaysCostAgain: true,
            cyberwarePenaltyPerPoint: 2,
            // Miscast table (p136).
            miscast: {
                pack: "warlock.rollable-tables-wetwired",
                table: "Miscast",
                label: "WARLOCK.Chat.Spell.Miscast",
                addCostToRoll: false,
                followUps: {},
            },
        },

        vehicles: {
            skillTests: false,
        },

        features: {
            ancestry: true,
            wealth: true,
            cyberware: true,
            matrix: true,
            contacts: true,
            firearms: true,
        },

        /**
         * Ancestry (p16-18): roll 2d6 or choose. Modifiers the automation
         * applies: Dodge, melee attack and ranged attack bonuses, and Stamina
         * and Luck at creation. Others (jumping, tech and social skills,
         * low-light vision, allergies) are shown for the GM to apply.
         */
        ancestry: {
            table: { 2: "Dwarf", 3: "Dwarf", 4: "Elf", 5: "Elf", 6: "Human", 7: "Human", 8: "Human", 9: "Ork", 10: "Ork", 11: "Troll", 12: "Troll" },
            types: {
                Human: {},
                Elf: { notes: "WARLOCK.Ancestry.Notes.Elf" },
                Dwarf: { dodge: 1, notes: "WARLOCK.Ancestry.Notes.Dwarf" },
                Ork: { melee: 1, ranged: -1, allergy: "Sunlight", notes: "WARLOCK.Ancestry.Notes.Ork" },
                Troll: { dodge: -2, melee: 2, stamina: 2, luck: -2, notes: "WARLOCK.Ancestry.Notes.Troll" },
            },
        },

        /** Etiquette types a career or contact belongs to (p27). */
        etiquettes: ["Corporate", "Matrix", "Media", "Street", "Tribal"],

        /** Cyberware categories and the skill whose levels above 4 buy them (p148). */
        cyberware: {
            Headware: "Cybertech: Headware",
            Bodyware: "Cybertech: Bodyware",
        },

        /** Cyberdeck program types (p143-144). */
        programTypes: ["Move", "Attack", "Stealth", "Retrieve", "Obfuscate", "Compromise"],
    },
});

/* -------------------------------------------------------------------------- */

/**
 * The id of the game this world is set to.
 *
 * @returns {GameId}
 */
export function activeGameId() {
    return game.settings.get("warlock", "activeSystem");
}

/**
 * The rules configuration of a game, the active one by default. Unknown ids
 * fall back to Warlock!.
 *
 * @param {GameId} [id]
 * @returns {typeof SYSTEMS.warlock}
 */
export function gameConfig(id = activeGameId()) {
    return SYSTEMS[id] ?? SYSTEMS.warlock;
}

/**
 * The display name of a skill in a game, the active one by default; the key
 * itself when the game has no such skill.
 *
 * @param {string} skill The skill key
 * @param {GameId} [id]
 * @returns {string}
 */
export function skillName(skill, id = activeGameId()) {
    return game.warlock?.skills?.[id]?.[skill] ?? skill;
}

/**
 * The localization key for a weapon skill choice: "Large blade" becomes
 * "WARLOCK.Skills.LargeBlade".
 *
 * @param {string} skill
 * @returns {string}
 */
export function skillLabelKey(skill) {
    const pascal = skill.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
    return `WARLOCK.Skills.${pascal}`;
}

/**
 * Builds a Foundry choices object, with the "—" placeholder first.
 *
 * @param {string[]} values The stored values
 * @param {(value: string) => string} labelKey Maps a value to its localization key
 * @returns {Object<string, string>}
 */
export function choices(values, labelKey) {
    const out = { "—": "—" };
    for (const value of values) out[value] = game.i18n.localize(labelKey(value));
    return out;
}
