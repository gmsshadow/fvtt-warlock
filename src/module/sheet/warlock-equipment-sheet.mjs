import { WarlockItemSheet } from "./warlock-item-sheet.mjs"

/**
 * The custom WarlockEquipmentSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockEquipmentSheet extends WarlockItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/equipment-sheet.hbs",
            width: 300,
            height: 325,
        }
    }
}