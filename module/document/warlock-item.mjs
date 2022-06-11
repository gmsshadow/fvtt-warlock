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
                await this._createCareer();
                break;
            default:
                break;
        }
    }

    /* ---------------------------------------------------------------------- */

    async _createCareer() {
        const activeSystem = game.settings.get("warlock", "activeSystem");

        if (this.data.data.adventuringSkills === undefined) {
            const skills = {};
            for (const skill of Object.keys(game.warlock.skills[activeSystem])) {
                skills[skill] = {
                    isCareerSkill: false,
                    maximumLevel: 0,
                };
            }

            await this.data.update({
                data: {
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
        switch (this.type)
        {
            case "Ability":
                this._prepareDescription();
                break;
            case "Armour":
                this._prepareArmourType();
                this._prepareDescription();
                break;
            case "Career":
                this._prepareCareerSkills();
                this._prepareDescription();
                break;
            case "Equipment":
                this._prepareDescription();
                break;
            case "Glyph":
                this._prepareDescription();
                this._prepareGlyphTest();
                break;
            case "Spell":
                this._prepareDescription();
                break;
            case "Weapon":
                this._prepareDescription();
                this._prepareWeaponDamageType();
                this._prepareWeaponSkill();
                this._prepareWeaponType();
                break;
        }
    }

    /* ---------------------------------------------------------------------- */

    _prepareArmourType() {
        this.data.data.type.choices = {
            "": "",
            "Light": game.i18n.localize("WARLOCK.Items.Armour.Types.Light"),
            "Modest": game.i18n.localize("WARLOCK.Items.Armour.Types.Modest"),
            "Heavy": game.i18n.localize("WARLOCK.Items.Armour.Types.Heavy"),
        };
    }

    /* ---------------------------------------------------------------------- */

    _prepareCareerSkills() {
        if (this.data.data.adventuringSkills
            && this.data.data.adventuringSkills.warlock === undefined
            && this.data.data.adventuringSkills.warpstar === undefined)
        {
            // Translate skill names.
            const translatedSkills = {};
            for (const skill of Object.keys(this.data.data.adventuringSkills))
            {
                // Title-case the skill name and remove spaces.
                const skillName = skill
                    .split(" ")
                    .map(word => word[0].toUpperCase() + word.substring(1))
                    .join("");
                translatedSkills[game.i18n.localize(`WARLOCK.Skills.${skillName}`)] = this.data.data.adventuringSkills[skill];
            }

            this.data.data.adventuringSkills = translatedSkills;
        }
    }

    /* ---------------------------------------------------------------------- */

    _prepareDescription() {
        this.data.data.description = TextEditor.enrichHTML(this.data.data.description);
    }

    /* ---------------------------------------------------------------------- */

    _prepareGlyphTest() {
        this.data.data.test.choices = {
            "Basic": game.i18n.localize("WARLOCK.Items.Glyph.Test.Basic"),
            "Opposed": game.i18n.localize("WARLOCK.Items.Glyph.Test.Opposed"),
        };
    }

    /* ---------------------------------------------------------------------- */

    _prepareWeaponDamageType() {
        const activeSystem = game.settings.get("warlock", "activeSystem");

        if (activeSystem === "warlock") {
            this.data.data.damage.type.choices = {
                "—": "—",
                "Crushing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Crushing"),
                "Piercing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Piercing"),
                "Slashing": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Slashing"),
                "Blast": game.i18n.localize("WARLOCK.Items.Weapon.Damage.Blast"),
            };
        } else if (activeSystem === "warpstar") {
            this.data.data.damage.type.choices = {
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
            this.data.data.skill.choices = {
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
            this.data.data.skill.choices = {
                "—": "—",
                "Blades": game.i18n.localize("WARLOCK.Skills.Blades"),
                "Blunt": game.i18n.localize("WARLOCK.Skills.Blunt"),
                "Brawling": game.i18n.localize("WARLOCK.Skills.Brawling"),
                "Ship gunner": game.i18n.localize("WARLOCK.Skills.ShipGunner"),
                "Small arms": game.i18n.localize("WARLOCK.Skills.SmallArms"),
                "Thrown": game.i18n.localize("WARLOCK.Skills.Thrown"),
            };
        }

        if (this.actor?.data) {
            if (this.actor?.type === "Character") {
                if (this.data.data.skill.value !== "—") {
                    this.data.data.skill.value = game.warlock.skills[activeSystem][this.data.data.skill.value];
                }
            } else if (this.actor?.type === "Monster") {
                if (this.data.data.skill.value !== "—") {
                    this.data.data.skill.value = game.i18n.localize("WARLOCK.Skills.WeaponSkill");
                }

                this.data.data.skill.choices = {
                    "—": "—",
                    "Weapon Skill": game.i18n.localize("WARLOCK.Skills.WeaponSkill"),
                };
            } else if (this.actor?.type === "Vehicle") {
                if (this.data.data.skill.value !== "—") {
                    this.data.data.skill.value = game.warlock.skills.warpstar[this.data.data.skill.value];
                }

                this.data.data.skill.choices = {
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
            this.data.data.type.choices = {
                "—": "—",
                "Casual": game.i18n.localize("WARLOCK.Items.Weapon.Types.Casual"),
                "Martial": game.i18n.localize("WARLOCK.Items.Weapon.Types.Martial"),
            };
        } else if (activeSystem === "warpstar") {
            this.data.data.type.choices = {
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
                    `Type: ${this.data.data.type.value}`,
                    `Roll: ${this.data.data.reductionRoll}`,
                );
                break;
            case "Career":
                let careerSkills = "";

                Object
                    .entries(this.data.data.adventuringSkills)
                    .forEach(([key, value]) => {
                        if (value.isCareerSkill) {
                            if (careerSkills.length !== 0) {
                                careerSkills += ", "
                            }

                            careerSkills += `${key} ${value.maximumLevel}`;
                        }
                    });

                details.push(
                    `Level: ${this.data.data.currentLevel}`,
                    `Adventuring Skills: ${careerSkills === "" ? "None" : careerSkills}`,
                );
                break;
            case "Equipment":
                details.push(
                    `Quantity: ${this.data.data.quantity}`,
                );
                break;
            case "Glyph":
                details.push(
                    `Test: ${this.data.data.test.value}`,
                    `Stamina Cost: ${this.data.data.staminaCost}`,
                );
                break;
            case "Spell":
                details.push(
                    `Stamina Cost: ${this.data.data.staminaCost}`,
                );
                break;
            case "Weapon":
                details.push(
                    `Type: ${this.data.data.type.value}`,
                    `Damage: ${this.data.data.damage.roll} ${(this.data.data.damage.type.value).toLowerCase()}`,
                    `Skill: ${this.data.data.skill.value}`,
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
            .entries(this.data.data.adventuringSkills)
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
                    skillLevel = this.parent.data.data.adventuringSkills[careerSkill[0]];
                }

                if (careerLevelCalculation === "lowestSkill") {
                    return (accumulator > skillLevel) ? skillLevel : accumulator;
                } else if (careerLevelCalculation === "averageSkill") {
                    return accumulator + (skillLevel / length);
                }
            }, initialValue);

        await this.update({
            data: {
                // Round the career level up if it's a fraction.
                currentLevel: careerLevel === Infinity ? 0 : Math.ceil(careerLevel),
            },
        });
    }
}