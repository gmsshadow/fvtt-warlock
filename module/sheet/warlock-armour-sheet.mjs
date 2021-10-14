export default class WarlockArmourSheet extends ItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/armour-sheet.hbs",
            classes: [
                "warlock",
            ],
            width: 400,
            height: 300,
        }
    }
}