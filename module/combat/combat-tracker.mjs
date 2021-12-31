import * as Roll from "../roll.mjs";

export default class WarlockCombatTracker extends CombatTracker {
    get template() {
        return "systems/warlock/templates/sidebar/combat-tracker.hbs";
    }

    /**
     * @override
     * @inheritdoc
     */
    activateListeners(html) {
        super.activateListeners(html);

        html.find(".combatant").click(this._onCombatantSelect.bind(this));
        html.find(".modify-actions-per-round").click(this._onIncrementActionsPerRound.bind(this));
        html.find(".modify-actions-per-round").contextmenu(this._onDecrementActionsPerRound.bind(this));
        html.find(".roll-initiative").click(this._onRollInitiative.bind(this));
    }

    /**
     * @override
     * @inheritdoc
     */
    async getData(options) {
        // Get the combat encounters possible for the viewed Scene
        const combat = this.viewed;
        const hasCombat = combat !== null;
        const combats = this.combats;
        const currentIdx = combats.findIndex(c => c === combat);
        const previousId = currentIdx > 0 ? combats[currentIdx-1].id : null;
        const nextId = currentIdx < combats.length - 1 ? combats[currentIdx+1].id : null;
        const settings = game.settings.get("core", Combat.CONFIG_SETTING);

        // Prepare rendering data
        const data = {
            user: game.user,
            combats: combats,
            currentIndex: currentIdx + 1,
            combatCount: combats.length,
            hasCombat: hasCombat,
            combat,
            turns: [],
            previousId,
            nextId,
            started: this.started,
            control: false,
            settings,
            linked: combat?.data.scene !== null,
            labels: {}
        };
        data.labels.scope = game.i18n.localize(`COMBAT.${data.linked ? "Linked" : "Unlinked"}`);
        if ( !hasCombat ) return data;

        // Format information about each combatant in the encounter
        let hasDecimals = false;
        const turns = [];
        for ( let [i, combatant] of combat.turns.entries() ) {
        if ( !combatant.visible ) continue;

        // Prepare turn data
        const resource = combatant.permission >= CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER ? combatant.resource : null
        const turn = {
            id: combatant.id,
            name: combatant.name,
            img: combatant.img,
            active: combatant === this.currentlySelectedCombatant,
            owner: combatant.isOwner,
            defeated: combatant.data.defeated,
            hidden: combatant.hidden,
            initiative: combatant.initiative,
            hasRolled: combatant.initiative !== null,
            hasResource: resource !== null,
            resource: resource
        };
        if ( Number.isFinite(turn.initiative) && !Number.isInteger(turn.initiative) ) hasDecimals = true;
        turn.css = [
            turn.active ? "active" : "",
            turn.hidden ? "hidden" : "",
            turn.defeated ? "defeated" : ""
        ].join(" ").trim();

        // Cached thumbnail image for video tokens
        if ( VideoHelper.hasVideoExtension(turn.img) ) {
            if ( combatant._thumb ) turn.img = combatant._thumb;
            else turn.img = combatant._thumb = await game.video.createThumbnail(combatant.img, {width: 100, height: 100});
        }

        // Actor and Token status effects
        turn.effects = new Set();
        if ( combatant.token ) {
            combatant.token.data.effects.forEach(e => turn.effects.add(e));
            if ( combatant.token.data.overlayEffect ) turn.effects.add(combatant.token.data.overlayEffect);
        }
        if ( combatant.actor ) combatant.actor.temporaryEffects.forEach(e => {
            if ( e.getFlag("core", "statusId") === CONFIG.Combat.defeatedStatusId ) turn.defeated = true;
            else if ( e.data.icon ) turn.effects.add(e.data.icon);
        });
        turns.push(turn);
        }

        // Format initiative numeric precision
        const precision = CONFIG.Combat.initiative.decimals;
        turns.forEach(t => {
        if ( t.initiative !== null ) t.initiative = t.initiative.toFixed(hasDecimals ? precision : 0);
        });

        // Merge update data for rendering
        return foundry.utils.mergeObject(data, {
            round: combat.data.round,
            turn: combat.data.turn,
            turns: turns,
            control: combat.combatant?.players?.includes(game.user)
        });
    }

    /**
     * @override
     */
    _getEntryContextOptions() {
        return [
            {
                name: "COMBAT.CombatantUpdate",
                icon: '<i class="fas fa-edit"></i>',
                callback: this._onConfigureCombatant.bind(this)
            },
            {
                name: "COMBAT.CombatantClear",
                icon: '<i class="fas fa-undo"></i>',
                condition: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                return combatant?.data?.initiative ?? false;
                },
                callback: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                if ( combatant ) return combatant.update({initiative: null});
                }
            },
            {
                name: "COMBAT.CombatantRemove",
                icon: '<i class="fas fa-trash"></i>',
                callback: li => {
                const combatant = this.viewed.combatants.get(li.data("combatant-id"));
                if ( combatant ) return combatant.delete();
                }
            },
        ];
    }

    _onCombatantSelect(event) {
        event.preventDefault();

        // Deselect previous combatant.
        $(".combatant").removeClass("active");

        // Select current combatant.
        $(event.currentTarget).addClass("active");

        // Store the currently selected combatant so that it can be re-selected
        // when the combat tracker is re-rendered.
        const element = event.currentTarget.closest(".combatant");
        this.currentlySelectedCombatant = this.viewed.combatants.get(element.dataset.combatantId);
    }

    async _onIncrementActionsPerRound(event) {
        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget.closest(".combatant");
        const combatant = this.viewed.combatants.get(element.dataset.combatantId);
        const actionsPerRound = combatant.actor.data.data.resources.actionsPerRound;

        if (actionsPerRound.value === actionsPerRound.max) {
            return;
        }

        await combatant.actor.update({
            data: {
                resources: {
                    actionsPerRound: {
                        value: actionsPerRound.value + 1,
                    },
                },
            },
        });
    }

    async _onDecrementActionsPerRound(event) {
        event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget.closest(".combatant");
        const combatant = this.viewed.combatants.get(element.dataset.combatantId);
        const actionsPerRound = combatant.actor.data.data.resources.actionsPerRound;

        if (actionsPerRound.value < 1) {
            return;
        }

        await combatant.actor.update({
            data: {
                resources: {
                    actionsPerRound: {
                        value: actionsPerRound.value - 1,
                    },
                },
            },
        });
    }

    async _onRollInitiative(event) {
        event.preventDefault();

        await Roll.rollInitiative();
    }
}