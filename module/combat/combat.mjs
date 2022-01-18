import * as Roll from "../utils/roll.mjs";

/**
 * The custom WarlockCombat class that extends the base Combat class.
 */
export default class WarlockCombat extends Combat {
    /**
     * @override
     * @inheritdoc
     */
    async delete() {
        await super.delete();
        await this.refreshActionsPerRound();
    }

    /* -------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    async nextRound() {
        await super.nextRound();
        await this.refreshActionsPerRound();
    }

    /* -------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    async startCombat() {
        await super.startCombat();
        await this.refreshActionsPerRound();
        await Roll.rollInitiative();
    }

    /* -------------------------------------------- */

    /**
     * Resets the current actions per round for all combatants to their maximum
     * value.
     */
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