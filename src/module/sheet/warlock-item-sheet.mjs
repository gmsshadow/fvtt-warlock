export class WarlockItemSheet extends ItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions()
    {
        return {
            ...super.defaultOptions,
            classes: [
                "warlock",
            ],
        };
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    activateListeners(html)
    {
        super.activateListeners(html);

        // Select all of the text in an input element when focusing it.
        html.find("input").focusin((event) => {
            event.currentTarget.select();
        });
    }

    /* ---------------------------------------------------------------------- */

    async getData()
    {
        const context = await super.getData();

        if (context.data.system.description)
        {
            context.data.system.description = await TextEditor.enrichHTML(
                context.data.system.description,
                {
                    async: true,
                },
            );
        }

        return context;
    }
}
