/**
 * Handles the migrations from the various system versions.
 */
export class Migrations {
    /**
     * Migrate the world which includes actors, items, scenes, compendia, etc.
     */
    static async migrateWorld()
    {
        ui.notifications.info(
            game.i18n.format("WARLOCK.Notifications.MigratingWorld", {
                version: game.system.version,
            }),
            {
                permanent: true,
            });

        // Migrate actors.
        for (const actor of game.actors)
        {
            const actorUpdateData = Migrations._migrateActorData(actor.system);
            await actor.update(actorUpdateData);

            // Migrate the actor's items.
            for (const item of actor.items)
            {
                const itemUpdateData = Migrations._migrateItemData(item.system);
                await item.update(itemUpdateData);
            }
        }

        // Migrate items.
        for (const item of game.items)
        {
            const updateData = Migrations._migrateItemData(item.system);
            await item.update(updateData);
        }

        // Migrate packs.
        for (const pack of game.packs)
        {
            await Migrations._migratePackData(pack);
        }

        // Set the migration version for future sessions.
        game.settings.set("warlock", "systemMigrationVersion", game.system.version);

        ui.notifications.info(
            game.i18n.format("WARLOCK.Notifications.MigratingWorldSuccess", {
                version: game.system.version,
            }),
            {
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
    static _migrateActorData(actorData)
    {
        const updateData = {};

        switch (actorData.type)
        {
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
                break;
        }

        return updateData;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ActorData for a Character.
     *
     * @param {data.ActorData} actorData The data corresponding to a Character
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateCharacterData(actorData, updateData)
    {
        Migrations._migrateCharacterSkills(actorData, updateData);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the skills for a Character.
     *
     * @param {data.ActorData} actorData The data corresponding to a Monster
     * @param {object} updateData The modifications to the ActorData object
     *
     * @private
     */
    static _migrateCharacterSkills(actorData, updateData)
    {
        if (actorData.adventuringSkills.warlock !== undefined
            && actorData.adventuringSkills.warpstar !== undefined)
        {
            const activeSystem = game.settings.get("warlock", "activeSystem");

            const skills = {};
            for (const skill of Object.keys(game.warlock.skills[activeSystem]))
            {
                skills[skill] = actorData.adventuringSkills[activeSystem][skill];
            }

            updateData["system.adventuringSkills"] = skills;
            updateData["system.adventuringSkills.-=warlock"] = null;
            updateData["system.adventuringSkills.-=warpstar"] = null;
        }
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
    static _migrateMonsterData(actorData, updateData)
    {
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
        if (actorData.stamina !== undefined)
        {
            // Convert the old values.
            updateData["system.resources.stamina.value"] = actorData.stamina.value;
            updateData["system.resources.stamina.max"] = actorData.stamina.max;

            // Delete the old values.
            updateData["system.-=stamina"] = null;
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
        if (actorData.actionsPerRound !== undefined)
        {
            // Convert the old value.
            updateData["system.resources.actionsPerRound.value"] = actorData.actionsPerRound;
            updateData["system.resources.actionsPerRound.max"] = actorData.actionsPerRound;

            // Delete the old value.
            updateData["system.-=actionsPerRound"] = null;
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
        if (actorData.notes !== undefined)
        {
            // Delete the old value.
            updateData["system.-=notes"] = null;
        }

        if (actorData.biography.notes !== undefined)
        {
            // Delete the old value.
            updateData["system.biography.-=notes"] = null;
        }

        if (actorData.description !== undefined)
        {
            // Convert the old value.
            updateData["system.biography.description"] = actorData.description;

            // Delete the old value.
            updateData["system.-=description"] = null;
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
    static _migrateVehicleData(actorData, updateData)
    {
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
    static _migrateVehicleDescription(actorData, updateData)
    {
        if (actorData.description !== undefined)
        {
            // Convert the old value.
            updateData["system.biography.description"] = actorData.description;

            // Delete the old value.
            updateData["system.-=description"] = null;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ItemData for an Item.
     *
     * @param {ItemData} itemData The data corresponding to an Item
     * @returns {object} The modifications to the ItemData object
     *
     * @private
     */
    static _migrateItemData(itemData)
    {
        const updateData = {};

        switch (itemData.type)
        {
            case "Career":
                Migrations._migrateCareerData(itemData, updateData);
                break;
            case "Weapon":
                Migrations._migrateWeaponData(itemData, updateData);
                break;
            default:
                break;
        }

        return updateData;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ItemData for a Career.
     *
     * @param {data.ItemData} itemData The data corresponding to an Item
     * @param {object} updateData The modifications to the ItemData object
     *
     * @private
     */
     static _migrateCareerData(itemData, updateData)
     {
        Migrations._migrateCareerSkills(itemData, updateData);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the skills for a Career.
     *
     * @param {data.ItemData} itemData The data corresponding to an Item
     * @param {object} updateData The modifications to the ItemData object
     *
     * @private
     */
     static _migrateCareerSkills(itemData, updateData)
     {
        if (itemData.adventuringSkills.warlock
            && itemData.adventuringSkills.warpstar)
        {
            const activeSystem = game.settings.get("warlock", "activeSystem");

            const skills = {};
            for (const skill of Object.keys(game.warlock.skills[activeSystem]))
            {
                skills[skill] = {
                    isCareerSkill: itemData.adventuringSkills[activeSystem][skill].isCareerSkill,
                    maximumLevel: itemData.adventuringSkills[activeSystem][skill].maximumLevel,
                };
            }

            updateData["system.adventuringSkills"] = skills;
            updateData["system.adventuringSkills.-=warlock"] = null;
            updateData["system.adventuringSkills.-=warpstar"] = null;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the ItemData for a Weapon.
     *
     * @param {data.ItemData} itemData The data corresponding to an Item
     * @param {object} updateData The modifications to the ItemData object
     *
     * @private
     */
    static _migrateWeaponData(itemData, updateData)
    {
        Migrations._migrateWeaponType(itemData, updateData);
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the type for a Weapon.
     *
     * @param {data.ItemData} itemData The data corresponding to an Item
     * @param {object} updateData The modifications to the ItemData object
     *
     * @private
     */
    static _migrateWeaponType(itemData, updateData)
    {
        // Convert "Heavy" to "Large".
        if (itemData.type?.value === "Heavy")
        {
            updateData["system.type.value"] = "Large";
        }

        // Remove "Heavy" from the choices.
        if (itemData.type?.choices?.warpstar?.["Heavy"] !== undefined)
        {
            updateData["system.type.choices.warpstar.-=Heavy"] = null;
        }
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Migrates the Documents within a Pack.
     *
     * @param {Map} pack A map between a Compendium ID and Documents.
     *
     * @private
     */
    static async _migratePackData(pack)
    {
        if ((pack.metadata.system !== "warlock")
            || (!["Actor", "Item"].includes(pack.documentName)))
        {
            return;
        }

        const wasLocked = pack.locked;
        await pack.configure({
            locked: false,
        });

        await pack.migrate();

        const documents = await pack.getDocuments();
        for (const document of documents) {
            let updateData = {};

            switch (pack.documentName)
            {
                case "Actor":
                    updateData = Migrations._migrateActorData(document.system);
                    await document.update(updateData);

                    // Migrate the actor's items.
                    for (const item of document.items)
                    {
                        updateData = Migrations._migrateItemData(item.system);
                        await item.update(updateData);
                    }

                    break;
                case "Item":
                    updateData = Migrations._migrateItemData(document.system);
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
