import { WarlockItemSheet } from "./warlock-item-sheet.mjs";

/**
 * The custom WarlockArmourSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockArmourSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            width: 400,
            height: 300,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/items/armour-sheet.hbs",
        },
    };
}
