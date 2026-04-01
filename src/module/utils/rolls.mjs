/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

const RANGED_SKILLS = {
    warlock: ["Bow", "Crossbow", "Thrown"],
    warpstar: ["Small arms", "Ship gunner", "Thrown"],
    wetwired: ["Gunnery", "Primitive Ranged", "Small arms"],
};

const CRITICAL_TABLES = {
    Slashing: {
        2: "Flat of blade across the skull \u2014 dazed for 1d6 rounds, all actions at \u22122. Double vision for 1d6 days.",
        3: "Slashed on the hip \u2014 falls over, can only crawl for 1d6 rounds, all tests at \u22123.",
        4: "Cut on thigh \u2014 can only hobble for 1d3 days. Endurance test or permanent limp.",
        5: "Foot slashed \u2014 can only hobble for 1d6 days. Toes loose in the boot.",
        6: "Slash on the back \u2014 cannot carry a pack for 1d6 days.",
        7: "1d3 fingers sliced off! Randomly determine hand, drop what you are carrying.",
        8: "Ear slashed! Permanent \u22122 to tests involving hearing.",
        9: "Hacked in the shoulder! Determine which arm \u2014 tests with that arm at \u22125 for 1d6 days.",
        10: "Cut through an artery \u2014 DEAD.",
    },
    Piercing: {
        2: "Jab in the forearm \u2014 Sleight-of-hand test to keep hold of weapon.",
        3: "Skewered rump! All tests at \u22123 for 1d6 rounds.",
        4: "Prod in the guts \u2014 retching for 1d6 rounds, all actions at \u22123.",
        5: "Poked in the neck \u2014 can only gasp and defend at \u22122 for 1d6 rounds.",
        6: "Run through the shoulder \u2014 arm immobilised for 1d6 days.",
        7: "Poked in the mouth \u2014 teeth everywhere. Hard to talk, even uglier than before.",
        8: "My eye! Permanent \u22122 to tests involving sight.",
        9: "Through the hand! Drop weapon. Hand a useless claw for 1d6 days.",
        10: "Stabbed through the heart or brain \u2014 DEAD.",
    },
    Crushing: {
        2: "Rap on the skull \u2014 dazed for 1d6 rounds.",
        3: "Foot crushed \u2014 hops around in agony for 1d6 rounds.",
        4: "Dead leg \u2014 all tests involving movement at \u22123 for 1d3 days.",
        5: "Whack in the guts \u2014 winded, can only defend at \u22123 for 1d6 rounds.",
        6: "Hand crushed (determine which) \u2014 drop what you were carrying, can\u2019t use for 1d6 days.",
        7: "Thumped on the temples \u2014 passes out for 1d6 rounds.",
        8: "Right in the kidney! All tests at \u22125 for 1d6 days.",
        9: "Smack on the chin \u2014 jaw fractured, slurred speech for 1d6 days.",
        10: "Smashed on the skull and brained \u2014 DEAD.",
    },
    Blast: {
        2: "Weapon too hot to touch! Drop it and draw something else.",
        3: "Clothing on fire! Spend 1d6 rounds putting it out.",
        4: "Gear catches fire! Put it out for 1d6 rounds or lose everything.",
        5: "Breathe in fumes \u2014 coughing for 1d6 rounds, all tests at \u22123.",
        6: "Blinded by blast \u2014 permanent \u22122 to tests involving sight.",
        7: "Flung against a wall \u2014 stunned and prone for 1d6 rounds, all tests at \u22123.",
        8: "Hair singed off, scalp raw \u2014 no hats/helmets for 1d6 days, all tests at \u22123.",
        9: "Full in the face \u2014 sense of smell destroyed. Permanent \u22123 to tests involving smell.",
        10: "Skin and bone seared \u2014 DEAD.",
    },
};

function getCriticalEntry(damageType, total) {
    let tableKey = damageType;
    if (!CRITICAL_TABLES[tableKey]) {
        if (tableKey === "Energy") tableKey = "Blast";
        else if (tableKey === "Ship") tableKey = "Blast";
        else tableKey = "Crushing";
    }
    const table = CRITICAL_TABLES[tableKey];
    const clamped = Math.max(2, total);
    const text = (clamped >= 10) ? table[10] : (table[clamped] ?? table[10]);
    const isDead = clamped >= 10;
    return { text, isDead, tableKey };
}

/**
 * Miscast table (1d20). Rolled when a caster rolls a natural 1 on their
 * Incantation test and then fails the saving Incantation re-test.
 */
const MISCAST_TABLE = {
    1:  "The caster\u2019s hands catch fire, causing them 1d6 damage.",
    2:  "Two small horns grow from the caster\u2019s head.",
    3:  "One of the caster\u2019s eyes turns milky white.",
    4:  "The spell discharges incorrectly, hitting the nearest creature for 2d6 damage.",
    5:  "The caster\u2019s fingers elongate on one hand.",
    6:  "Blood runs from the caster\u2019s eyes for 1d6 days.",
    7:  "The spell backfires, blasting the caster across the room for 2d6 damage.",
    8:  "An otherworldly being spies the caster, and appears in 1d3 rounds.",
    9:  "The caster loses the sense of taste \u2014 all food is like ash.",
    10: "The caster\u2019s skin is bleached white.",
    11: "All of the caster\u2019s hair falls out.",
    12: "The caster\u2019s skin becomes translucent for 2d6 days.",
    13: "The caster\u2019s arms are altered, growing small bone spurs.",
    14: "The caster freezes like a statue for the next 1d3 days.",
    15: "A miasma of magical mist fills a nearby space, causing 1d6 damage to all.",
    16: "The caster\u2019s eyes turn jet black for 1d6 weeks.",
    17: "The caster is possessed by an otherworldly being for 1d6 turns.",
    18: "The caster loses the ability to cast spells for 1d6 days \u2014 every attempt miscasts.",
    19: "The caster\u2019s face is frozen in a grimace of pain for 1d6 days.",
    20: "The caster\u2019s arms become covered in small scales.",
};

/* -------------------------------------------------------------------------- */
/* Rolls                                                                       */
/* -------------------------------------------------------------------------- */

export class Rolls {
    static async rollStaminaLossReduction(actor, armour) {
        const roll = new Roll(`${armour.system.reductionRoll}`, {});
        await roll.evaluate({ async: true });
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: game.i18n.format("WARLOCK.Chat.Roll.StaminaLossReduction", { armour: armour.name }),
        });
    }

    /* ---------------------------------------------------------------------- */

    static async rollInitiative() {
        const rollFormula = "1d6";
        let playerRoll = new Roll(rollFormula, {});
        let gmRoll = new Roll(rollFormula, {});
        await playerRoll.evaluate({ async: true });
        await gmRoll.evaluate({ async: true });
        while (playerRoll.total === gmRoll.total) {
            playerRoll = await playerRoll.reroll({ async: true });
            gmRoll = await gmRoll.reroll({ async: true });
        }
        await playerRoll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: game.i18n.localize("WARLOCK.Chat.Roll.InitiativePlayers"),
        });
        await gmRoll.toMessage({
            speaker: ChatMessage.getSpeaker(),
            flavor: game.i18n.localize("WARLOCK.Chat.Roll.InitiativeGamesMaster"),
        });
        return {
            winner: (playerRoll.total > gmRoll.total) ? "players" : "gm",
            playersTotal: playerRoll.total,
            gmTotal: gmRoll.total,
        };
    }

    /* ---------------------------------------------------------------------- */

    static async rollPluckEvent(actor, pluck) {
        const roll = new Roll("2d6 + @pluck", { pluck });
        await roll.evaluate({ async: true });
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: game.i18n.localize("WARLOCK.Chat.Roll.PluckEvent"),
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a Luck test and automatically deducts 1 Luck regardless of the
     * outcome (per the rules: "you deduct one from your Luck score for the
     * rest of the adventure").
     *
     * @param {WarlockActor} actor The actor testing their luck
     */
    static async rollLuckTest(actor) {
        const currentLuck = actor.system.resources.luck.value;

        // Roll 1d20 + Luck as a basic test (>= 20 succeeds).
        const roll = new Roll("1d20 + @luck", { luck: currentLuck });
        await roll.evaluate({ async: true });

        const success = roll.total >= 20;

        // Deduct 1 Luck (minimum 0).
        const newLuck = Math.max(0, currentLuck - 1);
        await actor.update({
            system: { resources: { luck: { value: newLuck } } },
        });

        // Build a chat card with the result and the deduction notice.
        const resultLabel = success
            ? game.i18n.localize("WARLOCK.Chat.Luck.Success")
            : game.i18n.localize("WARLOCK.Chat.Luck.Failure");

        const content = `<div class="warlock chat-card chat-card--luck-test">
            <p class="luck-test__result ${success ? "luck-test__result--success" : "luck-test__result--fail"}">
                <strong>${resultLabel}</strong>
            </p>
            <p class="luck-test__deduction">
                ${game.i18n.format("WARLOCK.Chat.Luck.Deducted", { old: currentLuck, new: newLuck })}
            </p>
        </div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: game.i18n.format("WARLOCK.Chat.Roll.SkillTestBasic", {
                name: game.i18n.localize("WARLOCK.Resources.Luck"),
                level: currentLuck,
            }),
            content,
            rolls: [roll],
            sound: CONFIG.sounds.dice,
            flags: { warlock: { isBasicTest: true, isLuckTest: true } },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Short rest: recover half of lost stamina. Per the rules: "Characters
     * recover half their lost stamina as soon as they take half an hour to
     * catch their breath."
     *
     * @param {WarlockActor} actor
     */
    static async restShort(actor) {
        const current = actor.system.resources.stamina.value;
        const max = actor.system.resources.stamina.max;
        const lost = max - current;
        const recovered = Math.floor(lost / 2);
        const newStamina = Math.min(max, current + recovered);

        if (recovered <= 0) {
            ui.notifications.info(
                game.i18n.localize("WARLOCK.Notifications.NoStaminaToRecover"),
            );
            return;
        }

        await actor.update({
            system: { resources: { stamina: { value: newStamina } } },
        });

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div class="warlock chat-card chat-card--rest">
                <p>🛏 <strong>${game.i18n.localize("WARLOCK.Chat.Rest.ShortRest")}</strong></p>
                <p>${game.i18n.format("WARLOCK.Chat.Rest.Recovered", { recovered, old: current, new: newStamina, max })}</p>
            </div>`,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Long rest: recover all stamina. Per the rules: "The remaining stamina
     * is recovered after a good night's sleep."
     *
     * @param {WarlockActor} actor
     */
    static async restLong(actor) {
        const current = actor.system.resources.stamina.value;
        const max = actor.system.resources.stamina.max;
        const recovered = max - current;

        if (recovered <= 0) {
            ui.notifications.info(
                game.i18n.localize("WARLOCK.Notifications.NoStaminaToRecover"),
            );
            return;
        }

        await actor.update({
            system: { resources: { stamina: { value: max } } },
        });

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div class="warlock chat-card chat-card--rest">
                <p>🌙 <strong>${game.i18n.localize("WARLOCK.Chat.Rest.LongRest")}</strong></p>
                <p>${game.i18n.format("WARLOCK.Chat.Rest.Recovered", { recovered, old: current, new: max, max })}</p>
            </div>`,
        });
    }

    /* ---------------------------------------------------------------------- */

    static async rollSkillTest(actor, name, level, options = {}) {
        if (!options.skipDialog) {
            options = await Rolls._getSkillTestOptions(name, options);
            if (options.cancelled) return;
        }
        const modifier = options.modifier ?? 0;
        const flavor = options.isBasicTest
            ? game.i18n.format("WARLOCK.Chat.Roll.SkillTestBasic", { name, level })
            : game.i18n.format("WARLOCK.Chat.Roll.SkillTestOpposed", { name, level });
        let formula = "1d20 + @level";
        if (modifier > 0) formula += " + @modifier";
        else if (modifier < 0) formula += " - @modifier";
        const roll = new Roll(formula, { level, modifier: Math.abs(modifier) });
        await roll.evaluate({ async: true });
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor,
            flags: { warlock: { isBasicTest: options.isBasicTest } },
        });
    }

    /* ---------------------------------------------------------------------- */

    static async rollDamage(actor, weapon) {
        const roll = new Roll(`max(${weapon.system.damage.roll}, 1)`, {});
        await roll.evaluate({ async: true });
        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: game.i18n.format("WARLOCK.Chat.Roll.Damage", {
                weapon: weapon.name,
                damageType: weapon.system.damage.type.choices[weapon.system.damage.type.value],
            }),
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Performs a spell casting test with full Wrath of the Otherworld
     * automation.
     *
     * Flow:
     * 1. Roll 1d20 + Incantation (or Warp Focus) — the casting test.
     * 2. Total >= 20 → spell succeeds.
     *    Total < 20 → spell fails.
     * 3. If the d20 shows a NATURAL 1 → Wrath of the Otherworld:
     *    a. Auto-roll a second Incantation test (the saving throw).
     *    b. If the save succeeds (>= 20): close call, no miscast.
     *    c. If the save fails (< 20): MISCAST — roll 1d20 on the
     *       miscast table and display the result.
     *
     * Everything is shown in a single chat card.
     *
     * @param {WarlockActor} actor     The casting actor
     * @param {string}       skillName Localised skill name
     * @param {number}       skillLevel The actor's skill level
     * @param {object}       [options]
     * @param {string}       [options.spellName] Name of the spell being cast
     * @param {number}       [options.staminaCost] Stamina cost (auto-deducted)
     */
    static async rollSpellTest(actor, skillName, skillLevel, options = {}) {
        // Optional modifier dialog.
        let modifier = 0;
        if (!options.skipDialog) {
            const dialogOpts = await Rolls._getSkillTestOptions(skillName, {
                showCombatOptions: false,
            });
            if (dialogOpts.cancelled) return;
            modifier = dialogOpts.modifier ?? 0;
        }

        // --- Auto-deduct stamina cost if provided ---
        const staminaCost = options.staminaCost ?? 0;
        if (staminaCost > 0) {
            const currentStamina = actor.system.resources?.stamina?.value ?? 0;
            if (currentStamina < staminaCost) {
                ui.notifications.error(
                    game.i18n.localize("WARLOCK.Notifications.StaminaCost"),
                );
                return;
            }
            await actor.update({
                system: { resources: { stamina: { value: currentStamina - staminaCost } } },
            });
        }

        // --- Casting roll ---
        let formula = "1d20 + @level";
        if (modifier > 0) formula += " + @modifier";
        else if (modifier < 0) formula += " - @modifier";

        const castRoll = new Roll(formula, {
            level: skillLevel,
            modifier: Math.abs(modifier),
        });
        await castRoll.evaluate({ async: true });

        const allRolls = [castRoll];

        // Extract the natural d20 result.
        const naturalD20 = castRoll.dice[0]?.total ?? castRoll.total;
        const castTotal = castRoll.total;
        const castSuccess = castTotal >= 20;
        const isNatural1 = naturalD20 === 1;

        // --- Build result data ---
        const result = {
            spellName: options.spellName ?? "",
            skillName,
            skillLevel,
            modifier,
            castTotal,
            castSuccess,
            naturalD20,
            isNatural1,
            staminaCost,
            staminaDeducted: staminaCost > 0,
            // Wrath fields — populated below if triggered.
            wrathTriggered: false,
            saveTotal: null,
            saveSuccess: false,
            miscast: false,
            miscastRoll: null,
            miscastText: "",
        };

        // --- Wrath of the Otherworld (natural 1) ---
        if (isNatural1) {
            result.wrathTriggered = true;

            // Second Incantation test — the saving throw.
            const saveRoll = new Roll("1d20 + @level", { level: skillLevel });
            await saveRoll.evaluate({ async: true });
            allRolls.push(saveRoll);

            result.saveTotal = saveRoll.total;
            result.saveSuccess = saveRoll.total >= 20;

            if (!result.saveSuccess) {
                // MISCAST — roll 1d20 on the miscast table.
                result.miscast = true;
                const miscastRoll = new Roll("1d20");
                await miscastRoll.evaluate({ async: true });
                allRolls.push(miscastRoll);

                result.miscastRoll = miscastRoll.total;
                result.miscastText = MISCAST_TABLE[miscastRoll.total]
                    ?? MISCAST_TABLE[20];
            }
        }

        // --- Render chat card ---
        const cardContent = await renderTemplate(
            "systems/warlock/templates/chat/spell-test-card.hbs",
            result,
        );

        const flavor = options.spellName
            ? game.i18n.format("WARLOCK.Chat.Spell.FlavorNamed", {
                spell: options.spellName,
                skill: skillName,
                level: skillLevel,
            })
            : game.i18n.format("WARLOCK.Chat.Roll.SkillTestBasic", {
                name: skillName,
                level: skillLevel,
            });

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor,
            content: cardContent,
            rolls: allRolls,
            sound: CONFIG.sounds.dice,
            flags: {
                warlock: {
                    isSpellTest: true,
                    isBasicTest: true,
                    isMiscast: result.miscast,
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    static isRangedWeapon(weapon) {
        const activeSystem = game.settings.get("warlock", "activeSystem");
        return (RANGED_SKILLS[activeSystem] || []).includes(weapon.system.skill.value);
    }

    /* ---------------------------------------------------------------------- */

    static getActorWeaponSkill(actor, weapon) {
        const activeSystem = game.settings.get("warlock", "activeSystem");
        const skillKey = weapon.system.skill.value;
        if (actor.type === "Monster") {
            return {
                skillName: game.i18n.localize("WARLOCK.Skills.WeaponSkill"),
                skillLevel: actor.system.weaponSkill ?? 0,
            };
        }
        return {
            skillName: game.warlock.skills[activeSystem]?.[skillKey] ?? skillKey,
            skillLevel: actor.system.adventuringSkills?.[skillKey] ?? 0,
        };
    }

    /* ---------------------------------------------------------------------- */

    static getDefenderCombatInfo(defenderActor, isRanged) {
        const activeSystem = game.settings.get("warlock", "activeSystem");
        if (isRanged) {
            if (defenderActor.type === "Monster") {
                return {
                    skillName: game.i18n.localize("WARLOCK.Skills.AdventuringSkills"),
                    skillLevel: defenderActor.system.adventuringSkills ?? 0,
                    weapon: null, damageFormula: "", damageType: "",
                };
            }
            return {
                skillName: game.warlock.skills[activeSystem]?.["Dodge"] ?? "Dodge",
                skillLevel: defenderActor.system.adventuringSkills?.["Dodge"] ?? 0,
                weapon: null, damageFormula: "", damageType: "",
            };
        }
        // Melee.
        const equippedWeapons = defenderActor.items.filter(
            i => i.type === "Weapon" && i.system.isEquipped,
        );
        const defWeapon = equippedWeapons[0] ?? null;
        if (defenderActor.type === "Monster") {
            return {
                skillName: game.i18n.localize("WARLOCK.Skills.WeaponSkill"),
                skillLevel: defenderActor.system.weaponSkill ?? 0,
                weapon: defWeapon,
                damageFormula: defWeapon?.system.damage.roll ?? "1d6-2",
                damageType: defWeapon?.system.damage.type.value ?? "Crushing",
            };
        }
        if (defWeapon) {
            const sk = defWeapon.system.skill.value;
            return {
                skillName: game.warlock.skills[activeSystem]?.[sk] ?? sk,
                skillLevel: defenderActor.system.adventuringSkills?.[sk] ?? 0,
                weapon: defWeapon,
                damageFormula: defWeapon.system.damage.roll,
                damageType: defWeapon.system.damage.type.value,
            };
        }
        return {
            skillName: game.warlock.skills[activeSystem]?.["Brawling"] ?? "Brawling",
            skillLevel: defenderActor.system.adventuringSkills?.["Brawling"] ?? 0,
            weapon: null, damageFormula: "1d6-2", damageType: "Crushing",
        };
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Fully automated combat attack: opposed rolls, damage, armour, mighty
     * strike, critical hits. Falls back to a simpler card with Apply Damage
     * buttons when no tokens are targeted.
     */
    static async rollCombatAttack(attacker, options = {}) {
        const activeSystem = game.settings.get("warlock", "activeSystem");
        const targets = [...game.user.targets];

        if (!targets.length) {
            if (options.selectedWeaponId) {
                const w = attacker.items.get(options.selectedWeaponId);
                if (w) return Rolls._rollSimpleAttack(attacker, w, options);
            }
            ui.notifications.warn(game.i18n.localize("WARLOCK.Notifications.NoTargetsSelected"));
            return;
        }

        const equippedWeapons = attacker.items.filter(
            i => i.type === "Weapon" && i.system.isEquipped
                && i.system.skill.value && i.system.skill.value !== "\u2014",
        );
        if (!equippedWeapons.length) {
            ui.notifications.warn(game.i18n.localize("WARLOCK.Notifications.NoEquippedWeapons"));
            return;
        }

        const setup = await Rolls._getAttackSetupOptions(attacker, equippedWeapons, targets, options);
        if (setup.cancelled) return;

        const weapon = attacker.items.get(setup.weaponId);
        const targetToken = targets.find(t => t.id === setup.targetTokenId) ?? targets[0];
        const defenderActor = targetToken.actor;
        if (!weapon || !defenderActor) return;

        const isRanged = Rolls.isRangedWeapon(weapon);
        const atkInfo = Rolls.getActorWeaponSkill(attacker, weapon);

        // Attacker modifiers.
        let atkMod = setup.modifier ?? 0;
        if (!isRanged) atkMod += 5;
        if (isRanged && setup.faraway) atkMod -= 5;
        if (setup.flanking === "flanking") atkMod += 5;
        if (setup.flanking === "flanked") atkMod -= 5;
        if (setup.pinned) atkMod -= 5;

        const atkRoll = new Roll("1d20 + @level + @mod", { level: atkInfo.skillLevel, mod: atkMod });
        await atkRoll.evaluate({ async: true });

        // Defender modifiers.
        const defInfo = Rolls.getDefenderCombatInfo(defenderActor, isRanged);
        let defMod = 0;
        if (isRanged && activeSystem === "warlock") {
            if (setup.defenderShield === "small") defMod += 3;
            if (setup.defenderShield === "large") defMod += 5;
        }
        const defRoll = new Roll("1d20 + @level + @mod", { level: defInfo.skillLevel, mod: defMod });
        await defRoll.evaluate({ async: true });

        const atkTotal = atkRoll.total;
        const defTotal = defRoll.total;
        const isDraw = atkTotal === defTotal;
        const attackerWins = atkTotal > defTotal;
        const allRolls = [atkRoll, defRoll];

        const result = {
            attackType: isRanged ? "Ranged" : "Melee",
            weaponImg: weapon.img, weaponName: weapon.name,
            attackerName: attacker.name,
            attackerSkillName: atkInfo.skillName,
            attackerSkillLevel: atkInfo.skillLevel,
            attackerModifier: atkMod, attackerTotal: atkTotal,
            defenderName: targetToken.name,
            defenderSkillName: defInfo.skillName,
            defenderSkillLevel: defInfo.skillLevel,
            defenderModifier: defMod, defenderTotal: defTotal,
            isDraw, attackerWins, hasDamage: false, rangedMiss: false,
            defenderCounterAttack: false,
        };

        if (!isDraw) {
            const winTotal = attackerWins ? atkTotal : defTotal;
            const loseTotal = attackerWins ? defTotal : atkTotal;
            const mighty = winTotal >= 3 * loseTotal;

            if (attackerWins) {
                await Rolls._resolveDamage(result, allRolls, attacker, defenderActor, targetToken, weapon, mighty);
            } else if (!isRanged) {
                await Rolls._resolveCounterDamage(result, allRolls, defenderActor, attacker, targetToken, defInfo, mighty);
            } else {
                result.rangedMiss = true;
            }
        }

        const cardContent = await renderTemplate(
            "systems/warlock/templates/chat/combat-result-card.hbs", result,
        );
        const flavor = isRanged
            ? game.i18n.format("WARLOCK.Chat.Combat.FlavourRanged", { weapon: weapon.name })
            : game.i18n.format("WARLOCK.Chat.Combat.FlavourMelee", { weapon: weapon.name });

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: attacker }),
            flavor, content: cardContent, rolls: allRolls,
            sound: CONFIG.sounds.dice,
            flags: { warlock: { isCombatAttack: true } },
        });
    }

    /* ---------------------------------------------------------------------- */

    /** @private */
    static async _resolveDamage(result, allRolls, attacker, defenderActor, targetToken, weapon, isMightyStrike) {
        const damageRoll = new Roll(`max(${weapon.system.damage.roll}, 1)`, {});
        await damageRoll.evaluate({ async: true });
        allRolls.push(damageRoll);

        const damageType = weapon.system.damage.type.value;
        const damageTypeName = weapon.system.damage.type.choices?.[damageType] ?? damageType;
        let grossDamage = damageRoll.total;
        if (isMightyStrike) grossDamage *= 2;

        const armour = defenderActor.items.find(i => i.type === "Armour" && i.system.isEquipped);
        let armourReduction = 0;
        if (armour?.system.reductionRoll) {
            const aRoll = new Roll(armour.system.reductionRoll, {});
            await aRoll.evaluate({ async: true });
            armourReduction = aRoll.total;
            allRolls.push(aRoll);
        }

        const netDamage = Math.max(1, grossDamage - armourReduction);
        const oldStamina = defenderActor.system.resources?.stamina?.value ?? 0;
        const newStamina = oldStamina - netDamage;
        await defenderActor.update({ system: { resources: { stamina: { value: newStamina } } } });

        Object.assign(result, {
            hasDamage: true,
            winnerName: attacker.name, loserName: targetToken.name,
            loserActorId: defenderActor.id, loserTokenId: targetToken.id,
            damageWeaponName: weapon.name,
            damageRollFormula: weapon.system.damage.roll,
            rawDamage: damageRoll.total, damageTypeName, damageType,
            isMightyStrike, finalDamage: grossDamage,
            hasArmour: !!armour, armourName: armour?.name ?? "", armourReduction,
            netDamage, oldStamina, newStamina,
        });

        if (newStamina < 0) {
            const critMod = Math.abs(newStamina);
            const critRoll = new Roll("1d6 + @mod", { mod: critMod });
            await critRoll.evaluate({ async: true });
            allRolls.push(critRoll);
            const crit = getCriticalEntry(damageType, critRoll.total);
            Object.assign(result, {
                isCritical: true, critModifier: critMod, critTotal: critRoll.total,
                criticalText: crit.text, critTableKey: crit.tableKey, isDead: crit.isDead,
            });
        }
    }

    /* ---------------------------------------------------------------------- */

    /** @private */
    static async _resolveCounterDamage(result, allRolls, defenderActor, attackerActor, targetToken, defInfo, isMightyStrike) {
        const formula = defInfo.damageFormula || "1d6-2";
        const damageType = defInfo.damageType || "Crushing";
        const damageRoll = new Roll(`max(${formula}, 1)`, {});
        await damageRoll.evaluate({ async: true });
        allRolls.push(damageRoll);

        const damageTypeName = defInfo.weapon?.system.damage.type.choices?.[damageType] ?? damageType;
        let grossDamage = damageRoll.total;
        if (isMightyStrike) grossDamage *= 2;

        const armour = attackerActor.items.find(i => i.type === "Armour" && i.system.isEquipped);
        let armourReduction = 0;
        if (armour?.system.reductionRoll) {
            const aRoll = new Roll(armour.system.reductionRoll, {});
            await aRoll.evaluate({ async: true });
            armourReduction = aRoll.total;
            allRolls.push(aRoll);
        }

        const netDamage = Math.max(1, grossDamage - armourReduction);
        const oldStamina = attackerActor.system.resources?.stamina?.value ?? 0;
        const newStamina = oldStamina - netDamage;
        await attackerActor.update({ system: { resources: { stamina: { value: newStamina } } } });

        Object.assign(result, {
            hasDamage: true, defenderCounterAttack: true,
            winnerName: targetToken.name, loserName: attackerActor.name,
            loserActorId: attackerActor.id, loserTokenId: null,
            damageWeaponName: defInfo.weapon?.name ?? game.i18n.localize("WARLOCK.Items.Weapon.Unarmed"),
            damageRollFormula: formula,
            rawDamage: damageRoll.total, damageTypeName, damageType,
            isMightyStrike, finalDamage: grossDamage,
            hasArmour: !!armour, armourName: armour?.name ?? "", armourReduction,
            netDamage, oldStamina, newStamina,
        });

        if (newStamina < 0) {
            const critMod = Math.abs(newStamina);
            const critRoll = new Roll("1d6 + @mod", { mod: critMod });
            await critRoll.evaluate({ async: true });
            allRolls.push(critRoll);
            const crit = getCriticalEntry(damageType, critRoll.total);
            Object.assign(result, {
                isCritical: true, critModifier: critMod, critTotal: critRoll.total,
                criticalText: crit.text, critTableKey: crit.tableKey, isDead: crit.isDead,
            });
        }
    }

    /* ---------------------------------------------------------------------- */

    /** @private - Simple attack card fallback when no targets are selected. */
    static async _rollSimpleAttack(attacker, weapon, options = {}) {
        const atkInfo = Rolls.getActorWeaponSkill(attacker, weapon);
        if (!options.skipDialog) {
            options = await Rolls._getSkillTestOptions(atkInfo.skillName, { ...options, showCombatOptions: true });
            if (options.cancelled) return;
        }
        const modifier = options.modifier ?? 0;
        let formula = "1d20 + @level";
        if (modifier > 0) formula += " + @modifier";
        else if (modifier < 0) formula += " - @modifier";
        const attackRoll = new Roll(formula, { level: atkInfo.skillLevel, modifier: Math.abs(modifier) });
        await attackRoll.evaluate({ async: true });
        const damageRoll = new Roll(`max(${weapon.system.damage.roll}, 1)`, {});
        await damageRoll.evaluate({ async: true });
        const damageTypeName = weapon.system.damage.type.choices?.[weapon.system.damage.type.value] ?? weapon.system.damage.type.value;
        const cardContent = await renderTemplate("systems/warlock/templates/chat/attack-card.hbs", {
            weaponImg: weapon.img, weaponName: weapon.name,
            skillName: atkInfo.skillName, skillLevel: atkInfo.skillLevel,
            damageFormula: weapon.system.damage.roll, damageTypeName,
            weaponTypeName: "", damageTotal: damageRoll.total,
            damageType: weapon.system.damage.type.value, actorId: attacker.id,
        });
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: attacker }),
            flavor: game.i18n.format("WARLOCK.Chat.Attack.Flavor", {
                weapon: weapon.name, skill: atkInfo.skillName,
                level: atkInfo.skillLevel, testType: game.i18n.localize("WARLOCK.Dialogs.SkillTest.OpposedTest"),
            }),
            content: cardContent, rolls: [attackRoll, damageRoll],
            sound: CONFIG.sounds.dice,
            flags: { warlock: { isWeaponAttack: true, damageTotal: damageRoll.total, damageType: weapon.system.damage.type.value } },
        });
    }

    /* ---------------------------------------------------------------------- */

    static async applyDamageToTargets(grossDamage, damageType, options = {}) {
        const targets = game.user.targets;
        if (!targets.size) {
            ui.notifications.warn(game.i18n.localize("WARLOCK.Notifications.NoTargetsSelected"));
            return;
        }
        if (options.half) grossDamage = Math.max(1, Math.ceil(grossDamage / 2));
        for (const token of targets) {
            const actor = token.actor;
            if (!actor) continue;
            const armour = actor.items.find(i => i.type === "Armour" && i.system.isEquipped);
            let armourReduction = 0;
            if (armour?.system.reductionRoll) {
                const r = new Roll(armour.system.reductionRoll, {});
                await r.evaluate({ async: true });
                armourReduction = r.total;
            }
            const netDamage = Math.max(1, grossDamage - armourReduction);
            const cur = actor.system.resources?.stamina?.value ?? 0;
            const nw = cur - netDamage;
            await actor.update({ system: { resources: { stamina: { value: nw } } } });
            const parts = [];
            parts.push(game.i18n.format("WARLOCK.Chat.Attack.DamageAppliedGross", { damage: grossDamage, target: token.name }));
            if (armour) parts.push(game.i18n.format("WARLOCK.Chat.Attack.ArmourReduced", { armour: armour.name, reduction: armourReduction }));
            parts.push(game.i18n.format("WARLOCK.Chat.Attack.NetStaminaLoss", { net: netDamage, newStamina: nw }));
            if (nw < 0) parts.push(game.i18n.format("WARLOCK.Chat.Attack.CriticalWarning", { negative: Math.abs(nw) }));
            await ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ token: token.document }),
                content: `<div class="warlock chat-card chat-card--damage-summary">${parts.map(p=>`<p>${p}</p>`).join("")}</div>`,
                whisper: game.users.filter(u => u.isGM).map(u => u.id),
            });
        }
    }

    /* ---------------------------------------------------------------------- */

    /** @private */
    static async _getAttackSetupOptions(attacker, equippedWeapons, targets, options = {}) {
        const activeSystem = game.settings.get("warlock", "activeSystem");
        const selectedWeaponId = options.selectedWeaponId ?? equippedWeapons[0]?.id;
        const selectedWeapon = equippedWeapons.find(w => w.id === selectedWeaponId) ?? equippedWeapons[0];
        const isRanged = selectedWeapon ? Rolls.isRangedWeapon(selectedWeapon) : false;
        const weaponChoices = equippedWeapons.map(w => ({
            id: w.id,
            label: `${w.name} \u2014 ${w.system.damage.roll} ${w.system.damage.type.choices?.[w.system.damage.type.value] ?? ""}${Rolls.isRangedWeapon(w) ? " (Ranged)" : " (Melee)"}`,
            selected: w.id === selectedWeaponId,
        }));
        const targetChoices = targets.map(t => ({
            id: t.id,
            label: `${t.name} (Stamina: ${t.actor?.system.resources?.stamina?.value ?? "?"})`,
            selected: targets.length === 1,
        }));
        const content = await renderTemplate("systems/warlock/templates/dialogs/attack-setup-dialog.hbs", {
            weapons: weaponChoices, targets: targetChoices,
            showWeaponChoice: equippedWeapons.length > 1,
            showTargetChoice: targets.length > 1,
            isRanged, activeSystem,
            showDefenderShield: activeSystem === "warlock",
            showFlanking: activeSystem === "warpstar" || activeSystem === "wetwired",
        });
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("WARLOCK.Dialogs.AttackSetup.Title"),
                content,
                buttons: {
                    cancel: {
                        icon: "<i class=\"fas fa-times\"></i>",
                        label: game.i18n.localize("WARLOCK.Dialogs.SkillTest.Cancel"),
                        callback: () => resolve({ cancelled: true }),
                    },
                    attack: {
                        icon: "<i class=\"fas fa-crosshairs\"></i>",
                        label: game.i18n.localize("WARLOCK.Dialogs.AttackSetup.Attack"),
                        callback: (html) => {
                            const form = html[0].querySelector("form");
                            resolve({
                                weaponId: form.weaponId?.value ?? selectedWeaponId,
                                targetTokenId: form.targetTokenId?.value ?? targets[0]?.id,
                                modifier: parseInt(form.modifier?.value) || 0,
                                faraway: form.faraway?.checked ?? false,
                                defenderShield: form.defenderShield?.value ?? "none",
                                flanking: form.flankingChoice?.value ?? "none",
                                pinned: form.pinned?.checked ?? false,
                            });
                        },
                    },
                },
                default: "attack",
                close: () => resolve({ cancelled: true }),
            }, null).render(true);
        });
    }

    /* ---------------------------------------------------------------------- */

    static async pullCritical(actorId) {
        const actor = game.actors.get(actorId);
        if (!actor) return;
        await actor.update({ system: { resources: { stamina: { value: 0 } } } });
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `<div class="warlock chat-card"><p><em>${game.i18n.format("WARLOCK.Chat.Combat.CriticalPulled", { name: actor.name })}</em></p></div>`,
        });
    }

    /* ---------------------------------------------------------------------- */

    static async _getSkillTestOptions(skill, options) {
        function handleSkillTestOptions(form, isBasicTest) {
            const activeSystem = game.settings.get("warlock", "activeSystem");
            let modifier = parseInt(form.modifier.value);
            if (options.showVehicleCombatCapabilities) {
                switch (form.vehicleCombatCapabilityChoice.value) {
                    case "shipGun": modifier += options.shipGun; break;
                    case "antiPersonnelGun": modifier += options.antiPersonnelGun; break;
                }
            }
            if (options.showCombatOptions) {
                if (form.initiatedMeleeAttack.checked) modifier += 5;
                if (form.rangedTargetFaraway.checked) modifier -= 5;
                if (activeSystem === "warlock") {
                    switch (form.shieldChoice.value) {
                        case "small": modifier += 3; break;
                        case "large": modifier += 5; break;
                    }
                } if (activeSystem === "wetwired") {
                    if (form.pinned.checked) modifier -= 5;
                    switch (form.flankingChoice.value) {
                        case "flanking": modifier += 5; break;
                        case "flanked": modifier -= 5; break;
                    }
                } else if (activeSystem === "warpstar") {
                    if (form.pinned.checked) modifier -= 5;
                    switch (form.flankingChoice.value) {
                        case "flanking": modifier += 5; break;
                        case "flanked": modifier -= 5; break;
                    }
                }
            }
            return { modifier, isBasicTest };
        }
        const content = await renderTemplate("systems/warlock/templates/dialogs/skill-test-dialog.hbs", {
            activeSystem: game.settings.get("warlock", "activeSystem"),
            baseModifier: options.baseModifier ?? 0,
            showVehicleCombatCapabilities: options.showVehicleCombatCapabilities,
            vehicleCombatCapabilityChoices: {
                "none": game.i18n.localize("WARLOCK.Dialogs.SkillTest.VehicleCombatCapabilityChoices.None"),
                "shipGun": game.i18n.localize("WARLOCK.Dialogs.SkillTest.VehicleCombatCapabilityChoices.ShipGun"),
                "antiPersonnelGun": game.i18n.localize("WARLOCK.Dialogs.SkillTest.VehicleCombatCapabilityChoices.AntiPersonnelGun"),
            },
            showCombatOptions: options.showCombatOptions,
            shieldChoices: {
                "none": game.i18n.localize("WARLOCK.Dialogs.SkillTest.ShieldChoices.None"),
                "small": game.i18n.localize("WARLOCK.Dialogs.SkillTest.ShieldChoices.Small"),
                "large": game.i18n.localize("WARLOCK.Dialogs.SkillTest.ShieldChoices.Large"),
            },
            flankingChoices: {
                "none": game.i18n.localize("WARLOCK.Dialogs.SkillTest.FlankingChoices.None"),
                "flanking": game.i18n.localize("WARLOCK.Dialogs.SkillTest.FlankingChoices.Flanking"),
                "flanked": game.i18n.localize("WARLOCK.Dialogs.SkillTest.FlankingChoices.Flanked"),
            },
        });
        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.format("WARLOCK.Dialogs.SkillTest.Title", { skill }),
                content,
                buttons: {
                    opposed: {
                        icon: "<i class=\"fas fa-users\"></i>",
                        label: game.i18n.localize("WARLOCK.Dialogs.SkillTest.OpposedTest"),
                        callback: (html) => resolve(handleSkillTestOptions(html[0].querySelector("form"), false)),
                    },
                    cancel: {
                        icon: "<i class=\"fas fa-times\"></i>",
                        label: game.i18n.localize("WARLOCK.Dialogs.SkillTest.Cancel"),
                        callback: () => resolve({ cancelled: true }),
                    },
                    basic: {
                        icon: "<i class=\"fas fa-user\"></i>",
                        label: game.i18n.localize("WARLOCK.Dialogs.SkillTest.BasicTest"),
                        callback: (html) => resolve(handleSkillTestOptions(html[0].querySelector("form"), true)),
                    },
                },
                default: "cancel",
                close: () => resolve({ cancelled: true }),
            }, null).render(true);
        });
    }
}
