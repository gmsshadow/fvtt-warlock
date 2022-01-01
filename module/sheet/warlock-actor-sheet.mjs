import * as Chat from "../chat.mjs";
import * as Roll from "../roll.mjs";

export default class WarlockActorSheet extends ActorSheet {
    static get defaultOptions() {
        return {
            ...super.defaultOptions,
            classes: [
                "warlock",
            ],
            dragDrop: [
                {
                    dragSelector: ".careers__entry",
                },
                {
                    dragSelector: ".weapons__entry",
                },
                {
                    dragSelector: ".armour__entry",
                },
                {
                    dragSelector: ".equipment__entry",
                },
                {
                    dragSelector: ".spells__entry",
                },
                {
                    dragSelector: ".glyphs__entry",
                },
            ],
        }
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find("input").focusin((event) => {
            event.currentTarget.select();
        });

        html.find(".chat-item").click(this._onChatItem.bind(this));
        html.find(".create-item").click(this._onCreateItem.bind(this));
        html.find(".delete-item").click(this._onDeleteItem.bind(this));
        html.find(".edit-item").click(this._onEditItem.bind(this));
        html.find(".equip-item").click(this._onEquipItem.bind(this));
        html.find(".pay-stamina-cost").click(this._onPayStaminaCost.bind(this));
        html.find(".roll-armour").click(this._onRollArmour.bind(this));
        html.find(".roll-weapon").click(this._onRollWeapon.bind(this));
        html.find(".toggle-description").click(this._onToggleDescription.bind(this));
    }

    getData() {
        const context = super.getData();

        context.data.data.activeSystem = game.settings.get("warlock", "activeSystem");

        context.data.data.gear.weapons = context.actor.items
            .filter((item) => {
                return item.type === "Weapon";
            })
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.gear.armour = context.actor.items
            .filter((item) => {
                return item.type === "Armour";
            })
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.gear.equipment = context.actor.items
            .filter((item) => {
                return item.type === "Equipment";
            })
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });

        return context;
    }

    async _onChatItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        await Chat.createItemChatMessage(item);
    }

    async _onCreateItem(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const itemType = event.currentTarget.dataset.itemType;
        let itemName = "";

        switch (itemType) {
            case "Armour":
                itemName = game.i18n.localize("WARLOCK.NewArmour");
                break;
            case "Career":
                itemName = game.i18n.localize("WARLOCK.NewCareer");
                break;
            case "Equipment":
                itemName = game.i18n.localize("WARLOCK.NewEquipment");
                break;
            case "Glyph":
                itemName = game.i18n.localize("WARLOCK.NewGlyph");
                break;
            case "Spell":
                itemName = game.i18n.localize("WARLOCK.NewSpell");
                break;
            case "Weapon":
                itemName = game.i18n.localize("WARLOCK.NewWeapon");
                break;
            default:
                break;
        }

        const item = await Item.create(
            {
                type: itemType,
                name: itemName,
            },
            {
                parent: this.actor,
            },
        );

        if (item.type === "Career") {
            const numberOfCareers = this.actor.items
                .filter((item) => {
                    return item.type === "Career";
                })
                .length;

            if (numberOfCareers === 1) {
                await item.update({
                    data: {
                        isActive: true,
                    },
                });
            }
        }
    }

    async _onDeleteItem(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        await item.delete();

        if (item.type === "Career" && item.data.data.isActive) {
            const careers = this.actor.items.filter((item) => {
                return item.type === "Career";
            });

            if (careers.length > 0) {
                await careers[0].update({
                    data: {
                        isActive: true,
                    },
                });
            }
        }
    }

    _onEditItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.sheet.render(true);
    }

    async _onEquipItem(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (item.data.type !== "Armour" && item.data.type !== "Weapon") {
            return;
        }

        await item.update({
            data: {
                isEquipped: !item.data.data.isEquipped,
            },
        });
    }

    async _onPayStaminaCost(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const staminaCost = item.data.data.staminaCost;

        if (staminaCost >= this.actor.data.data.resources.stamina.value) {
            ui.notifications.error("The stamina cost is equal to or greater than your current stamina!");
            return;
        }

        const dialogTemplate = "systems/warlock/templates/dialogs/stamina-cost-dialog.hbs";
        const dialogHtml = await renderTemplate(dialogTemplate, {
            staminaCost: staminaCost,
        });

        const options = await new Promise(resolve => {
            new Dialog({
                title: game.i18n.localize("WARLOCK.StaminaCost"),
                content: dialogHtml,
                buttons: {
                    cancel: {
                        icon: "<i class=\"fas fa-times\"></i>",
                        label: game.i18n.localize("WARLOCK.Cancel"),
                        callback: (html) => resolve({cancelled: true}),
                    },
                    pay: {
                        icon: "<i class=\"fas fa-tint\"></i>",
                        label: game.i18n.localize("WARLOCK.Pay") + ` ${staminaCost} stamina`,
                        callback: (html) => resolve({cancelled: false}),
                    },
                },
                close: () => resolve({cancelled: true}),
            }, null).render(true);
        });

        if (options.cancelled) {
            return;
        }

        await this.actor.update({
            data: {
                resources: {
                    stamina: {
                        value: this.actor.data.data.resources.stamina.value - staminaCost,
                    }
                }
            }
        });
    }

    async _onRollArmour(event) {
        event.preventDefault();

        const armourId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const armour = this.actor.items.get(armourId);
        Roll.rollArmour(armour);
    }

    async _onRollWeapon(event) {
        event.preventDefault();

        const weaponId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const weapon = this.actor.items.get(weaponId);
        Roll.rollWeapon(weapon);
    }

    _onToggleDescription(event) {
        event.preventDefault();

        $(event.currentTarget.closest(".table__entry")).next().slideToggle();
    }
}