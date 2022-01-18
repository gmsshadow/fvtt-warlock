import WarlockItemSheet from "./warlock-item-sheet.mjs"

/**
 * The custom WarlockSpellSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export default class WarlockSpellSheet extends WarlockItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/spell-sheet.hbs",
            width: 340,
            height: 325,
        }
    }
}