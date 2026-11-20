import { WarlockItemSheet } from "./warlock-item-sheet.mjs";

/**
 * The custom WarlockWeaponSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockWeaponSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            width: 475,
            height: 275,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/items/weapon-sheet.hbs",
        },
    };
}
