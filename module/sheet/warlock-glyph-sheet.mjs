import WarlockItemSheet from "./warlock-item-sheet.mjs"

/**
 * The custom WarlockGlyphSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export default class WarlockGlyphSheet extends WarlockItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/glyph-sheet.hbs",
            width: 340,
            height: 325,
        }
    }
}