import WarlockItemSheet from "./warlock-item-sheet.mjs";

export default class WarlockWeaponSheet extends WarlockItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/items/weapon-sheet.hbs",
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