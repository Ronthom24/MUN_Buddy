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

module.exports = { slugify, uniqueSlug };
