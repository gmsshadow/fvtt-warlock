import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockCombat class that extends the base Combat class.
 */
export class WarlockCombat extends Combat {
    /* ---------------------------------------------------------------------- */

    /**
     * Determine which side a combatant belongs to.
     *
     * Players side: combatants with a player-owned actor (including allies) or
     * a friendly token disposition. Everything else defaults to GM.
     *
     * @param {Combatant} combatant
     * @returns {"players"|"gm"}
     */
    static getCombatantSide(combatant) {
        const actor = combatant.actor;
        const disposition = combatant.token?.disposition;
        const isPlayersSide = Boolean(actor?.hasPlayerOwner) || (disposition === 1);
        return isPlayersSide ? "players" : "gm";
    }

    /**
     * Get combatants on a side that still have actions remaining this round.
     *
     * If the actor does not have an actions-per-round resource, treat them as
     * having 1 action (so they remain eligible).
     *
     * @param {"players"|"gm"} side
     * @returns {Combatant[]}
     */
    getEligibleCombatants(side) {
        return this.combatants
            .filter(c => WarlockCombat.getCombatantSide(c) === side)
            .filter(c => {
                const remaining = c.actor?.system?.resources?.actionsPerRound?.value;
                return (remaining === undefined) ? true : remaining > 0;
            });
    }

    /**
     * Prompt the user (GM) to select which combatant acts for a side.
     *
     * @param {"players"|"gm"} side
     * @returns {Promise<Combatant|null>}
     */
    async promptSelectCombatant(side) {
        const eligible = this.getEligibleCombatants(side);
        if (eligible.length === 0) return null;
        if (eligible.length === 1) return eligible[0];

        const byName = (a, b) => (a.name ?? "").localeCompare(b.name ?? "");
        eligible.sort(byName);

        const content = `
            <form class="warlock-side-initiative-select">
                <div class="form-group">
                    <label>Select combatant</label>
                    <div class="form-fields">
                        <select name="combatantId">
                            ${eligible.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
                        </select>
                    </div>
                </div>
            </form>
        `;

        return await new Promise(resolve => {
            new Dialog({
                title: (side === "players") ? "Players Turn" : "GM Turn",
                content,
                buttons: {
                    ok: {
                        icon: "<i class=\"fas fa-check\"></i>",
                        label: "Act",
                        callback: (html) => {
                            const id = html[0].querySelector("select[name='combatantId']")?.value;
                            resolve(this.combatants.get(id) ?? null);
                        },
                    },
                },
                default: "ok",
                close: () => resolve(null),
            }).render(true);
        });
    }

    /**
     * Set the Combat turn to a specific combatant.
     *
     * @param {Combatant} combatant
     */
    async setTurnToCombatant(combatant) {
        const idx = this.turns.findIndex(t => t.id === combatant.id);
        if (idx < 0) return;
        await this.update({ turn: idx });
    }

    /**
     * Decrement the current combatant's remaining actions by 1.
     *
     * This uses the system's tracked actions-per-round resource when present.
     */
    async consumeCurrentCombatantAction() {
        const combatant = this.combatant;
        const actor = combatant?.actor;
        if (!actor) return;

        const current = actor.system.resources?.actionsPerRound?.value;
        if (current === undefined) return;

        await actor.update({
            system: {
                resources: {
                    actionsPerRound: {
                        value: Math.max(0, current - 1),
                    },
                },
            },
        });
    }

    /**
     * Advance the "side turn" and pick the next acting combatant.
     *
     * Alternates sides unless the next side has no eligible combatants, in
     * which case the current side continues (excess combatants / extra actions).
     */
    async advanceSideTurn() {
        const winner = this.getFlag("warlock", "sideInitiativeWinner");
        if (!winner) return;

        // Initialize if missing.
        let sideTurn = this.getFlag("warlock", "sideTurn");
        if (!sideTurn) {
            sideTurn = winner;
            await this.setFlag("warlock", "sideTurn", sideTurn);
        }

        const otherSide = (sideTurn === "players") ? "gm" : "players";
        const eligibleOther = this.getEligibleCombatants(otherSide);
        const eligibleSame = this.getEligibleCombatants(sideTurn);

        // Determine which side acts next.
        let nextSide;
        if (eligibleOther.length > 0) {
            nextSide = otherSide;
        } else if (eligibleSame.length > 0) {
            nextSide = sideTurn;
        } else {
            // Nobody has actions left -> new round.
            await this.nextRound();
            return;
        }

        await this.setFlag("warlock", "sideTurn", nextSide);

        // GM chooses any eligible combatant for that side.
        const nextCombatant = await this.promptSelectCombatant(nextSide);
        if (nextCombatant) {
            await this.setTurnToCombatant(nextCombatant);
        }
    }

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
            (WarlockCombat.getCombatantSide(combatant) === "players" ? players : gm).push(combatant);
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
    async nextTurn() {
        // Consume an action for the combatant who just acted.
        await this.consumeCurrentCombatantAction();

        // Advance to the next side's chosen combatant (or same side if the
        // opposing side is out of eligible combatants).
        await this.advanceSideTurn();
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

        // New round starts with the initiative winner's side.
        const winner = this.getFlag("warlock", "sideInitiativeWinner");
        if (winner) {
            await this.setFlag("warlock", "sideTurn", winner);
            const first = await this.promptSelectCombatant(winner);
            if (first) await this.setTurnToCombatant(first);
        }
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

        // Winner chooses which combatant acts first.
        await this.setFlag("warlock", "sideTurn", result.winner);
        const first = await this.promptSelectCombatant(result.winner);
        if (first) await this.setTurnToCombatant(first);
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
