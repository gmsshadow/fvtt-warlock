/**
 * Looks up results on the system's compendium roll tables, so the automation
 * shows the book's exact wording from one source.
 */

const tableCache = new Map();

/**
 * Loads a roll table from a compendium by name, caching it for the session.
 *
 * @param {string|null} packId e.g. "warlock.rollable-tables-warpstar"
 * @param {string|null} name The table's name
 * @returns {Promise<RollTable|null>}
 */
export async function getCompendiumTable(packId, name) {
    if (!packId || !name) return null;
    const key = `${packId}|${name}`;
    if (tableCache.has(key)) return tableCache.get(key);

    const pack = game.packs.get(packId);
    if (!pack) return null;
    const index = await pack.getIndex();
    const entry = index.find((e) => e.name === name);
    const table = entry ? await pack.getDocument(entry._id) : null;
    tableCache.set(key, table);
    return table;
}

/**
 * The result a total lands on. Totals beyond the table's lowest or highest
 * result take that result (e.g. a critical of 14 takes the "10+" entry).
 *
 * @param {RollTable} table
 * @param {number} total
 * @returns {{ text: string, total: number }|null} The result's text and the
 *     total after capping
 */
export function tableResultFor(table, total) {
    const results = Array.from(table?.results ?? []);
    if (!results.length) return null;

    const lowest = Math.min(...results.map((r) => r.range[0]));
    const highest = Math.max(...results.map((r) => r.range[1]));
    const capped = Math.min(Math.max(total, lowest), highest);
    const result = results.find((r) => capped >= r.range[0] && capped <= r.range[1]);
    if (!result) return null;

    return {
        text: result.description || result.text || result.name || "",
        total: capped,
    };
}

/**
 * Turns table text into chat HTML, so inline rolls such as [[/roll 1d6]]
 * become clickable.
 *
 * @param {string} text
 * @returns {Promise<string>}
 */
export async function enrichTableText(text) {
    return foundry.applications.ux.TextEditor.enrichHTML(text ?? "");
}
