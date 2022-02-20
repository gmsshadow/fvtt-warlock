/**
 * Handles the chat message generation logic.
 */
export default class Chat {
    /**
     * Renders the Handlebars template and creates a ChatMessage for a given
     * Roll.
     *
     * @param {Roll} roll The Roll with which to create the ChatMessage
     * @param {ChatSpeakerData} speaker The speaker for the message
     * @param {string} templatePath The path to the Handlebars template for the
     * ChatMessage
     * @param {object} renderOptions The object containing the data needed to
     * render the template
     */
    static async createRollChatMessage(
        roll,
        speaker,
        templatePath,
        renderOptions,
    ) {
        const content = await renderTemplate(templatePath, renderOptions);

        await ChatMessage.create({
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
            content: content,
            sound: CONFIG.sounds.dice,
            speaker: speaker,
            roll: roll,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Renders the Handlebars template and creates a ChatMessage for a given
     * item.
     *
     * @param {WarlockItem} item The item with which to create the ChatMessage
     * @param {Array} details The details to show in the chat card
     */
    static async createItemCardMessage(item, details) {
        const content = await renderTemplate(
            "systems/warlock/templates/chat/item-card.hbs",
            {
                item: item,
                details: details,
            },
        );

        await ChatMessage.create({
            user: game.user.id,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            content: content,
            sound: CONFIG.sounds.notification,
            speaker: ChatMessage.getSpeaker(),
        });
    }
}