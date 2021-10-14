export default class WarlockGlyphSheet extends ItemSheet {
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