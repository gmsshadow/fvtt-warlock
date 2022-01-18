import * as Chat from "../utils/chat.mjs";
import * as Roll from "../utils/roll.mjs";

/**
 * The custom WarlockActorSheet that extends the base ActorSheet.
 *
 * @extends ActorSheet
 */
export default class WarlockActorSheet extends ActorSheet {
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

    /* -------------------------------------------- */

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

    /* -------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    getData() {
        const context = super.getData();

        context.data.data.activeSystem = game.settings.get("warlock", "activeSystem");

        context.data.data.gear.weapons = context.actor.itemTypes["Weapon"]
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.gear.armour = context.actor.itemTypes["Armour"]
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });
        context.data.data.gear.equipment = context.actor.itemTypes["Equipment"]
            .sort((a, b) => {
                return a.data.sort - b.data.sort;
            });

        return context;
    }

    /* -------------------------------------------- */

    /**
     * Displays an item card in the chat log.
     *
     * @param {Event} event The click event to send the Item to chat
     *
     * @private
     */
    async _onChatItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        await Chat.createItemChatMessage(item);
    }

    /* -------------------------------------------- */

    /**
     * Creates an Item and embeds it within the Actor.
     *
     * @param {Event} event The click event to create an Item
     *
     * @private
     */
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
                // TODO(jcd) Log an error.
                return;
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

        // Activate the new career if it's the only one.
        if (item.type === "Career") {
            if (this.actor.itemTypes["Career"].length === 1) {
                await item.update({
                    data: {
                        isActive: true,
                    },
                });
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Deletes an Item from the Actor.
     *
     * @param {Event} event The click event to delete an Item
     *
     * @private
     */
    async _onDeleteItem(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        await item.delete();

        // Activate the "next" career if the deleted career was the active one.
        if (item.type === "Career" && item.data.data.isActive) {
            if (this.actor.itemTypes["Career"].length > 0) {
                await this.actor.itemTypes["Career"][0].update({
                    data: {
                        isActive: true,
                    },
                });
            }
        }
    }

    /* -------------------------------------------- */

    /**
     * Opens the corresponding sheet for an Item.
     *
     * @param {Event} event The click event to edit the Item
     *
     * @private
     */
    _onEditItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.sheet.render(true);
    }

    /* -------------------------------------------- */

    /**
     * Equips an Item within an Actor.
     *
     * @param {Event} event The click event to equip the Item
     *
     * @private
     */
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

    /* -------------------------------------------- */

    /**
     * Displays a Dialog to subtract the stamina cost of a spell or glyph from
     * the Actor's current stamina.
     *
     * @param {Event} event The click event to display the stamina cost Dialog
     *
     * @private
     */
    async _onPayStaminaCost(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const staminaCost = item.data.data.staminaCost;

        if (staminaCost >= this.actor.data.data.resources.stamina.value) {
            ui.notifications.error("The stamina cost is equal to or greater than your current stamina!");
            return;
        }

        // TODO(jcd) Move this dialog code somewhere else.

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
                        callback: (html) => resolve({
                            cancelled: true,
                        }),
                    },
                    pay: {
                        icon: "<i class=\"fas fa-tint\"></i>",
                        label: game.i18n.localize("WARLOCK.Pay") + ` ${staminaCost} stamina`,
                        callback: (html) => resolve({
                            cancelled: false,
                        }),
                    },
                },
                close: () => resolve({
                    cancelled: true,
                }),
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

    /* -------------------------------------------- */

    /**
     * Rolls an armour's stamina loss reduction and displays it in the chat log.
     *
     * @param {Event} event The click event to roll the armour's stamina loss
     * reduction
     *
     * @private
     */
    async _onRollArmour(event) {
        event.preventDefault();

        const armourId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const armour = this.actor.items.get(armourId);
        Roll.rollArmour(armour);
    }

    /* -------------------------------------------- */

    /**
     * Rolls a weapon's damage and displays it in the chat log.
     *
     * @param {Event} event The click event to roll the weapon's damage
     *
     * @private
     */
    async _onRollWeapon(event) {
        event.preventDefault();

        const weaponId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const weapon = this.actor.items.get(weaponId);
        Roll.rollWeapon(weapon);
    }

    /* -------------------------------------------- */

    /**
     * Toggles the display of an Item's description.
     *
     * @param {Event} event The click event to toggle an Item's description
     *
     * @private
     */
    _onToggleDescription(event) {
        event.preventDefault();

        $(event.currentTarget.closest(".table__entry")).next().slideToggle();
    }
}