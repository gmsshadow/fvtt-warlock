import { Rolls } from "../utils/rolls.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * The custom WarlockActorSheet that extends ActorSheetV2 with
 * HandlebarsApplicationMixin for Foundry v14 compatibility.
 *
 * @extends ActorSheetV2
 */
export class WarlockActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["warlock"],
        form: {
            submitOnChange: true,
        },
        actions: {
            chatEffect: WarlockActorSheet._onChatActiveEffect,
            chatItem: WarlockActorSheet._onChatItem,
            createEffect: WarlockActorSheet._onCreateActiveEffect,
            createItem: WarlockActorSheet._onCreateItem,
            deleteEffect: WarlockActorSheet._onDeleteActiveEffect,
            deleteItem: WarlockActorSheet._onDeleteItem,
            editEffect: WarlockActorSheet._onEditActiveEffect,
            editItem: WarlockActorSheet._onEditItem,
            equipItem: WarlockActorSheet._onEquipItem,
            modifyQuantity: WarlockActorSheet._onIncreaseQuantity,
            payStaminaCost: WarlockActorSheet._onPayStaminaCost,
            rollArmour: WarlockActorSheet._onRollStaminaLossReduction,
            rollWeapon: WarlockActorSheet._onRollDamage,
            weaponAttack: WarlockActorSheet._onWeaponAttack,
            toggleDescription: WarlockActorSheet._onToggleDescription,
        },
        dragDrop: [
            { dragSelector: ".abilities__entry" },
            { dragSelector: ".careers__entry" },
            { dragSelector: ".weapons__entry" },
            { dragSelector: ".armour__entry" },
            { dragSelector: ".equipment__entry" },
            { dragSelector: ".spells__entry" },
            { dragSelector: ".glyphs__entry" },
        ],
    };

    /** @override */
    static PARTS = {
        sheet: { template: "" },
    };

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     */
    _onRender(context, options) {
        super._onRender(context, options);

        // Select all text in an input element when focusing it.
        this.element.querySelectorAll("input").forEach((el) => {
            el.addEventListener("focusin", (event) => {
                event.currentTarget.select();
            });
        });

        // Right-click on quantity to decrease.
        this.element.querySelectorAll("[data-action='modifyQuantity']").forEach((el) => {
            el.addEventListener("contextmenu", async (event) => {
                event.preventDefault();
                await this._onDecreaseQuantity(event);
            });
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * @override
     */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Build the context.data.system structure that templates expect.
        context.data ??= {};
        context.data.system ??= this.actor.system;

        context.data.system.activeSystem = game.settings.get("warlock", "activeSystem");

        if (!context.data.system.gear) {
            context.data.system.gear = {};
        }

        context.data.system.gear.weapons = this.actor.itemTypes["Weapon"]
            .sort((a, b) => a.sort - b.sort);
        context.data.system.gear.armour = this.actor.itemTypes["Armour"]
            .sort((a, b) => a.sort - b.sort);
        context.data.system.gear.equipment = this.actor.itemTypes["Equipment"]
            .sort((a, b) => a.sort - b.sort);

        // Provide actor and other properties templates expect.
        context.actor = this.actor;
        context.owner = this.actor.isOwner;
        context.editable = this.isEditable;
        context.effects = this.actor.effects.contents;

        return context;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Displays an ActiveEffect card in the chat log.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onChatActiveEffect(event, target) {
        event.preventDefault();

        const effectId = target.closest(".table__entry").dataset.effectId;
        const effect = this.actor.effects.get(effectId);

        const content = await foundry.applications.handlebars.renderTemplate(
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
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onChatItem(event, target) {
        event.preventDefault();

        const itemId = target.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        const content = await foundry.applications.handlebars.renderTemplate(
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
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onCreateActiveEffect(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

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
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onCreateItem(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const itemType = target.dataset.itemType;
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
                    system: { isActive: true },
                });
            }
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Decreases the quantity of a given equipment Item.
     * Called from the contextmenu listener in _onRender.
     *
     * @param {Event} event The contextmenu event
     */
    async _onDecreaseQuantity(event) {
        if (!this.isEditable) return;

        const itemId = event.currentTarget.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        if ((item.type !== "Equipment") || ((item.system.quantity - 1) < 0)) return;

        await item.update({
            system: { quantity: item.system.quantity - 1 },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Deletes an ActiveEffect from the Actor.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onDeleteActiveEffect(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const effectId = target.closest(".table__entry").dataset.effectId;
        const effect = this.actor.effects.get(effectId);

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format("WARLOCK.Dialogs.DeleteItem.Title", {
                    item: effect.name,
                }),
            },
        });
        if (confirmed) await effect.delete();
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Deletes an Item from the Actor.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onDeleteItem(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const itemId = target.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.format("WARLOCK.Dialogs.DeleteItem.Title", {
                    item: item.name,
                }),
            },
        });
        if (confirmed) {
            await item.delete();

            // Activate the "next" career if the deleted career was the active one.
            if (item.type === "Career" && item.system.isActive) {
                if (this.actor.itemTypes["Career"].length > 0) {
                    await this.actor.itemTypes["Career"][0].update({
                        system: { isActive: true },
                    });
                }
            }
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Opens the corresponding sheet for an ActiveEffect.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onEditActiveEffect(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const effectId = target.closest(".table__entry").dataset.effectId;
        const effect = this.actor.effects.get(effectId);
        effect.sheet.render(true);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Opens the corresponding sheet for an Item.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static _onEditItem(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const itemId = target.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);
        item.sheet.render(true);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Equips an Item within an Actor.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onEquipItem(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const itemId = target.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (item.type !== "Armour" && item.type !== "Weapon") return;

        await item.update({
            system: { isEquipped: !item.system.isEquipped },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Increases the quantity of a given equipment Item.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onIncreaseQuantity(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const itemId = target.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);

        if (item.type !== "Equipment") return;

        await item.update({
            system: { quantity: item.system.quantity + 1 },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Displays a Dialog to subtract the stamina cost of a spell or glyph.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onPayStaminaCost(event, target) {
        event.preventDefault();

        if (!this.isEditable) return;

        const itemId = target.closest(".table__entry").dataset.itemId;
        const item = this.actor.items.get(itemId);
        const staminaCost = item.system.staminaCost;
        const currentStamina = this.actor.system.resources.stamina.value;

        if (staminaCost >= currentStamina) {
            ui.notifications.error(game.i18n.localize("WARLOCK.Notifications.StaminaCost"));
            return;
        }

        const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: {
                title: game.i18n.localize("WARLOCK.Dialogs.StaminaCost.Title"),
            },
            yes: {
                label: game.i18n.format("WARLOCK.Dialogs.StaminaCost.PayStaminaCost", {
                    cost: staminaCost,
                }),
            },
        });
        if (confirmed) {
            await this.actor.update({
                system: {
                    resources: {
                        stamina: {
                            value: currentStamina - staminaCost,
                        },
                    },
                },
            });
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls an armour's stamina loss reduction.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onRollStaminaLossReduction(event, target) {
        event.preventDefault();

        const armourId = target.closest(".table__entry").dataset.itemId;
        const armour = this.actor.items.get(armourId);
        Rolls.rollStaminaLossReduction(this.actor, armour);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Rolls a weapon's damage.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onRollDamage(event, target) {
        event.preventDefault();

        const weaponId = target.closest(".table__entry").dataset.itemId;
        const weapon = this.actor.items.get(weaponId);
        Rolls.rollDamage(this.actor, weapon);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Performs a fully automated combat attack against a targeted token.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onWeaponAttack(event, target) {
        event.preventDefault();

        const weaponId = target.closest(".table__entry").dataset.itemId;

        await Rolls.rollCombatAttack(this.actor, {
            selectedWeaponId: weaponId,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Toggles the display of an Item's description.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static _onToggleDescription(event, target) {
        event.preventDefault();

        const entry = target.closest(".table__entry");
        if (!entry) return;

        const next = entry.nextElementSibling;
        if (!next) return;

        const isHidden = (next.style.display === "none") || (getComputedStyle(next).display === "none");
        next.style.display = isHidden ? "block" : "none";
    }
}
