/**
 * The custom WarlockCombatTracker class that extends the base CombatTracker
 * class.
 */
export class WarlockCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {
    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     *
     * This is overridden to remove the last two buttons that handle initiative
     * by default.
     */
    _getEntryContextOptions() {
        // In Foundry v14 the CombatTracker context menu implementation changed.
        // Use the base implementation, but remove initiative-related entries.
        const options = super._getEntryContextOptions();
        return options.filter(o => !/Initiative/i.test(o?.name ?? ""));
    }
}
