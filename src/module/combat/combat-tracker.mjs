/**
 * The custom WarlockCombatTracker class that extends the base CombatTracker
 * class.
 */
export class WarlockCombatTracker extends CombatTracker {
    /**
     * @override
     * @inheritdoc
     */
    async getData() {
        const context = await super.getData();

        context.turns.sort((a, b) => {
            const aDisposition = context.combat.combatants.get(a.id).token.disposition;
            const bDisposition = context.combat.combatants.get(b.id).token.disposition;

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
                    return combatant?.system?.initiative ?? false;
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
}
