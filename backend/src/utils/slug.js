function slugify(name) {
    return String(name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 70) || "organization";
}

async function uniqueSlug(db, name) {
    const base = slugify(name);
    let candidate = base;
    let suffix = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const [rows] = await db.execute(`SELECT id FROM organizations WHERE slug = $1`, [candidate]);
        if (rows.length === 0) return candidate;
        suffix += 1;
        candidate = `${base}-${suffix}`;
    }
}

/**
 * conferences.slug is nullable and nothing ever wrote to it -- every
 * conference (this app's registration flow, createConferenceForOrganization,
 * and every seed script) left it NULL, so the public Discover page's
 * `/discover/${conference.slug}` link has been rendering `/discover/null`
 * for every conference that's ever existed. This generates one the same
 * way uniqueSlug does for organizations, scoped against the conferences
 * table instead.
 */
async function uniqueConferenceSlug(db, name) {
    const base = slugify(name);
    let candidate = base;
    let suffix = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const [rows] = await db.execute(`SELECT id FROM conferences WHERE slug = $1`, [candidate]);
        if (rows.length === 0) return candidate;
        suffix += 1;
        candidate = `${base}-${suffix}`;
    }
}

module.exports = { slugify, uniqueSlug, uniqueConferenceSlug };
