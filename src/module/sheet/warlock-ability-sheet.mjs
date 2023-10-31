import { WarlockItemSheet } from "./warlock-item-sheet.mjs"

/**
 * The custom WarlockAbilitySheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockAbilitySheet extends WarlockItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/ability-sheet.hbs",
            width: 300,
            height: 325,
        }
    }
}