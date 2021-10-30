export default class WarlockItemSheet extends ItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            classes: [
                "warlock",
            ],
        };
    }

    activateListeners(html) {
        html.find("input").focusin((event) => {
            event.currentTarget.select();
        });
    }
}