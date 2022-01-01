export default class WarlockActor extends Actor {
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        if (this.type === "Character") {
            this.data.token.update({
                vision: true,
                actorLink: true,
                disposition: 1,
            });
        } else if (this.type === "Vehicle") {
            this.data.token.update({
                actorLink: true,
                disposition: 0,
            });
        }
    }
}