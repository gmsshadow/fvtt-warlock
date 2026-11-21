import { gameConfig } from "../config/systems.mjs";
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * The custom WarlockItemSheet base class using ApplicationV2.
 *
 * @extends HandlebarsApplicationMixin(ItemSheetV2)
 */
export class WarlockItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["warlock", "sheet", "item"],
        window: {
            // Drag the bottom-right corner to resize the sheet.
            resizable: true,
        },
        form: {
            submitOnChange: true,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "",
        },
    };

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     */
    _onRender(context, options) {
        super._onRender(context, options);

        // Select all of the text in an input element when focusing it.
        const inputs = this.element.querySelectorAll("input");
        for (const input of inputs) {
            input.addEventListener("focusin", (event) => {
                event.currentTarget.select();
            });
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Templates read from context.data.system; use a copy so nothing
        // written here leaks into the live item data.
        const system = this.item.system;
        context.data = {
            system: (system instanceof foundry.abstract.DataModel)
                ? system.toObject(false)
                : foundry.utils.deepClone(system ?? {}),
        };
        context.item = this.item;
        context.gameConfig = gameConfig();
        context.owner = this.item.isOwner;
        context.editable = this.isEditable;

        // Raw HTML stays in data.system for the editor's value; enriched HTML
        // is what the <prose-mirror> element displays.
        context.enriched = {
            description: await foundry.applications.ux.TextEditor.enrichHTML(
                context.data.system.description ?? "",
                { relativeTo: this.item, secrets: this.item.isOwner },
            ),
        };

        return context;
    }
}
