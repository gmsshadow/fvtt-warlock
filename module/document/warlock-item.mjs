export default class WarlockItem extends Item {
    prepareDerivedData() {
        if (this.type === "Career") {
            const activeSystem = game.settings.get("warlock", "activeSystem");

            let careerSkills = "";

            Object.entries(this.data.data.adventuringSkills[activeSystem])
                .forEach(([key, value]) => {
                    if (value.isCareerSkill) {
                        if (careerSkills.length !== 0) {
                            careerSkills += ", "
                        }

                        careerSkills += `${key} ${value.maximumLevel}`;
                    }
                });

            this.data.data.careerSkills = careerSkills;
        }
    }

    async updateCareerSkillLevel(skill, level) {
        if (!this.type === "Career" || !this.isEmbedded) {
            return;
        }

        const activeSystem = game.settings.get("warlock", "activeSystem");
        let careerLevel = 0;
        let careerSkillsCount = 0;

        Object.entries(this.data.data.adventuringSkills[activeSystem])
            .forEach(([skillName, skillData]) => {
                if (skillData.isCareerSkill) {
                    if (skillName == skill) {
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