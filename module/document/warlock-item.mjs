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

    /* -------------------------------------------- */

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
        let careerLevel = 0;
        let careerSkillsCount = 0;

        Object
            .entries(this.data.data.adventuringSkills[activeSystem])
            .forEach(([skillName, skillData]) => {
                if (skillData.isCareerSkill) {
                    if (skillName == skill) {
                        // Use the new skill level if this skill is what caused
                        // this method to be called.
                        careerLevel += level;
                    } else {
                        careerLevel += this.parent.data.data.adventuringSkills[activeSystem][skillName];
                    }
                    ++careerSkillsCount;
                }
            });

        if (careerSkillsCount === 0) {
            // This occurs if the career has no skills selected and the player
            // modifies one of their skill's levels.
            careerLevel = 0;
        } else {
            careerLevel = Math.ceil(careerLevel / careerSkillsCount);
        }

        await this.update({
            data: {
                currentLevel: careerLevel,
            },
        });
    }
}