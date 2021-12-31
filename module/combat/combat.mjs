export default class WarlockCombat extends Combat {
    get combatant() {
        return this.currentlySelectedCombatant || this.turns[this.data.turn];
    }

    async nextRound() {
        await super.nextRound();

        this.combatants.forEach(async (combatant) => {
            await combatant.actor.update({
                data: {
                    resources: {
                        actionsPerRound: {
                            value: combatant.actor.data.data.resources.actionsPerRound.max,
                        },
                    },
                },
            });
        });
    }
}