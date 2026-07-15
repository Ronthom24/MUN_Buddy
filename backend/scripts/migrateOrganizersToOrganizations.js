const path = require("path");
const mysql = require("mysql2/promise");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function slugify(name) {
    return String(name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 70) || "organization";
}

async function uniqueSlug(connection, baseName) {
    const base = slugify(baseName);
    let candidate = base;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const [rows] = await connection.execute(`SELECT id FROM organizations WHERE slug = ?`, [candidate]);
        if (rows.length === 0) return candidate;
        suffix += 1;
        candidate = `${base}-${suffix}`;
    }
}

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const [conferences] = await connection.execute(
        `SELECT id, organizer_id, name FROM conferences WHERE organization_id IS NULL ORDER BY id ASC`
    );

    if (conferences.length === 0) {
        console.log("No conferences need backfilling. Nothing to do.");
        await connection.end();
        return;
    }

    const organizationIdByOrganizerId = new Map();
    let created = 0;
    let linked = 0;

    for (const conference of conferences) {
        let organizationId = organizationIdByOrganizerId.get(conference.organizer_id);

        if (!organizationId) {
            const [[organizer]] = await connection.execute(
                `SELECT id, full_name, email FROM organizers WHERE id = ?`,
                [conference.organizer_id]
            );

            const orgName = organizer ? `${organizer.full_name}'s Organization` : `Organization for ${conference.name}`;
            const slug = await uniqueSlug(connection, orgName);

            const [orgResult] = await connection.execute(
                `INSERT INTO organizations (name, slug, contact_email, status) VALUES (?, ?, ?, 'active')`,
                [orgName, slug, organizer ? organizer.email : null]
            );
            organizationId = orgResult.insertId;

            if (organizer) {
                await connection.execute(
                    `INSERT IGNORE INTO organization_members (organization_id, email, full_name, org_role, status)
                     VALUES (?, ?, ?, 'owner', 'active')`,
                    [organizationId, organizer.email, organizer.full_name]
                );
            }

            organizationIdByOrganizerId.set(conference.organizer_id, organizationId);
            created += 1;
        }

        await connection.execute(`UPDATE conferences SET organization_id = ? WHERE id = ?`, [organizationId, conference.id]);
        linked += 1;
    }

    console.log(`Backfill complete: created ${created} organization(s), linked ${linked} conference(s).`);
    await connection.end();
}

run().catch((err) => {
    console.error("Backfill failed:", err.message);
    process.exit(1);
});
