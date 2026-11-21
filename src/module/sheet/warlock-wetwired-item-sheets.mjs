import { WarlockItemSheet } from "./warlock-item-sheet.mjs";

/**
 * Item sheets for the Wetwired item types: cyberware, cyberdecks, programs
 * and contacts. Each is a plain item sheet with its own template.
 */

export class WarlockCyberwareSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = { position: { width: 520, height: 340 } };

    /** @override */
    static PARTS = { sheet: { template: "systems/warlock/templates/items/cyberware-sheet.hbs" } };
}

export class WarlockCyberdeckSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = { position: { width: 400, height: 325 } };

    /** @override */
    static PARTS = { sheet: { template: "systems/warlock/templates/items/cyberdeck-sheet.hbs" } };
}

export class WarlockProgramSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = { position: { width: 440, height: 325 } };

    /** @override */
    static PARTS = { sheet: { template: "systems/warlock/templates/items/program-sheet.hbs" } };
}

export class WarlockContactSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = { position: { width: 440, height: 325 } };

    /** @override */
    static PARTS = { sheet: { template: "systems/warlock/templates/items/contact-sheet.hbs" } };
}
