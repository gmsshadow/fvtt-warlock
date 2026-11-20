/**
 * Helpers for the predefined adventuring skill lists of each subsystem
 * (Warlock!, Warpstar!, Wetwired). The lists themselves are built in the
 * i18nInit hook as game.warlock.skills[subsystem].
 */

/** The level every character skill starts at. */
export const DEFAULT_CHARACTER_SKILL_LEVEL = 4;

/** The default entry for a skill on a career. */
export const DEFAULT_CAREER_SKILL = Object.freeze({
    isCareerSkill: false,
    maximumLevel: 0,
});

/**
 * Returns the skill keys of the active subsystem.
 *
 * @returns {string[]}
 */
export function activeSkillKeys() {
    const activeSystem = game.settings.get("warlock", "activeSystem");
    return Object.keys(game.warlock?.skills?.[activeSystem] ?? {});
}

/**
 * Builds the full, localized-name-sorted skill list of the active subsystem,
 * taking stored values where they exist and defaults where they don't.
 *
 * @param {object} stored The stored adventuringSkills object (may be missing)
 * @param {Function} makeDefault Returns the default value for a missing skill
 * @returns {object}
 */
export function completeSkillList(stored, makeDefault) {
    const activeSystem = game.settings.get("warlock", "activeSystem");
    const names = game.warlock?.skills?.[activeSystem] ?? {};
    const source = (stored && (typeof stored === "object")) ? stored : {};

    return Object.fromEntries(
        Object.keys(names)
            .sort((a, b) => (names[a] ?? a).localeCompare(names[b] ?? b))
            .map((skill) => [skill, source[skill] ?? makeDefault()]),
    );
}

/**
 * Returns the skills of the active subsystem that a stored skill object lacks,
 * mapped to their default values. Empty when nothing is missing.
 *
 * @param {object} stored The stored adventuringSkills object (may be missing)
 * @param {Function} makeDefault Returns the default value for a missing skill
 * @returns {object}
 */
export function missingSkills(stored, makeDefault) {
    const source = (stored && (typeof stored === "object")) ? stored : {};
    const missing = {};
    for (const skill of activeSkillKeys()) {
        if (source[skill] === undefined) missing[skill] = makeDefault();
    }
    return missing;
}

/**
 * Writes any missing active-subsystem skills into world Characters, their
 * embedded Careers, and world Career items. Existing values and skills from
 * other subsystems are left untouched. GM only.
 */
export async function ensureSkills() {
    if (!game.user.isGM) return;

    const characterDefault = () => DEFAULT_CHARACTER_SKILL_LEVEL;
    const careerDefault = () => ({ ...DEFAULT_CAREER_SKILL });

    let updatedActors = 0;
    let updatedCareers = 0;

    for (const actor of game.actors) {
        if (actor.type !== "Character") continue;

        const missing = missingSkills(actor.system.adventuringSkills, characterDefault);
        if (Object.keys(missing).length) {
            await actor.update({ system: { adventuringSkills: missing } });
            updatedActors++;
        }

        const careerUpdates = actor.itemTypes["Career"]
            .map((career) => ({
                _id: career.id,
                missing: missingSkills(career.system.adventuringSkills, careerDefault),
            }))
            .filter(({ missing }) => Object.keys(missing).length)
            .map(({ _id, missing }) => ({ _id, system: { adventuringSkills: missing } }));
        if (careerUpdates.length) {
            await actor.updateEmbeddedDocuments("Item", careerUpdates);
            updatedCareers += careerUpdates.length;
        }
    }

    for (const item of game.items) {
        if (item.type !== "Career") continue;
        const missing = missingSkills(item.system.adventuringSkills, careerDefault);
        if (Object.keys(missing).length) {
            await item.update({ system: { adventuringSkills: missing } });
            updatedCareers++;
        }
    }

    if (updatedActors || updatedCareers) {
        console.log(`Warlock | Added missing skills to ${updatedActors} character(s) and ${updatedCareers} career(s).`);
    }
}
