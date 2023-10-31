/**
 * The custom WarlockItem document that extends the base Item document.
 *
 * @extends Item
 */
export class WarlockItem extends Item {
    /**
     * @override
     * @inheritdoc
     */
    async _preCreate(data, options, user) {
        super._preCreate(data, options, user);

        switch (this.type) {
            case "Career":
                this._createCareer();
                break;
            default:
                break;
        }
    }

    /* ---------------------------------------------------------------------- */

    _createCareer() {
        const activeSystem = game.settings.get("warlock", "activeSystem");

        if (this.system.adventuringSkills === undefined) {
            const skills = {};
            for (const skill of Object.keys(game.warlock.skills[activeSystem])) {
                skills[skill] = {
                    isCareerSkill: false,
                    maximumLevel: 0,
                };
            }

            this.updateSource({
                system: {
                    adventuringSkills: skills,
                }
            });
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    prepareDerivedData() {
        super.prepareDerivedData();

        switch (this.type)
        {
            case "Ability":
                break;
            case "Armour":
                this._prepareArmourType();
                break;
            case "Career":
                break;
            case "Equipment":
                break;
            case "Glyph":
                this._prepareGlyphTest();
                break;
            case "Spell":
                break;
            case "Weapon":
                this._prepareWeaponDamageType();
                this._prepareWeaponSkill();
                this._prepareWeaponType();
                break;
        }
    }

    /* ---------------------------------------------------------------------- */

    _prepareArmourType() {
        this.system.type.choices = {
            "": "",
            "Light": game.i18n.localize("WARLOCK.Items.Armour.Types.Light"),
            "Modest": game.i18n.localize("WARLOCK.Items.Armour.Types.Modest"),
            "Heavy": game.i18n.localize("WARLOCK.Items.Armour.Types.Heavy"),
        };
    }

    /* ---------------------------------------------------------------------- */

    _prepareGlyphTest() {
        this.system.test.choices = {
            "Basic": game.i18n.localize("WARLOCK.Items.Glyph.Test.Basic"),
            "Opposed": game.i18n.localize("WARLOCK.Items.Glyph.Test.Opposed"),
        };
    }

    /* ---------------------------------------------------------------------- */

    _prepareWeaponDamageType() {
        const activeSystem = game.settings.get("warlock", "activeSystem");

        if (activeSystem === "warlock") {
            this.system.damage.type.choices = {
                "—": "—",
                "Crushing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Crushing"),
                "Piercing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Piercing"),
                "Slashing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Slashing"),
                "Blast": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Blast"),
            };
        } else if (activeSystem === "warpstar") {
            this.system.damage.type.choices = {
                "—": "—",
                "Crushing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Crushing"),
                "Piercing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Piercing"),
                "Slashing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Slashing"),
                "Energy": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Energy"),
                "Ship": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Ship"),
            };
        }
    }

    /* ---------------------------------------------------------------------- */

    _prepareWeaponSkill() {
        const activeSystem = game.settings.get("warlock", "activeSystem");

        if (activeSystem === "warlock") {
            this.system.skill.choices = {
                "—": "—",
                "Blunt": game.i18n.localize("WARLOCK.Skills.Blunt"),
                "Bow": game.i18n.localize("WARLOCK.Skills.Bow"),
                "Brawling": game.i18n.localize("WARLOCK.Skills.Brawling"),
                "Crossbow": game.i18n.localize("WARLOCK.Skills.Crossbow"),
                "Large blade": game.i18n.localize("WARLOCK.Skills.LargeBlade"),
                "Pole arm": game.i18n.localize("WARLOCK.Skills.PoleArm"),
                "Small blade": game.i18n.localize("WARLOCK.Skills.SmallBlade"),
                "Thrown": game.i18n.localize("WARLOCK.Skills.Thrown"),
            };
        } else if (activeSystem === "warpstar") {
            this.system.skill.choices = {
                "—": "—",
                "Blades": game.i18n.localize("WARLOCK.Skills.Blades"),
                "Blunt": game.i18n.localize("WARLOCK.Skills.Blunt"),
                "Brawling": game.i18n.localize("WARLOCK.Skills.Brawling"),
                "Ship gunner": game.i18n.localize("WARLOCK.Skills.ShipGunner"),
                "Small arms": game.i18n.localize("WARLOCK.Skills.SmallArms"),
                "Thrown": game.i18n.localize("WARLOCK.Skills.Thrown"),
            };
        }

        if (this.actor?.system) {
            if (this.actor?.type === "Monster") {
                this.system.skill.choices = {
                    "—": "—",
                    "Weapon Skill": game.i18n.localize("WARLOCK.Skills.WeaponSkill"),
                };
            } else if (this.actor?.type === "Vehicle") {
                this.system.skill.choices = {
                    "—": "—",
                    "Ship gunner": game.i18n.localize("WARLOCK.Skills.ShipGunner"),
                };
            }
        }
    }

    /* ---------------------------------------------------------------------- */

    _prepareWeaponType() {
        const activeSystem = game.settings.get("warlock", "activeSystem");

        if (activeSystem === "warlock") {
            this.system.type.choices = {
                "—": "—",
                "Casual": game.i18n.localize("WARLOCK.Items.Weapon.Types.Casual"),
                "Martial": game.i18n.localize("WARLOCK.Items.Weapon.Types.Martial"),
            };
        } else if (activeSystem === "warpstar") {
            this.system.type.choices = {
                "—": "—",
                "Small": game.i18n.localize("WARLOCK.Items.Weapon.Types.Small"),
                "Medium": game.i18n.localize("WARLOCK.Items.Weapon.Types.Medium"),
                "Large": game.i18n.localize("WARLOCK.Items.Weapon.Types.Large"),
            };
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Generates a listing of item details for chat cards.
     *
     * @returns {Array} Array of item detail strings
     */
    generateDetails() {
        const details = [];

        switch (this.type) {
            case "Armour":
                details.push(
                    `Type: ${this.system.type.value}`,
                    `Roll: ${this.system.reductionRoll}`,
                );
                break;
            case "Career":
                let careerSkills = "";

                Object
                    .entries(this.system.adventuringSkills)
                    .forEach(([key, value]) => {
                        if (value.isCareerSkill) {
                            if (careerSkills.length !== 0) {
                                careerSkills += ", "
                            }

                            careerSkills += `${key} ${value.maximumLevel}`;
                        }
                    });

                details.push(
                    `Level: ${this.system.currentLevel}`,
                    `Adventuring Skills: ${careerSkills === "" ? "None" : careerSkills}`,
                );
                break;
            case "Equipment":
                details.push(
                    `Quantity: ${this.system.quantity}`,
                );
                break;
            case "Glyph":
                details.push(
                    `Test: ${this.system.test.value}`,
                    `Stamina Cost: ${this.system.staminaCost}`,
                );
                break;
            case "Spell":
                details.push(
                    `Stamina Cost: ${this.system.staminaCost}`,
                );
                break;
            case "Weapon":
                details.push(
                    `Type: ${this.system.type.value}`,
                    `Damage: ${this.system.damage.roll} ${(this.system.damage.type.value).toLowerCase()}`,
                    `Skill: ${this.system.skill.value}`,
                );
                break;
            default:
                // TODO(jcd) Log this.
                break;
        }

        return details;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Calculates the career skill level when a relevant skill changes in level.
     *
     * @param {string} skill The name of the skill that changed in level
     * @param {number} level The new level of the skill
     */
    async updateCareerSkillLevel(skill, level) {
        if (!this.type === "Career" || !this.isEmbedded) {
            return;
        }

        const careerLevelCalculation = game.settings.get("warlock", "careerLevelCalculation");

        let initialValue;
        if (careerLevelCalculation === "lowestSkill") {
            initialValue = Infinity;
        } else if (careerLevelCalculation === "averageSkill") {
            initialValue = 0;
        }

        const careerLevel = Object
            .entries(this.system.adventuringSkills)
            .filter(([name, data]) => {
                return data.isCareerSkill;
            })
            .reduce((accumulator, careerSkill, _, {length}) => {
                let skillLevel;

                // Use the level argument if this skill was the catalyst for
                // updating the career level. It hasn't updated yet in the
                // actor data model, so we have to differentiate here.
                if (careerSkill[0] === skill) {
                    skillLevel = level;
                } else {
                    skillLevel = this.parent.system.adventuringSkills[careerSkill[0]];
                }

                if (careerLevelCalculation === "lowestSkill") {
                    return (accumulator > skillLevel) ? skillLevel : accumulator;
                } else if (careerLevelCalculation === "averageSkill") {
                    return accumulator + (skillLevel / length);
                }
            }, initialValue);

        await this.update({
            system: {
                // Round the career level up if it's a fraction.
                currentLevel: careerLevel === Infinity ? 0 : Math.ceil(careerLevel),
            },
        });
    }
}
