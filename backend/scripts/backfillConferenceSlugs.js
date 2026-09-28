/**
 * One-off backfill: conferences.slug has been NULL for every conference
 * that's ever existed in this app -- nothing in conferenceModel.create()
 * or the Settings UI ever wrote to it, so the public Discover page's
 * `/discover/${conference.slug}` link has always rendered `/discover/null`.
 * Fixed going forward in authService.js (both conference-creation paths
 * now generate one via uniqueConferenceSlug); this backfills every
 * existing conference that's missing one.
 *
 * Not wired into package.json -- run directly with:
 *   node scripts/backfillConferenceSlugs.js
 */
require("dotenv").config();
const pool = require("../src/config/database");
const { uniqueConferenceSlug } = require("../src/utils/slug");

async function run() {
    const [rows] = await pool.query(`SELECT id, name FROM conferences WHERE slug IS NULL`);
    console.log(`${rows.length} conference(s) missing a slug.`);

    for (const conf of rows) {
        const slug = await uniqueConferenceSlug(pool, conf.name);
        await pool.execute(`UPDATE conferences SET slug = $1 WHERE id = $2`, [slug, conf.id]);
        console.log(`  #${conf.id} "${conf.name}" -> ${slug}`);
    }

    console.log("Done.");
    process.exit(0);
}

run().catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
});
