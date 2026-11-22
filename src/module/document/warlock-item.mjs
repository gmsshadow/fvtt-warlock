import { choices, gameConfig, skillLabelKey } from "../config/systems.mjs";
import { careerEtiquettes } from "../utils/wetwired.mjs";
import { activeSkillKeys, DEFAULT_CHARACTER_SKILL_LEVEL } from "../utils/skills.mjs";

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
        if (this.system.adventuringSkills === undefined) {
            const skills = {};
            for (const skill of activeSkillKeys()) {
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
            case "Career":
            case "Contact":
                this._prepareEtiquette();
                break;
            case "Cyberware":
                this.system.category.choices = choices(
                    Object.keys(gameConfig("wetwired").cyberware),
                    (c) => `WARLOCK.Items.Cyberware.Categories.${c}`,
                );
                break;
            case "Program":
                this.system.programType.choices = choices(
                    gameConfig("wetwired").programTypes,
                    (t) => `WARLOCK.Items.Program.Types.${t}`,
                );
                break;
        }
    }

    /* ---------------------------------------------------------------------- */

    /** Etiquette choices for careers and contacts (Wetwired p27). */
    _prepareEtiquette() {
        const etiquette = this.system.etiquette ??= { value: "" };
        const all = gameConfig("wetwired").etiquettes;
        etiquette.choices = choices(all, (e) => `WARLOCK.Etiquette.${e}`);
        if (this.type !== "Career") return;

        // A career can grant more than one etiquette ("Street and Tribal"),
        // or let the player pick one of a few ("Street or Corporate").
        if (!Array.isArray(etiquette.additional)) etiquette.additional = [];
        if (!Array.isArray(etiquette.options)) etiquette.options = [];
        if (etiquette.options.length) {
            etiquette.choices = choices(
                all.filter((e) => etiquette.options.includes(e)),
                (e) => `WARLOCK.Etiquette.${e}`,
            );
        }
        etiquette.additionalChoices = all
            .filter((e) => e !== etiquette.value)
            .map((e) => ({
                value: e,
                label: game.i18n.localize(`WARLOCK.Etiquette.${e}`),
                checked: etiquette.additional.includes(e),
            }));
        etiquette.list = careerEtiquettes(this);
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
        this.system.damage.type.choices = choices(
            gameConfig().weapons.damageTypes,
            (type) => `WARLOCK.Items.Weapon.Damage.${type}`,
        );
    }

    /* ---------------------------------------------------------------------- */

    _prepareWeaponSkill() {
        this.system.skill.choices = choices(gameConfig().weapons.skills, skillLabelKey);

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
        this.system.type.choices = choices(
            gameConfig().weapons.types,
            (type) => `WARLOCK.Items.Weapon.Types.${type}`,
        );
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
                    .entries(this.system.adventuringSkills ?? {})
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
                if (gameConfig().features.etiquette) {
                    const options = this.system.etiquette?.options ?? [];
                    const list = options.length ? options.join(" or ") : careerEtiquettes(this).join(", ");
                    if (list) details.push(`Etiquette: ${list}`);
                }
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
                if (this.system.modes) details.push(`Modes: ${this.system.modes}`);
                if (this.system.ammo?.max) details.push(`Ammo: ${this.system.ammo.value}/${this.system.ammo.max}`);
                break;
            case "Cyberware":
                details.push(
                    `Category: ${this.system.category.value}`,
                    `Points: ${this.system.points}`,
                );
                break;
            case "Cyberdeck":
                details.push(`Quality: ${this.system.quality}`);
                break;
            case "Program":
                details.push(
                    `Type: ${this.system.programType.value}`,
                    `Rating: ${this.system.rating}`,
                );
                break;
            case "Contact":
                details.push(`Etiquette: ${this.system.etiquette.value}`);
                if (this.system.role) details.push(`Role: ${this.system.role}`);
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
            .entries(this.system.adventuringSkills ?? {})
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
                    skillLevel = this.parent.system.adventuringSkills?.[careerSkill[0]] ?? DEFAULT_CHARACTER_SKILL_LEVEL;
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
