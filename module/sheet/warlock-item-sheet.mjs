export default class WarlockItemSheet extends ItemSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            classes: [
                "warlock",
            ],
        };
    }
}