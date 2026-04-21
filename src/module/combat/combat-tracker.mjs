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
        // In Foundry v14 the CombatTracker context menu implementation changed.
        // Use the base implementation, but remove initiative-related entries.
        const options = super._getEntryContextOptions();
        return options.filter(o => !/Initiative/i.test(o?.name ?? ""));
    }
}
