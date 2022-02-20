/**
 * The custom WarlockActor document that extends the base Actor document.
 *
 * @extends Actor
 */
export default class WarlockActor extends Actor {
    /**
     * @override
     * @inheritdoc
     */
    async _onCreate(data, options, userId) {
        await super._onCreate(data, options, userId);

        switch (this.type) {
            case "Character":
                // TODO(jcd): If the default weapons are ever allowed to be in
                // compendia, update this to import the Unarmed weapon instead.

                // Add an "Unarmed" weapon to the character.
                this.createEmbeddedDocuments("Item", [
                    {
                        type: "Weapon",
                        name: "Unarmed",
                        data: {
                            isEquipped: true,
                            type: {
                                value: "Casual",
                            },
                            damage: {
                                roll: "1d6-2",
                                type: {
                                    value: "Crushing",
                                },
                            },
                            skill: {
                                value: "Brawling",
                            },
                        },
                    }
                ]);
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
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        // Set token defaults.
        switch (this.type) {
            case "Character":
                this.data.token.update({
                    vision: true,
                    actorLink: true,
                    disposition: 1,
                });
                break;
            case "Monster":
                this.data.token.update({
                    vision: false,
                    actorLink: false,
                    disposition: -1,
                });
                break;
            case "Vehicle":
                this.data.token.update({
                    actorLink: true,
                    disposition: 0,
                });
                break;
            default:
                break;
        }
    }
}