export default class WarlockItemSheet extends ItemSheet {
    /**
     * @override
     * @inheritdoc
     */
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            classes: [
                "warlock",
            ],
        };
    }

    /**
     * @override
     * @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);

        // Select all of the text in an input element when focusing it.
        html.find("input").focusin((event) => {
            event.currentTarget.select();
        });
    }
}