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
                isBasicTest: options.isBasicTest,
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
