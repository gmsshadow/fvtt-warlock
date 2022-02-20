/**
 * Handles the migrations from the various system versions.
 */
export default class Migrations {
    /**
     * Migrate the world which includes actors, items, scenes, compendia, etc.
     */
    static async migrateWorld() {
        ui.notifications.info(`Migrating your world for version ${game.system.data.version} — Please do not close your game or shut down your server.`, {
            permanent: true,
        });

        // Migrate actors.
        for (let actor of game.actors) {
            const actorUpdateData = Migrations._migrateActorData(actor.data);
            await actor.update(actorUpdateData);

            for (let item of actor.items) {
                const itemUpdateData = Migrations._migrateItemData(item.data);
                await item.update(itemUpdateData);
            }
        }

        // Migrate items.
        for (let item of game.items) {
            const updateData = Migrations._migrateItemData(item.data);
            await item.update(updateData);
        }

        // Migrate packs.
        for (let pack of game.packs) {
            await Migrations._migratePackData(pack);
        }

        // Set the migration version for future sessions.
        game.settings.set("warlock", "systemMigrationVersion", game.system.data.version);

        ui.notifications.info(`Successfully migrated your world for version ${game.system.data.version}!`, {
            permanent: true,
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ActorData for an Actor.
     *
     * @param {data.ActorData} actorData The data corresponding to an Actor
     * @returns {object} The modifications to the ActorData object
     *
     * @private
     */
    static _migrateActorData(actorData) {
        const updateData = {};

        switch (actorData.type) {
            case "Character":
                Migrations._migrateCharacterData(actorData, updateData);
                break;
            case "Monster":
                Migrations._migrateMonsterData(actorData, updateData);
                break;
            case "Vehicle":
                Migrations._migrateVehicleData(actorData, updateData);
                break;
            default:
                // TODO(jcd): Log an error here.
                break;
        }

        return updateData;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ActorData for a Character.
     *
     * This function is currently a no-op since no migrations need to occur for
     * Characters.
     *
     * @param {data.ActorData} actorData The data corresponding to a Character
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateCharacterData(actorData, updateData) {
        // Do nothing.
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ActorData for a Monster.
     *
     * @param {data.ActorData} actorData The data corresponding to a Monster
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateMonsterData(actorData, updateData) {
        Migrations._migrateMonsterStamina(actorData, updateData);
        Migrations._migrateMonsterActionsPerRound(actorData, updateData);
        Migrations._migrateMonsterNotesAndDescription(actorData, updateData);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the stamina for a Monster.
     *
     * @param {data.ActorData} actorData The data corresponding to a Monster
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateMonsterStamina(actorData, updateData) {
        if (actorData.data.stamina !== undefined) {
            // Convert the old values.
            updateData["data.resources.stamina.value"] = actorData.data.stamina.value;
            updateData["data.resources.stamina.max"] = actorData.data.stamina.max;

            // Delete the old values.
            updateData["data.-=stamina"] = null;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the actions per round for a Monster.
     *
     * @param {data.ActorData} actorData The data corresponding to a Monster
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateMonsterActionsPerRound(actorData, updateData) {
        if (actorData.data.actionsPerRound !== undefined) {
            // Convert the old value.
            updateData["data.resources.actionsPerRound.value"] = actorData.data.actionsPerRound;
            updateData["data.resources.actionsPerRound.max"] = actorData.data.actionsPerRound;

            // Delete the old value.
            updateData["data.-=actionsPerRound"] = null;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the notes and description for a Monster.
     *
     * @param {data.ActorData} actorData The data corresponding to a Monster
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateMonsterNotesAndDescription(actorData, updateData) {
        if (actorData.data.notes !== undefined) {
            // Convert the old value.
            updateData["data.biography.notes"] = actorData.data.notes;

            // Delete the old value.
            updateData["data.-=notes"] = null;
        }

        if (actorData.data.description !== undefined) {
            // Convert the old value.
            updateData["data.biography.description"] = actorData.data.description;

            // Delete the old value.
            updateData["data.-=biography"] = null;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ActorData for a Vehicle.
     *
     * @param {data.ActorData} actorData The data corresponding to a Monster
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateVehicleData(actorData, updateData) {
        // Migrate description.
        Migrations._migrateVehicleDescription(actorData, updateData);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the description for a Vehicle.
     *
     * @param {data.ActorData} actorData The data corresponding to a Monster
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateVehicleDescription(actorData, updateData) {
        if (actorData.data.description !== undefined) {
            // Convert the old value.
            updateData["data.biography.description"] = actorData.data.description;

            // Delete the old value.
            updateData["data.-=biography"] = null;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ItemData for an Item.
     *
     * This function is currently a no-op since no migrations need to occur for
     * Items.
     *
     * @param {ItemData} itemData The data corresponding to an Item
     * @param {object} updateData The modifications to the ItemData object
     *
     * @private
     */
    static _migrateItemData(itemData, updateData) {
        // Do nothing.
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the Documents within a Pack.
     *
     * @param {Map} pack A map between a Compendium ID and Documents.
     *
     * @private
     */
    static async _migratePackData(pack) {
        if ((pack.metadata.package !== "world")
            || (!["Actor", "Item"].includes(pack.documentName))) {
            return;
        }

        const wasLocked = pack.locked;
        await pack.configure({
            locked: false,
        });

        await pack.migrate();

        const documents = await pack.getDocuments();
        for (let document of documents) {
            let updateData = {};

            switch (pack.documentName) {
                case "Actor":
                    updateData = Migrations._migrateActorData(document.data);
                    await document.update(updateData);
                    break;
                case "Item":
                    updateData = Migrations._migrateItemData(document.data);
                    await document.update(updateData);
                    break;
                default:
                    break;
            }
        }

        await pack.configure({
            locked: wasLocked,
        });
    }
}