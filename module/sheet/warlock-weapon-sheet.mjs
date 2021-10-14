export default class WarlockWeaponSheet extends ItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/weapon-sheet.hbs",
            classes: [
                "warlock",
            ],
            width: 475,
            height: 275,
        }
    }

    getData() {
        const context = super.getData();

        context.data.data.activeSystem = game.settings.get("warlock", "activeSystem");

        return context;
    }
}