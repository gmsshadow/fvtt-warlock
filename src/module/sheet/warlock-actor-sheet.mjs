import { Rolls } from "../utils/rolls.mjs";

/**
 * The custom WarlockActorSheet that extends the base ActorSheet.
 *
 * @extends ActorSheet
 */
export class WarlockActorSheet extends ActorSheet {
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
                    dragSelector: ".abilities__entry",
                },
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

    /* ---------------------------------------------------------------------- */

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

        html.find(".chat-effect").click(this._onChatActiveEffect.bind(this));
        html.find(".chat-item").click(this._onChatItem.bind(this));
        html.find(".create-effect").click(this._onCreateActiveEffect.bind(this));
        html.find(".create-item").click(this._onCreateItem.bind(this));
        html.find(".delete-effect").click(this._onDeleteActiveEffect.bind(this));
        html.find(".delete-item").click(this._onDeleteItem.bind(this));
        html.find(".edit-effect").click(this._onEditActiveEffect.bind(this));
        html.find(".edit-item").click(this._onEditItem.bind(this));
        html.find(".equip-item").click(this._onEquipItem.bind(this));
        html.find(".modify-quantity").click(this._onIncreaseQuantity.bind(this));
        html.find(".modify-quantity").contextmenu(this._onDecreaseQuantity.bind(this));
        html.find(".pay-stamina-cost").click(this._onPayStaminaCost.bind(this));
        html.find(".roll-armour").click(this._onRollStaminaLossReduction.bind(this));
        html.find(".roll-weapon").click(this._onRollDamage.bind(this));
        html.find(".weapon-attack").click(this._onWeaponAttack.bind(this));
        html.find(".toggle-description").click(this._onToggleDescription.bind(this));
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     * @inheritdoc
     */
    async getData() {
        const context = await super.getData();

        // Foundry's sheet context shape has changed over time; keep templates
        // stable by ensuring `context.data.system` always exists.
        context.data ??= {};
        context.data.system ??= context.actor?.system ?? this.actor.system;

        context.data.system.activeSystem = game.settings.get("warlock", "activeSystem");

        if (!context.data.system.gear) {
            context.data.system.gear = {};
        }

        context.data.system.gear.weapons = context.actor.itemTypes["Weapon"]
            .sort((a, b) => {
                return a.sort - b.sort;
            });
        context.data.system.gear.armour = context.actor.itemTypes["Armour"]
            .sort((a, b) => {
                return a.sort - b.sort;
            });
        context.data.system.gear.equipment = context.actor.itemTypes["Equipment"]
            .sort((a, b) => {
                return a.sort - b.sort;
            });

        return context;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Displays an ActiveEffect card in the chat log.
     *
     * @param {Event} event The click event to send the ActiveEffect to chat
     *
     * @private
     */
    async _onChatActiveEffect(event) {
        event.preventDefault();

        const effectId = event.currentTarget.closest(".table__entry").dataset.effectId;
        const effect = this.actor.effects.get(effectId);

        const content = await renderTemplate(
            "systems/warlock/templates/chat/item-card.hbs",
            {
                name: effect.name,
                img: effect.icon ?? effect.img,
            },
        );

        await ChatMessage.create({
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: content,
            sound: CONFIG.sounds.notification,
            speaker: ChatMessage.getSpeaker({
                actor: this.actor,
            }),
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Displays an Item card in the chat log.
     *
     * @param {Event} event The click event to send the Item to chat
     *
     * @private
     */
    async _onChatItem(event) {
        event.preventDefault();

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        const content = await renderTemplate(
            "systems/warlock/templates/chat/item-card.hbs",
            {
                name: item.name,
                img: item.img,
                description: item.system.description,
                details: item.generateDetails(),
            },
        );

        await ChatMessage.create({
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: content,
            sound: CONFIG.sounds.notification,
            speaker: ChatMessage.getSpeaker({
                actor: this.actor,
            }),
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates an embedded ActiveEffect within the Actor.
     *
     * @param {Event} event The click event to create an ActiveEffect
     *
     * @private
     */
    async _onCreateActiveEffect(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        await this.actor.createEmbeddedDocuments("ActiveEffect", [{
            label: game.i18n.localize("WARLOCK.ActiveEffect.NewActiveEffect"),
            icon: "icons/svg/aura.svg",
            origin: this.actor.uuid,
        }]);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Creates an embedded Item within the Actor.
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
        const itemName = game.i18n.format("WARLOCK.Items.NewItem", {
            item: game.i18n.localize(`WARLOCK.Items.${itemType}.Name`),
        });

        const items = await this.actor.createEmbeddedDocuments("Item", [{
            type: itemType,
            name: itemName,
        }]);
        const item = items[0];

        // Activate the new career if it's the only one.
        if (item.type === "Career") {
            if (this.actor.itemTypes["Career"].length === 1) {
                await item.update({
                    system: {
                        isActive: true,
                    },
                });
            }
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Decreases the quantity of a given equipment Item.
     *
     * @param {Event} event The contextmenu event to decrease the quantity
     *
     * @private
     */
    async _onDecreaseQuantity(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        if ((item.type !== "Equipment")
            || ((item.system.quantity - 1) < 0)) {
            return;
        }

        await item.update({
            system: {
                quantity: item.system.quantity - 1,
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Deletes an ActiveEffect from the Actor.
     *
     * @param {Event} event The click event to delete an ActiveEffect
     *
     * @private
     */
    async _onDeleteActiveEffect(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const effectId = event.currentTarget.closest(".table__entry").dataset.effectId;
        const effect = this.actor.effects.get(effectId);

        await Dialog.confirm({
            title: game.i18n.format("WARLOCK.Dialogs.DeleteItem.Title", {
                item: effect.name,
            }),
            yes: async () => {
                await effect.delete();
            },
        });
    }

    /* ---------------------------------------------------------------------- */

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

        await Dialog.confirm({
            title: game.i18n.format("WARLOCK.Dialogs.DeleteItem.Title", {
                item: item.name,
            }),
            yes: async () => {
                await item.delete();

                // Activate the "next" career if the deleted career was the active one.
                if (item.type === "Career" && item.system.isActive) {
                    if (this.actor.itemTypes["Career"].length > 0) {
                        await this.actor.itemTypes["Career"][0].update({
                            system: {
                                isActive: true,
                            },
                        });
                    }
                }
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Opens the corresponding sheet for an ActiveEffect.
     *
     * @param {Event} event The click event to edit the ActiveEffect
     *
     * @private
     */
    async _onEditActiveEffect(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const effectId = event.currentTarget.closest(".table__entry").dataset.effectId;
        const effect = this.actor.effects.get(effectId);
        effect.sheet.render(true);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Opens the corresponding sheet for an Item.
     *
     * @param {Event} event The click event to edit the Item
     *
     * @private
     */
    _onEditItem(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.sheet.render(true);
    }

    /* ---------------------------------------------------------------------- */

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

        if (item.type !== "Armour" && item.type !== "Weapon") {
            return;
        }

        await item.update({
            system: {
                isEquipped: !item.system.isEquipped,
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Increases the quantity of a given equipment Item.
     *
     * @param {Event} event The click event to increase the quantity
     *
     * @private
     */
    async _onIncreaseQuantity(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (item.type !== "Equipment") {
            return;
        }

        await item.update({
            system: {
                quantity: item.system.quantity + 1,
            },
        });
    }

    /* ---------------------------------------------------------------------- */

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

        if (!this.isEditable) {
            return;
        }

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const staminaCost = item.system.staminaCost;
        const currentStamina = this.actor.system.resources.stamina.value;

        if (staminaCost >= currentStamina) {
            ui.notifications.error(game.i18n.localize("WARLOCK.Notifications.StaminaCost"));
            return;
        }

        const payStaminaCost = await Dialog.prompt({
            title: game.i18n.localize("WARLOCK.Dialogs.StaminaCost.Title"),
            label: game.i18n.format("WARLOCK.Dialogs.StaminaCost.PayStaminaCost", {
                cost: staminaCost,
            }),
            callback: async () => {
                await this.actor.update({
                    system: {
                        resources: {
                            stamina: {
                                value: currentStamina - staminaCost,
                            }
                        }
                    }
                });
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls an armour's stamina loss reduction and displays it in the chat log.
     *
     * @param {Event} event The click event to roll the armour's stamina loss
     * reduction
     *
     * @private
     */
    async _onRollStaminaLossReduction(event) {
        event.preventDefault();

        const armourId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const armour = this.actor.items.get(armourId);
        Rolls.rollStaminaLossReduction(this.actor, armour);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a weapon's damage and displays it in the chat log.
     *
     * @param {Event} event The click event to roll the weapon's damage
     *
     * @private
     */
    async _onRollDamage(event) {
        event.preventDefault();

        const weaponId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const weapon = this.actor.items.get(weaponId);
        Rolls.rollDamage(this.actor, weapon);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Performs a fully automated combat attack against a targeted token.
     * Target a token first, then click the weapon attack button.
     *
     * @param {Event} event The click event to perform the weapon attack
     *
     * @private
     */
    async _onWeaponAttack(event) {
        event.preventDefault();

        const weaponId = event.currentTarget.closest(".table__entry").dataset.itemId;

        await Rolls.rollCombatAttack(this.actor, {
            selectedWeaponId: weaponId,
        });
    }

    /* ---------------------------------------------------------------------- */

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
