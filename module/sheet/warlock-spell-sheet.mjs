export default class WarlockSpellSheet extends ItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/spell-sheet.hbs",
            classes: [
                "warlock",
            ],
            width: 340,
            height: 325,
        }
    }
}