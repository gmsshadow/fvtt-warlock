import WarlockActorSheet from "./warlock-actor-sheet.mjs";

/**
 * The custom WarlockVehicleSheet that extends the custom WarlockActorSheet.
 *
 * @extends WarlockActorSheet
 */
export default class WarlockVehicleSheet extends WarlockActorSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/actors/vehicle-sheet.hbs",
            width: 575,
            height: 550,
            tabs: [
                {
                    navSelector: ".tabs",
                    contentSelector: ".body",
                    initial: "gear",
                },
            ],
        }
    }
}