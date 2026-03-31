/**
 * Handles the various rolls across the system.
 */
export class Rolls {
    /**
     * Rolls the stamina reduction for a given piece of armour and creates a
     * ChatMessage for it.
     *
     * @param {WarlockActor} actor The Actor object of the character
     * @param {WarlockItem} armour The WarlockItem corresponding to the armour
     */
    static async rollStaminaLossReduction(actor, armour) {
        const roll = new Roll(
            `${armour.system.reductionRoll}`,
            {},
        );

        await roll.evaluate({
            async: true,
        });

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({
                actor: actor,
            }),
            flavor: game.i18n.format("WARLOCK.Chat.Roll.StaminaLossReduction", {
                armour: armour.name,
            }),
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls the initiative to determine which side acts first in combat and
     * creates a ChatMessage for it.
     *
     * @returns {Promise<{winner: "players"|"gm", playersTotal: number, gmTotal: number}>}
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

        // Reroll both rolls until neither are equal.
        while (playerRoll.total === gmRoll.total) {
            playerRoll = await playerRoll.reroll({
                async: true,
            });
            gmRoll = await gmRoll.reroll({
                async: true,
            });
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

    /**
     * Rolls for a generic Pluck event using the given Pluck.
     *
     * @param {WarlockActor} actor The Actor object of the character
     * @param {number} pluck The character's current Pluck
     */
    static async rollPluckEvent(actor, pluck) {
        const rollFormula = "2d6 + @pluck";
        const roll = new Roll(rollFormula, {
            pluck: pluck,
        });

        await roll.evaluate({
            async: true,
        });

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({
                actor: actor,
            }),
            flavor: game.i18n.localize("WARLOCK.Chat.Roll.PluckEvent"),
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
     * @param {object} [options] The options for the skill test
     * @param {number} [options.baseModifier] The base modifier for the roll
     * @param {boolean} [options.showVehicleCombatCapabilities] True if the dialog should display vehicle combat capabilities
     * @param {number} [options.shipGun] The vehicle's ship gun modifier
     * @param {number} [options.antiPersonnelGun] The vehicle's anti-personnel gun modifier
     * @param {boolean} [options.isBasicTest] True if the dialog is skipped and a basic test should be made
     * @param {boolean} [options.showCombatOptions] True if the dialog should display combat options
     * @param {boolean} [options.skipDialog] True if the dialog should be skipped
     */
    static async rollSkillTest(actor, name, level, options = {}) {
        if (!options.skipDialog) {
            options = await Rolls._getSkillTestOptions(name, options);

            // Exit early if the skill test was cancelled.
            if (options.cancelled) {
                return;
            }
        }

        const modifier = options.modifier ?? 0;

        const flavor = options.isBasicTest
            ? game.i18n.format("WARLOCK.Chat.Roll.SkillTestBasic", {
                name: name,
                level: level,
            })
            : game.i18n.format("WARLOCK.Chat.Roll.SkillTestOpposed", {
                name: name,
                level: level,
            });

        let formula = "1d20 + @level";

        if (modifier > 0) {
            formula += " + @modifier";
        } else if (modifier < 0) {
            formula += " - @modifier";
        }

        const roll = new Roll(formula, {
            level: level,
            modifier: Math.abs(modifier),
        });

        await roll.evaluate({
            async: true,
        });

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({
                actor: actor,
            }),
            flavor: flavor,
            flags: {
                warlock: {
                    isBasicTest: options.isBasicTest,
                },
            },
        });
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
            `max(${weapon.system.damage.roll}, 1)`,
            {},
        );

        await roll.evaluate({
            async: true,
        });

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({
                actor: actor,
            }),
            flavor: game.i18n.format("WARLOCK.Chat.Roll.Damage", {
                weapon: weapon.name,
                damageType: weapon.system.damage.type.choices[weapon.system.damage.type.value],
            }),
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Performs an integrated weapon attack: skill test + damage roll in a single
     * chat card with an "Apply Damage" button.
     *
     * The skill test uses the weapon's linked skill. Damage is pre-rolled and
     * shown on the card. The GM or player can then click "Apply Damage" to
     * apply stamina loss to targeted tokens, automatically factoring in armour.
     *
     * @param {WarlockActor} actor The attacking Actor
     * @param {WarlockItem} weapon The weapon Item being used
     * @param {object} [options] Options forwarded to the skill test dialog
     * @param {boolean} [options.skipDialog] Skip the modifier dialog
     * @param {boolean} [options.isBasicTest] Force a basic test (Shift-click)
     */
    static async rollWeaponAttack(actor, weapon, options = {}) {
        const activeSystem = game.settings.get("warlock", "activeSystem");

        // Resolve the weapon's linked skill name and the actor's level in it.
        const weaponSkillKey = weapon.system.skill.value;
        let skillName;
        let skillLevel;

        if (weaponSkillKey === "—" || !weaponSkillKey) {
            ui.notifications.warn(
                game.i18n.localize("WARLOCK.Notifications.WeaponNoSkill"),
            );
            return;
        }

        if (actor.type === "Monster") {
            skillName = game.i18n.localize("WARLOCK.Skills.WeaponSkill");
            skillLevel = actor.system.weaponSkill;
        } else if (actor.type === "Vehicle") {
            skillName = game.i18n.localize("WARLOCK.Skills.ShipGunner");
            skillLevel = 0; // Vehicles use crew skill; default to 0.
        } else {
            // Character — look up the adventuring skill.
            skillName = game.warlock.skills[activeSystem]?.[weaponSkillKey]
                ?? weaponSkillKey;
            skillLevel = actor.system.adventuringSkills?.[weaponSkillKey] ?? 0;
        }

        // Show the skill test dialog (with combat options).
        if (!options.skipDialog) {
            options = await Rolls._getSkillTestOptions(skillName, {
                ...options,
                showCombatOptions: true,
            });

            if (options.cancelled) return;
        }

        const modifier = options.modifier ?? 0;

        // --- Build and evaluate the skill test roll ---
        let formula = "1d20 + @level";
        if (modifier > 0) {
            formula += " + @modifier";
        } else if (modifier < 0) {
            formula += " - @modifier";
        }

        const attackRoll = new Roll(formula, {
            level: skillLevel,
            modifier: Math.abs(modifier),
        });
        await attackRoll.evaluate({ async: true });

        // --- Build and evaluate the damage roll ---
        const damageRoll = new Roll(
            `max(${weapon.system.damage.roll}, 1)`,
            {},
        );
        await damageRoll.evaluate({ async: true });

        // --- Determine flavor / test type label ---
        const testTypeLabel = options.isBasicTest
            ? game.i18n.localize("WARLOCK.Dialogs.SkillTest.BasicTest")
            : game.i18n.localize("WARLOCK.Dialogs.SkillTest.OpposedTest");

        const damageTypeName =
            weapon.system.damage.type.choices?.[weapon.system.damage.type.value]
            ?? weapon.system.damage.type.value;

        const weaponTypeName =
            weapon.system.type.choices?.[weapon.system.type.value]
            ?? "";

        const flavor = game.i18n.format("WARLOCK.Chat.Attack.Flavor", {
            weapon: weapon.name,
            skill: skillName,
            level: skillLevel,
            testType: testTypeLabel,
        });

        // --- Render the attack card HTML ---
        const cardContent = await renderTemplate(
            "systems/warlock/templates/chat/attack-card.hbs",
            {
                weaponImg: weapon.img,
                weaponName: weapon.name,
                skillName: skillName,
                skillLevel: skillLevel,
                damageFormula: weapon.system.damage.roll,
                damageTypeName: damageTypeName,
                weaponTypeName: (weaponTypeName && weaponTypeName !== "—")
                    ? weaponTypeName : "",
                damageTotal: damageRoll.total,
                damageType: weapon.system.damage.type.value,
                actorId: actor.id,
            },
        );

        // --- Create a single ChatMessage with both rolls ---
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: flavor,
            content: cardContent,
            rolls: [attackRoll, damageRoll],
            sound: CONFIG.sounds.dice,
            flags: {
                warlock: {
                    isBasicTest: options.isBasicTest ?? false,
                    isWeaponAttack: true,
                    damageTotal: damageRoll.total,
                    damageType: weapon.system.damage.type.value,
                    damageFormula: weapon.system.damage.roll,
                    weaponName: weapon.name,
                    actorId: actor.id,
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Applies damage to the user's currently targeted tokens.
     *
     * Automatically detects equipped armour on each target, rolls the
     * reduction, calculates net damage (minimum 1), and updates stamina.
     * Posts a summary ChatMessage.
     *
     * @param {number} grossDamage The raw damage total before armour
     * @param {string} damageType The damage type key (e.g. "Crushing")
     * @param {object} [options]
     * @param {boolean} [options.half] If true, halve gross damage first
     */
    static async applyDamageToTargets(grossDamage, damageType, options = {}) {
        const targets = game.user.targets;

        if (!targets.size) {
            ui.notifications.warn(
                game.i18n.localize("WARLOCK.Notifications.NoTargetsSelected"),
            );
            return;
        }

        if (options.half) {
            grossDamage = Math.max(1, Math.ceil(grossDamage / 2));
        }

        for (const token of targets) {
            const actor = token.actor;
            if (!actor) continue;

            // Find the first equipped armour on the target.
            const equippedArmour = actor.items.find(
                (i) => i.type === "Armour" && i.system.isEquipped,
            );

            let armourReduction = 0;
            let armourRollResult = null;

            if (equippedArmour && equippedArmour.system.reductionRoll) {
                const armourRoll = new Roll(
                    equippedArmour.system.reductionRoll,
                    {},
                );
                await armourRoll.evaluate({ async: true });
                armourReduction = armourRoll.total;
                armourRollResult = armourRoll;
            }

            // Net damage is always at least 1.
            const netDamage = Math.max(1, grossDamage - armourReduction);

            // Apply stamina loss.
            const currentStamina = actor.system.resources?.stamina?.value ?? 0;
            const newStamina = currentStamina - netDamage;

            await actor.update({
                system: {
                    resources: {
                        stamina: {
                            value: newStamina,
                        },
                    },
                },
            });

            // Build a summary message.
            const parts = [];
            parts.push(game.i18n.format("WARLOCK.Chat.Attack.DamageAppliedGross", {
                damage: grossDamage,
                target: token.name,
            }));

            if (equippedArmour) {
                parts.push(game.i18n.format("WARLOCK.Chat.Attack.ArmourReduced", {
                    armour: equippedArmour.name,
                    reduction: armourReduction,
                }));
            }

            parts.push(game.i18n.format("WARLOCK.Chat.Attack.NetStaminaLoss", {
                net: netDamage,
                newStamina: newStamina,
            }));

            if (newStamina < 0) {
                parts.push(game.i18n.format("WARLOCK.Chat.Attack.CriticalWarning", {
                    negative: Math.abs(newStamina),
                }));
            }

            const summaryContent = `<div class="warlock chat-card chat-card--damage-summary">
                ${parts.map(p => `<p>${p}</p>`).join("")}
            </div>`;

            const messageData = {
                speaker: ChatMessage.getSpeaker({ token: token.document }),
                content: summaryContent,
                sound: null,
                whisper: game.users.filter(u => u.isGM).map(u => u.id),
            };

            // Include the armour roll if one was made.
            if (armourRollResult) {
                messageData.rolls = [armourRollResult];
            }

            await ChatMessage.create(messageData);
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates a Dialog for a skill test and returns the options selected by the
     * user.
     *
     * @param {string} skill The skill name to show in the dialog titlebar
     * @param {object} options The options for the dialog
     * @returns {Promise<object>} The options from the dialog
     *
     * @private
     */
    static async _getSkillTestOptions(skill, options) {
        function handleSkillTestOptions(form, isBasicTest) {
            const activeSystem = game.settings.get("warlock", "activeSystem");

            let modifier = parseInt(form.modifier.value);

            if (options.showVehicleCombatCapabilities) {
                switch (form.vehicleCombatCapabilityChoice.value) {
                    case "none":
                        break;
                    case "shipGun":
                        modifier += options.shipGun;
                        break;
                    case "antiPersonnelGun":
                        modifier += options.antiPersonnelGun;
                        break;
                    default:
                        break;
                }
            }

            if (options.showCombatOptions) {
                if (form.initiatedMeleeAttack.checked) {
                    modifier += 5;
                }

                if (form.rangedTargetFaraway.checked) {
                    modifier -= 5;
                }

                if (activeSystem === "warlock") {
                    switch (form.shieldChoice.value) {
                        case "none":
                            break;
                        case "small":
                            modifier += 3;
                            break;
                        case "large":
                            modifier += 5;
                            break;
                        default:
                            break;
                    }
                } if (activeSystem === "wetwired") {
                    if (form.pinned.checked) {
                        modifier -= 5;
                    }

                    switch (form.flankingChoice.value) {
                        case "none":
                            break;
                        case "flanking":
                            modifier += 5;
                            break;
                        case "flanked":
                            modifier -= 5;
                            break;
                        default:
                            break;
                    }
                 
                } else if (activeSystem === "warpstar") {
                    if (form.pinned.checked) {
                        modifier -= 5;
                    }

                    switch (form.flankingChoice.value) {
                        case "none":
                            break;
                        case "flanking":
                            modifier += 5;
                            break;
                        case "flanked":
                            modifier -= 5;
                            break;
                        default:
                            break;
                    }
                }
            }

            return {
                modifier: modifier,
                isBasicTest: isBasicTest,
            };
        }

        const content = await renderTemplate(
            "systems/warlock/templates/dialogs/skill-test-dialog.hbs",
            {
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
            },
        );

        return new Promise(resolve => {
            new Dialog({
                title: game.i18n.format("WARLOCK.Dialogs.SkillTest.Title", {
                    skill: skill,
                }),
                content: content,
                buttons: {
                    opposed: {
                        icon: "<i class=\"fas fa-users\"></i>",
                        label: game.i18n.localize("WARLOCK.Dialogs.SkillTest.OpposedTest"),
                        callback: (html) => resolve(handleSkillTestOptions(html[0].querySelector("form"), false)),
                    },
                    cancel: {
                        icon: "<i class=\"fas fa-times\"></i>",
                        label: game.i18n.localize("WARLOCK.Dialogs.SkillTest.Cancel"),
                        callback: (html) => resolve({
                            cancelled: true,
                        }),
                    },
                    basic: {
                        icon: "<i class=\"fas fa-user\"></i>",
                        label: game.i18n.localize("WARLOCK.Dialogs.SkillTest.BasicTest"),
                        callback: (html) => resolve(handleSkillTestOptions(html[0].querySelector("form"), true)),
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
