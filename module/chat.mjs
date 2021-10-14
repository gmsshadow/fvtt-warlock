export function createRollChatMessage(messageContent, roll) {
    ChatMessage.create({
        user: game.user.id,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        content: messageContent,
        sound: CONFIG.sounds.dice,
        speaker: ChatMessage.getSpeaker(),
        roll: roll,
    });
}

export async function createItemChatMessage(item) {
    let content = null;

    switch (item.type) {
        case "Armour":
            content = await renderTemplate("systems/warlock/templates/chat/armour-card.hbs", item);
            break;
        case "Career":
            content = await renderTemplate("systems/warlock/templates/chat/career-card.hbs", item);
            break;
        case "Equipment":
            content = await renderTemplate("systems/warlock/templates/chat/equipment-card.hbs", item);
            break;
        case "Glyph":
            content = await renderTemplate("systems/warlock/templates/chat/glyph-card.hbs", item);
            break;
        case "Spell":
            content = await renderTemplate("systems/warlock/templates/chat/spell-card.hbs", item);
            break;
        case "Weapon":
            content = await renderTemplate("systems/warlock/templates/chat/weapon-card.hbs", item);
            break;
        default:
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