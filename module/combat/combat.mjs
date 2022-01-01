import * as Roll from "../roll.mjs";

export default class WarlockCombat extends Combat {
    get combatant() {
        return this.currentlySelectedCombatant || this.turns[this.data.turn];
    }

    async delete() {
        await super.delete();
        await this.refreshActionsPerRound();
    }

    async nextRound() {
        await super.nextRound();
        await this.refreshActionsPerRound();
    }

    async startCombat() {
        await super.startCombat();
        await this.refreshActionsPerRound();
        await Roll.rollInitiative();
    }

    async refreshActionsPerRound() {
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