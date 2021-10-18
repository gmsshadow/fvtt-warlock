import WarlockItemSheet from "./warlock-item-sheet.mjs"

export default class WarlockArmourSheet extends WarlockItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/armour-sheet.hbs",
            width: 400,
            height: 300,
        }
    }
}