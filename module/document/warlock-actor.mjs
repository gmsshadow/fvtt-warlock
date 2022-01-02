export default class WarlockActor extends Actor {
    async _onCreate(data, options, userId) {
        await super._onCreate(data, options, userId);

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
    }

    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        if (this.type === "Character") {
            // Set token defaults.
            this.data.token.update({
                vision: true,
                actorLink: true,
                disposition: 1,
            });
        } else if (this.type === "Vehicle") {
            // Set token defaults.
            this.data.token.update({
                actorLink: true,
                disposition: 0,
            });
        }
    }
}