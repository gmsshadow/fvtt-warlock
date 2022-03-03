/**
 * The custom WarlockItem document that extends the base Item document.
 *
 * @extends Item
 */
export default class WarlockItem extends Item {
    /**
     * @override
     * @inheritdoc
     */
    prepareDerivedData() {
        switch (this.type) {
            case "Career":
                // Create the list of career skills that is shown in the chat
                // message for this career.
                const activeSystem = game.settings.get("warlock", "activeSystem");
                let careerSkills = "";

                Object
                    .entries(this.data.data.adventuringSkills[activeSystem])
                    .forEach(([key, value]) => {
                        if (value.isCareerSkill) {
                            if (careerSkills.length !== 0) {
                                careerSkills += ", "
                            }

                            careerSkills += `${key} ${value.maximumLevel}`;
                        }
                    });

                this.data.data.careerSkills = careerSkills;
                break;
            default:
                break;
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
                    `${this.data.data.type.value} armour`,
                    `${this.data.data.reductionRoll} reduced stamina loss`,
                );
                break;
            case "Career":
                details.push(
                    `Level ${this.data.data.currentLevel}`,
                    `Adventuring skills: ${this.data.careerSkills}`,
                );
                break;
            case "Equipment":
                details.push(
                    `Quantity: ${this.data.data.quantity}`,
                );
                break;
            case "Glyph":
                details.push(
                    `${this.data.data.test.value} test`,
                    `${this.data.data.staminaCost} stamina cost`,
                );
                break;
            case "Spell":
                details.push(
                    `${this.data.data.staminaCost} stamina cost`,
                );
                break;
            case "Weapon":
                details.push(
                    `${this.data.data.type.value}`,
                    `${this.data.data.damage.roll} ${(this.data.data.damage.type.value).toLowerCase()} damage`,
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

        const activeSystem = game.settings.get("warlock", "activeSystem");

        if (activeSystem === "warlock") {
            const careerLevel = Object
                .entries(this.data.data.adventuringSkills[activeSystem])
                .filter(([name, data]) => {
                    return data.isCareerSkill;
                })
                .reduce((accumulator, careerSkill) => {
                    let skillLevel;

                    // Use the level argument if this skill was the catalyst for
                    // updating the career level. It hasn't updated yet in the
                    // actor data model, so we have to differentiate here.
                    if (careerSkill[0] === skill) {
                        skillLevel = level;
                    } else {
                        skillLevel = this.parent.data.data.adventuringSkills[activeSystem][careerSkill[0]];
                    }

                    return (accumulator > skillLevel) ? skillLevel : accumulator;
                }, Infinity);

            await this.update({
                data: {
                    currentLevel: careerLevel,
                },
            });
        } else if (activeSystem === "warpstar") {
            const careerLevel = Object
                .entries(this.data.data.adventuringSkills[activeSystem])
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
                        skillLevel = this.parent.data.data.adventuringSkills[activeSystem][careerSkill[0]];
                    }

                    return accumulator + (skillLevel / length);
                }, 0);

            await this.update({
                data: {
                    // Round the career level up if it's a fraction.
                    currentLevel: Math.ceil(careerLevel),
                },
            });
        }
    }
}