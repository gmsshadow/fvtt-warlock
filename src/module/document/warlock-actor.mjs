import { gameConfig } from "../config/systems.mjs";
import { activeSkillKeys } from "../utils/skills.mjs";
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
        const skills = {};
        for (const skill of activeSkillKeys()) {
            // Start all skills off at level 4.
            skills[skill] = 4;
        }

        await this.updateSource({
            system: {
                adventuringSkills: skills,
            }
        });

        // Add an unarmed weapon.
        const { pack: unarmedPack, id: unarmedWeaponId } = gameConfig().weapons.unarmed;
        const weaponsPack = game.packs.get(unarmedPack);

        const wasLocked = weaponsPack.locked;
        if (wasLocked) {
            await weaponsPack.configure({
                locked: false,
            });
        }

        const weapons = await weaponsPack.getDocuments();
        const unarmedWeapon = weapons.find(weapon => weapon.id === unarmedWeaponId).toObject();
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
}
