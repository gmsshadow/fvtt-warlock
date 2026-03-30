import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockCombat class that extends the base Combat class.
 */
export class WarlockCombat extends Combat {
    /**
     * Apply Warlock side-based initiative order for the current combatants.
     *
     * We interleave sides starting with the initiative winner. When one side
     * runs out of combatants, the other side continues with their remaining
     * combatants.
     */
    async applySideInitiativeOrder() {
        const winner = this.getFlag("warlock", "sideInitiativeWinner");
        if (!winner) return;

        const players = [];
        const gm = [];

        for (const combatant of this.combatants) {
            const actor = combatant.actor;
            const disposition = combatant.token?.disposition;

            // Players side: any combatant with a player owner (including allies),
            // or friendly disposition tokens. Everything else defaults to GM.
            const isPlayersSide = Boolean(actor?.hasPlayerOwner) || (disposition === 1);
            (isPlayersSide ? players : gm).push(combatant);
        }

        const byName = (a, b) => (a.name ?? "").localeCompare(b.name ?? "");
        players.sort(byName);
        gm.sort(byName);

        const order = [];
        let iPlayers = 0;
        let iGm = 0;
        let nextSide = winner;

        while (iPlayers < players.length && iGm < gm.length) {
            if (nextSide === "players") {
                order.push(players[iPlayers++]);
                nextSide = "gm";
            } else {
                order.push(gm[iGm++]);
                nextSide = "players";
            }
        }

        // Append any remaining combatants from the side with excess members.
        while (iPlayers < players.length) order.push(players[iPlayers++]);
        while (iGm < gm.length) order.push(gm[iGm++]);

        // Assign initiatives to enforce the order.
        // Use a large base to avoid collisions with existing initiatives.
        const base = 1000;
        const updates = order.map((combatant, idx) => ({
            _id: combatant.id,
            initiative: base - idx,
        }));

        if (updates.length) {
            await this.updateEmbeddedDocuments("Combatant", updates);
        }
    }

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
        await this.applySideInitiativeOrder();
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    async startCombat() {
        await super.startCombat();
        await this.refreshActionsPerRound();
        const result = await Rolls.rollInitiative();
        await this.setFlag("warlock", "sideInitiativeWinner", result.winner);
        await this.setFlag("warlock", "sideInitiativePlayersTotal", result.playersTotal);
        await this.setFlag("warlock", "sideInitiativeGmTotal", result.gmTotal);
        await this.applySideInitiativeOrder();
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Resets the current actions per round for all combatants to their maximum
     * value.
     */
    async refreshActionsPerRound() {
        for (const combatant of this.combatants) {
            if (combatant.actor.system.resources?.actionsPerRound) {
                await combatant.actor.update({
                    system: {
                        resources: {
                            actionsPerRound: {
                                value: combatant.actor.system.resources.actionsPerRound.max,
                            },
                        },
                    },
                });
            }

            combatant.updateResource();
        }
    }
}
