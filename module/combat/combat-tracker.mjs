import * as Roll from "../utils/roll.mjs";

/**
 * The custom WarlockCombatTracker class that extends the base CombatTracker
 * class.
 */
export default class WarlockCombatTracker extends CombatTracker {
    /**
     * @override
     * @inheritdoc
     */
    get template() {
        return "systems/warlock/templates/sidebar/combat-tracker.hbs";
    }

    /* -------------------------------------------- */

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

    /* -------------------------------------------- */

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
                icon: '<i class="fas fa-edit"></i>',
                callback: this._onConfigureCombatant.bind(this)
            },
            {
                name: "COMBAT.CombatantClear",
                icon: '<i class="fas fa-undo"></i>',
                condition: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                return combatant?.data?.initiative ?? false;
                },
                callback: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                if (combatant) return combatant.update({initiative: null});
                }
            },
            {
                name: "COMBAT.CombatantRemove",
                icon: '<i class="fas fa-trash"></i>',
                callback: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                if (combatant) return combatant.delete();
                }
            },
        ];
    }

    /* -------------------------------------------- */

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

    /* -------------------------------------------- */

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

    /* -------------------------------------------- */

    /**
     * Rolls initiative for the player(s) and games master.
     *
     * @param {Event} event The click event to roll initiative
     *
     * @private
     */
    async _onRollInitiative(event) {
        event.preventDefault();

        await Roll.rollInitiative();
    }
}