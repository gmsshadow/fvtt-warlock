export async function migrateWorld() {
    // Notify the user that a migration is occurring.
    ui.notifications.info(`Migrating your world for version ${game.system.data.version} — Please do not close your game or shut down your server.`, {
        permanent: true,
    });

    // Migrate actors.
    for (let actor of game.actors) {
        const updateData = _migrateActorData(actor.data);
        await actor.update(updateData);
    }

    // Migrate items.
    for (let item of game.items) {
        const updateData = _migrateItemData(item.data);
        await item.update(updateData);
    }

    // Set the migration version for future sessions.
    game.settings.set("warlock", "systemMigrationVersion", game.system.data.version);

    // Notify the user that migration was successful.
    ui.notifications.info(`Successfully migrated your world for version ${game.system.data.version}!`, {
        permanent: true,
    });
}

function _migrateActorData(actorData) {
    const updateData = {};

    if (actorData.type === "Character") {
        _migrateCharacterData(actorData, updateData);
    } else if (actorData.type === "Monster") {
        _migrateMonsterData(actorData, updateData);
    } else if (actorData.type === "Vehicle") {
        _migrateVehicleData(actorData, updateData);
    }

    return updateData;
}

function _migrateCharacterData(actorData, updateData) {
    // Do nothing.
}

function _migrateMonsterData(actorData, updateData) {
    // Migrate stamina.
    _migrateMonsterStamina(actorData, updateData);

    // Migrate actions per round.
    _migrateMonsterActionsPerRound(actorData, updateData);

    // Migrate notes and description.
    _migrateMonsterNotesAndDescription(actorData, updateData);
}

function _migrateMonsterStamina(actorData, updateData) {
    if (actorData.data.stamina !== undefined) {
        // Convert the old values.
        updateData["data.resources.stamina.value"] = actorData.data.stamina.value;
        updateData["data.resources.stamina.max"] = actorData.data.stamina.max;

        // Delete the old values.
        updateData["data.-=stamina"] = null;
    }
}

function _migrateMonsterActionsPerRound(actorData, updateData) {
    if (actorData.data.actionsPerRound !== undefined) {
        // Convert the old value.
        updateData["data.resources.actionsPerRound.value"] = actorData.data.actionsPerRound;
        updateData["data.resources.actionsPerRound.max"] = actorData.data.actionsPerRound;

        // Delete the old value.
        updateData["data.-=actionsPerRound"] = null;
    }
}

function _migrateMonsterNotesAndDescription(actorData, updateData) {
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

function _migrateVehicleData(actorData, updateData) {
    // Migrate description.
    _migrateVehicleDescription(actorData, updateData);
}

function _migrateVehicleDescription(actorData, updateData) {
    if (actorData.data.description !== undefined) {
        // Convert the old value.
        updateData["data.biography.description"] = actorData.data.description;

        // Delete the old value.
        updateData["data.-=biography"] = null;
    }
}

function _migrateItemData(itemData, updateData) {
    // Do nothing.
}