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
        // Preserve the Combat turn order which may be system-defined
        // (e.g. side-based interleaving initiative).
        return await super.getData();
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
