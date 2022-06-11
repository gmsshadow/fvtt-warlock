import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockCombatTracker class that extends the base CombatTracker
 * class.
 */
export class WarlockCombatTracker extends CombatTracker {
    /**
     * @override
     * @inheritdoc
     */
    get template() {
        return "systems/warlock/templates/sidebar/combat-tracker.hbs";
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".modify-actions-per-round").click(this._onIncrementActionsPerRound.bind(this));
        html.find(".modify-actions-per-round").contextmenu(this._onDecrementActionsPerRound.bind(this));
        html.find(".roll-initiative").click(this._onRollInitiative.bind(this));
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    async getData() {
        const context = await super.getData();

        for (const turn of context.turns) {
            // This is used for determining which CSS class to apply to turns.
            switch (context.combat.combatants.get(turn.id).token.data.disposition) {
                case -1: // Hostile
                    turn.disposition = "hostile";
                    break;
                case 0: // Neutral
                    turn.disposition = "neutral";
                    break;
                case 1: // Friendly
                    turn.disposition = "friendly";
                    break;
                default:
                    break;
            }
        }

        context.turns.sort((a, b) => {
            const aDisposition = context.combat.combatants.get(a.id).token.data.disposition;
            const bDisposition = context.combat.combatants.get(b.id).token.data.disposition;

            // Subtract the disposition from 0 so that friendly is -1, neutral
            // is 0, and hostile is 1.
            return (0 - aDisposition) - (0 - bDisposition);
        });

        return context;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     *
     * This is overridden to remove the last two buttons that handle initiative
     * by default.
     */
    _getEntryContextOptions() {
        return [
            {
                name: "COMBAT.CombatantUpdate",
                icon: "<i class=\"fas fa-edit\"></i>",
                callback: this._onConfigureCombatant.bind(this)
            },
            {
                name: "COMBAT.CombatantClear",
                icon: "<i class=\"fas fa-undo\"></i>",
                condition: li => {
                    const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                    return combatant?.data?.initiative ?? false;
                },
                callback: li => {
                    const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                    return combatant?.update({
                        initiative: null,
                    });
                },
            },
            {
                name: "COMBAT.CombatantRemove",
                icon: "<i class=\"fas fa-trash\"></i>",
                callback: li => {
                    const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                    return combatant?.delete();
                },
            },
        ];
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Increments the current actions per round for a combatant.
     *
     * @param {Event} event The click event to increment the actions per round
     *
     * @private
     */
    async _onIncrementActionsPerRound(event) {
        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget.closest(".combatant");
        const combatant = this.viewed.combatants.get(element.dataset.combatantId);
        const actionsPerRound = combatant.actor.data.data.resources.actionsPerRound;

        if (actionsPerRound.value === actionsPerRound.max) {
            return;
        }

        await combatant.actor.update({
            data: {
                resources: {
                    actionsPerRound: {
                        value: actionsPerRound.value + 1,
                    },
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Decrements the current actions per round for a combatant.
     *
     * @param {Event} event The click event to decrement the actions per round
     *
     * @private
     */
    async _onDecrementActionsPerRound(event) {
        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget.closest(".combatant");
        const combatant = this.viewed.combatants.get(element.dataset.combatantId);
        const actionsPerRound = combatant.actor.data.data.resources.actionsPerRound;

        if (actionsPerRound.value < 1) {
            return;
        }

        await combatant.actor.update({
            data: {
                resources: {
                    actionsPerRound: {
                        value: actionsPerRound.value - 1,
                    },
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls initiative for the player(s) and games master.
     *
     * @param {Event} event The click event to roll initiative
     *
     * @private
     */
    async _onRollInitiative(event) {
        event.preventDefault();

        await Rolls.rollInitiative();
    }
}