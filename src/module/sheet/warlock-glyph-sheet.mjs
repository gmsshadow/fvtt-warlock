import { WarlockItemSheet } from "./warlock-item-sheet.mjs";

/**
 * The custom WarlockGlyphSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockGlyphSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            width: 340,
            height: 325,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/items/glyph-sheet.hbs",
        },
    };
}
