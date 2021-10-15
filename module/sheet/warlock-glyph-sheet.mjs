import WarlockItemSheet from "./warlock-item-sheet.mjs"

export default class WarlockGlyphSheet extends WarlockItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/glyph-sheet.hbs",
            classes: [
                "warlock",
            ],
            width: 340,
            height: 325,
        }
    }
}