import { WarlockItemSheet } from "./warlock-item-sheet.mjs";

/**
 * The custom WarlockEquipmentSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockEquipmentSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            width: 300,
            height: 325,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/items/equipment-sheet.hbs",
        },
    };
}
