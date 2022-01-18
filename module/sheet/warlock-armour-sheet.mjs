import WarlockItemSheet from "./warlock-item-sheet.mjs"

/**
 * The custom WarlockArmourSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export default class WarlockArmourSheet extends WarlockItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/armour-sheet.hbs",
            width: 400,
            height: 300,
        }
    }
}