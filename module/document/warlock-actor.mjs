/**
 * The custom WarlockActor document that extends the base Actor document.
 *
 * @extends Actor
 */
export class WarlockActor extends Actor {
    /**
     * @override
     * @inheritdoc
     */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        switch (this.type)
        {
            case "Character":
                await this._createCharacter();
                break;
            case "Monster":
                await this._createMonster();
                break;
            case "Vehicle":
                await this._createVehicle();
                break;
            default:
                break;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    _applyDefaultTokenSettings(data, options) {
        super._applyDefaultTokenSettings(data, options);

        let prototypeToken = this.prototypeToken;

        switch (this.type) {
            case "Character":
                prototypeToken.vision = true;
                prototypeToken.actorLink = true;
                prototypeToken.disposition = 1;
                break;
            case "Monster":
                prototypeToken.vision = false;
                prototypeToken.actorLink = false;
                prototypeToken.disposition = -1;
                break;
            case "Vehicle":
                prototypeToken.actorLink = true;
                prototypeToken.disposition = 0;
                break;
            default:
                break;
        }

        return this.updateSource({prototypeToken});
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates the preliminary data for a Character.
     *
     * @private
     */
    async _createCharacter() {
        // Add system-appropriate skills.
        const activeSystem = game.settings.get("warlock", "activeSystem");

        const skills = {};
        for (const skill of Object.keys(game.warlock.skills[activeSystem])) {
            skills[skill] = 0;
        }

        await this.updateSource({
            system: {
                adventuringSkills: skills,
            }
        });

        // Add an unarmed weapon.
        let weaponsPack;
        if (activeSystem === "warlock") {
            weaponsPack = game.packs.find(pack => pack.metadata.label === "Weapons (Warlock!)");
        }
        else if (activeSystem === "warpstar") {
            weaponsPack = game.packs.find(pack => pack.metadata.label === "Weapons (Warpstar!)");
        }

        const wasLocked = weaponsPack.locked;
        if (wasLocked) {
            await weaponsPack.configure({
                locked: false,
            });
        }

        const weapons = await weaponsPack.getDocuments();
        const unarmedWeapon = weapons.find(weapon => weapon.name === "Unarmed").toObject();
        unarmedWeapon.system.isEquipped = true;

        await this.updateSource({
            items: [
                unarmedWeapon,
            ],
        });

        await weaponsPack.configure({
            locked: wasLocked,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates the preliminary data for a Monster.
     *
     * @private
     */
    async _createMonster() {
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates the preliminary data for a Vehicle.
     *
     * @private
     */
    async _createVehicle() {
    }

    /**
     * @override
     * @inheritdoc
     */
    prepareDerivedData() {
        if (this.system.adventuringSkills
            && !(this.system.adventuringSkills.warlock
                 || this.system.adventuringSkills.warpstar)
            && this.type === "Character") {
            // Translate skill names.
            const translatedSkills = {};
            for (const skill of Object.keys(this.system.adventuringSkills)) {
                // Title-case the skill name and remove spaces.
                const skillName = skill
                    .split(" ")
                    .map(word => word[0].toUpperCase() + word.substring(1))
                    .join("");
                translatedSkills[game.i18n.localize(`WARLOCK.Skills.${skillName}`)] = this.system.adventuringSkills[skill];
            }

            this.system.adventuringSkills = translatedSkills;
        }
    }
}
