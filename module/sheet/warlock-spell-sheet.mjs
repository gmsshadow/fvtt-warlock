import WarlockItemSheet from "./warlock-item-sheet.mjs"

export default class WarlockSpellSheet extends WarlockItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/spell-sheet.hbs",
            width: 340,
            height: 325,
        }
    }
}