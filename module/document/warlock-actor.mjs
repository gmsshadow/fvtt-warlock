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

        switch (this.type) {
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
     * Creates the preliminary data for a Character.
     *
     * @private
     */
    async _createCharacter()
    {
        // Add system-appropriate skills.
        const activeSystem = game.settings.get("warlock", "activeSystem");

        const skills = {};
        for (const skill of Object.keys(game.warlock.skills[activeSystem]))
        {
            skills[skill] = 0;
        }

        await this.data.update({
            data: {
                adventuringSkills: skills,
            }
        });

        // Add an unarmed weapon.
        let weaponsPack;
        if (activeSystem === "warlock")
        {
            weaponsPack = game.packs.find(pack => pack.metadata.label === "Weapons (Warlock!)");
        }
        else if (activeSystem === "warpstar")
        {
            weaponsPack = game.packs.find(pack => pack.metadata.label === "Weapons (Warpstar!)");
        }

        const wasLocked = weaponsPack.locked;
        if (wasLocked)
        {
            await weaponsPack.configure({
                locked: false,
            });
        }

        const weapons = await weaponsPack.getDocuments();
        const unarmedWeapon = weapons.find(weapon => weapon.name === "Unarmed").toObject();
        unarmedWeapon.data.isEquipped = true;

        await this.data.update({
            items: [
                unarmedWeapon,
            ],
        });

        await weaponsPack.configure({
            locked: wasLocked,
        });

        // Set token defaults.
        this.data.token.update({
            vision: true,
            actorLink: true,
            disposition: 1,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates the preliminary data for a Monster.
     *
     * @private
     */
    async _createMonster()
    {
        // Set token defaults.
        this.data.token.update({
            vision: false,
            actorLink: false,
            disposition: -1,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates the preliminary data for a Vehicle.
     *
     * @private
     */
    async _createVehicle()
    {
        // Set token defaults.
        this.data.token.update({
            actorLink: true,
            disposition: 0,
        });
    }

    /**
     * @override
     * @inheritdoc
     */
    prepareDerivedData()
    {
        if (this.data.data.adventuringSkills
            && !(this.data.data.adventuringSkills.warlock
                 || this.data.data.adventuringSkills.warpstar)
            && this.type === "Character")
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
}