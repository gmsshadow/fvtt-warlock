import * as Roll from "../roll.mjs";
import WarlockActorSheet from "./warlock-actor-sheet.mjs";

export default class WarlockMonsterSheet extends WarlockActorSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            template: "systems/warlock/templates/actors/vehicle-sheet.hbs",
            classes: [
                "warlock",
            ],
            width: 575,
            height: 550,
        }
    }
}