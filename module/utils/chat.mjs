/**
 * Renders the Handlebars template and creates a ChatMessage for a given Roll.
 *
 * @param {Roll} roll The Roll with which to create the ChatMessage
 * @param {ChatSpeakerData} speaker The speaker for the message
 * @param {string} templatePath The path to the Handlebars template for the
 * ChatMessage.
 * @param {object} renderOptions The object containing the data needed to render
 * the template.
 */
export async function createRollChatMessage(
    roll,
    speaker,
    templatePath,
    renderOptions,
) {
    const content = await renderTemplate(templatePath, renderOptions);

    ChatMessage.create({
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        content: content,
        sound: CONFIG.sounds.dice,
        speaker: speaker,
        roll: roll,
    });
}

/* -------------------------------------------- */

/**
 * Renders the Handlebars template and creates a ChatMessage for a given item.
 *
 * @param {WarlockItem} item The item with which to create the ChatMessage
 */
export async function createItemChatMessage(item) {
    let content;

    switch (item.type) {
        case "Armour":
            content = await renderTemplate(
                "systems/warlock/templates/chat/armour-card.hbs",
                item,
            );
            break;
        case "Career":
            content = await renderTemplate(
                "systems/warlock/templates/chat/career-card.hbs",
                item,
            );
            break;
        case "Equipment":
            content = await renderTemplate(
                "systems/warlock/templates/chat/equipment-card.hbs",
                item,
            );
            break;
        case "Glyph":
            content = await renderTemplate(
                "systems/warlock/templates/chat/glyph-card.hbs",
                item,
            );
            break;
        case "Spell":
            content = await renderTemplate(
                "systems/warlock/templates/chat/spell-card.hbs",
                item,
            );
            break;
        case "Weapon":
            content = await renderTemplate(
                "systems/warlock/templates/chat/weapon-card.hbs",
                item,
            );
            break;
        default:
            // Exit early if the item has no template.
            return;
    }

    ChatMessage.create({
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        content: content,
        sound: CONFIG.sounds.notification,
        speaker: ChatMessage.getSpeaker(),
    });
}