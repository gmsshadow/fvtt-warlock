import * as Chat from "../chat.mjs";
import * as Roll from "../roll.mjs";

export default class WarlockActorSheet extends ActorSheet {
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".chat-item").click(this._onChatItem.bind(this));
        html.find(".create-item").click(this._onCreateItem.bind(this));
        html.find(".delete-item").click(this._onDeleteItem.bind(this));
        html.find(".edit-item").click(this._onEditItem.bind(this));
        html.find(".equip-item").click(this._onEquipItem.bind(this));
        html.find(".roll-armour").click(this._onRollArmour.bind(this));
        html.find(".roll-weapon").click(this._onRollWeapon.bind(this));
    }

    getData() {
        const context = super.getData();

        context.data.data.gear.weapons = context.actor.items.filter((item) => {
            return item.type === "Weapon";
        });
        context.data.data.gear.armour = context.actor.items.filter((item) => {
            return item.type === "Armour";
        });
        context.data.data.gear.equipment = context.actor.items.filter((item) => {
            return item.type === "Equipment";
        });

        return context;
    }

    async _onChatItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.id;
        const item = this.actor.items.get(itemId);

        await Chat.createItemChatMessage(item);
    }

    async _onCreateItem(event) {
        if (!this.isEditable) {
            return;
        }

        event.preventDefault();

        const itemType = event.currentTarget.dataset.itemType;
        let itemName = "";

        switch (itemType) {
            case "Armour":
                itemName = game.i18n.localize("WARLOCK.New Armour");
                break;
            case "Career":
                itemName = game.i18n.localize("WARLOCK.New Career");
                break;
            case "Equipment":
                itemName = game.i18n.localize("WARLOCK.New Equipment");
                break;
            case "Glyph":
                itemName = game.i18n.localize("WARLOCK.New Glyph");
                break;
            case "Spell":
                itemName = game.i18n.localize("WARLOCK.New Spell");
                break;
            case "Weapon":
                itemName = game.i18n.localize("WARLOCK.New Weapon");
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

        item.sheet.render(true);

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
        if (!this.isEditable) {
            return;
        }

        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.id;
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

        const itemId = event.currentTarget.closest(".table__entry").dataset.id;
        const item = this.actor.items.get(itemId);
        item.sheet.render(true);
    }

    async _onEquipItem(event) {
        if (!this.isEditable) {
            return;
        }

        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.id;
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

    async _onRollArmour(event) {
        event.preventDefault();

        const armourId = event.currentTarget.closest(".table__entry").dataset.id;
        const armour = this.actor.items.get(armourId);
        Roll.rollArmour(armour);
    }

    async _onRollWeapon(event) {
        event.preventDefault();

        const weaponId = event.currentTarget.closest(".table__entry").dataset.id;
        const weapon = this.actor.items.get(weaponId);
        Roll.rollWeapon(weapon);
    }
}