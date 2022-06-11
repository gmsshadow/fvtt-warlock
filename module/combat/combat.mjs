import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockCombat class that extends the base Combat class.
 */
export class WarlockCombat extends Combat {
    /**
     * @override
     * @inheritdoc
     */
    async delete() {
        await super.delete();
        await this.refreshActionsPerRound();
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    async nextRound() {
        await super.nextRound();
        await this.refreshActionsPerRound();
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    async startCombat() {
        await super.startCombat();
        await this.refreshActionsPerRound();
        await Rolls.rollInitiative();
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Resets the current actions per round for all combatants to their maximum
     * value.
     */
    async refreshActionsPerRound() {
        for (const combatant of this.combatants) {
            await combatant.actor.update({
                data: {
                    resources: {
                        actionsPerRound: {
                            value: combatant.actor.data.data.resources.actionsPerRound.max,
                        },
                    },
                },
            });
        }
    }
}