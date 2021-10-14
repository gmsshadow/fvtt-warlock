export default class WarlockEquipmentSheet extends ItemSheet {
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