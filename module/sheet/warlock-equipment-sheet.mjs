import WarlockItemSheet from "./warlock-item-sheet.mjs"

export default class WarlockEquipmentSheet extends WarlockItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/equipment-sheet.hbs",
            classes: [
                "warlock",
            ],
            width: 300,
            height: 325,
        }
    }
}