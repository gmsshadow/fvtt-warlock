import WarlockItemSheet from "./warlock-item-sheet.mjs";

/**
 * The custom WarlockWeaponSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export default class WarlockWeaponSheet extends WarlockItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/weapon-sheet.hbs",
            width: 475,
            height: 275,
        }
    }

    /* -------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    getData() {
        const context = super.getData();

        context.data.data.activeSystem = game.settings.get("warlock", "activeSystem");

        return context;
    }
}