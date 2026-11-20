import { WarlockItemSheet } from "./warlock-item-sheet.mjs";

/**
 * The custom WarlockCareerSheet that extends the custom WarlockItemSheet.
 *
 * @extends WarlockItemSheet
 */
export class WarlockCareerSheet extends WarlockItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        position: {
            width: 600,
            height: 615,
        },
        actions: {
            toggleCareerSkill: WarlockCareerSheet._onToggleCareerSkill,
        },
    };

    /** @override */
    static PARTS = {
        sheet: {
            template: "systems/warlock/templates/items/career-sheet.hbs",
        },
    };

    /** @override */
    static TABS = {
        primary: {
            skills: { id: "skills", group: "primary", label: "WARLOCK.Tabs.Skills" },
            description: { id: "description", group: "primary", label: "WARLOCK.Tabs.Description" },
        },
    };

    /** @override */
    tabGroups = {
        primary: "skills",
    };

    /* ---------------------------------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);

        // Bind change listener for career skill level editing.
        const skillLevelInputs = this.element.querySelectorAll(".edit-career-skill-level");
        for (const input of skillLevelInputs) {
            input.addEventListener("change", this._onEditCareerSkillLevel.bind(this));

            // Save the last focused skill level input element for refocus.
            input.addEventListener("focusin", (event) => {
                this.saveFocus = event.currentTarget.dataset.skill;
            });
        }

        // Refocus the last selected career skill level input field when the
        // sheet is rendered. This situation occurs if an input is focused,
        // changed, and another input field is focused. The sheet renders at
        // least twice, once for the character data update and one or more times
        // for the career skill level update(s). The renders after the first
        // cause the latter-focused input field to blur which makes it very
        // annoying to modify multiple skill levels at once.
        if (this.saveFocus) {
            const element = this.element.querySelector(`input[data-career-skill="${this.saveFocus}"]`);
            if (element) {
                element.focus();
            }
        }
    }

    /* ---------------------------------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        // Sort skills by their localized names.
        const activeSystem = game.settings.get("warlock", "activeSystem");
        const localizedSkills = game.warlock.skills[activeSystem];
        context.data.system.adventuringSkills = Object.fromEntries(
            Object
                .entries(context.data.system.adventuringSkills)
                .sort(([a,], [b,]) => {
                    return localizedSkills[a].localeCompare(localizedSkills[b]);
                })
        );

        context.tabs = this._getTabs();

        return context;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Build tab metadata for the template.
     * @returns {Object}
     */
    _getTabs() {
        const tabs = {};
        for (const [groupId, groupTabs] of Object.entries(this.constructor.TABS)) {
            for (const [tabId, tabConfig] of Object.entries(groupTabs)) {
                tabs[tabId] = {
                    ...tabConfig,
                    active: this.tabGroups[groupId] === tabId,
                    cssClass: this.tabGroups[groupId] === tabId ? "active" : "",
                };
            }
        }
        return tabs;
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Handles editing a career skill level.
     *
     * @param {Event} event The change event
     * @private
     */
    async _onEditCareerSkillLevel(event) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const skill = event.currentTarget.closest(".table__entry").dataset.skill;
        const level = parseInt(event.currentTarget.value, 10);

        await this.item.update({
            system: {
                adventuringSkills: {
                    [skill]: {
                        maximumLevel: level,
                    },
                },
            },
        });
    }

    /* ---------------------------------------------------------------------- */

    /**
     * Toggles a career skill.
     *
     * @param {Event} event The click event
     * @param {HTMLElement} target The element with data-action
     */
    static async _onToggleCareerSkill(event, target) {
        event.preventDefault();

        if (!this.isEditable) {
            return;
        }

        const skill = target.closest(".table__entry").dataset.skill;
        const isCareerSkill = this.item.system.adventuringSkills[skill].isCareerSkill;

        await this.item.update({
            system: {
                adventuringSkills: {
                    [skill]: {
                        isCareerSkill: !isCareerSkill,
                    },
                },
            },
        });

        await this.item.updateCareerSkillLevel();
    }
}
