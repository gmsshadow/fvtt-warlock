const { ItemSheetV2, HandlebarsApplicationMixin } = foundry.applications.sheets;

/**
 * The custom WarlockItemSheet base class using ApplicationV2.
 *
 * @extends HandlebarsApplicationMixin(ItemSheetV2)
 */
export class WarlockItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["warlock"],
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

        // Foundry's sheet context shape has changed over time; keep templates
        // stable by ensuring `context.data.system` always exists.
        context.data ??= {};
        context.data.system ??= context.item?.system ?? this.item.system;

        if (context.data.system.description) {
            context.data.system.description = await foundry.applications.ux.TextEditor.enrichHTML(
                context.data.system.description,
                {
                    async: true,
                },
            );
        }

        return context;
    }
}
