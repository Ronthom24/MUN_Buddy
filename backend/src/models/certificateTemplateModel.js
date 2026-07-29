const pool = require("../config/database");

async function create(
    { organizationId, name, certificateType, title, bodyText, signatoryName, signatoryTitle, accentColor },
    db = pool
) {
    const [rows] = await db.execute(
        `INSERT INTO certificate_templates
            (organization_id, name, certificate_type, title, body_text, signatory_name, signatory_title, accent_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
            organizationId, name, certificateType || "participation", title || "Certificate of Participation",
            bodyText, signatoryName || null, signatoryTitle || null, accentColor || "#1f2937"
        ]
    );
    return findById(rows[0].id, db);
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM certificate_templates WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function listByOrganization(organizationId, { includeArchived = false } = {}, db = pool) {
    const clause = includeArchived ? "" : "AND status = 'active'";
    const [rows] = await db.execute(
        `SELECT * FROM certificate_templates WHERE organization_id = $1 ${clause} ORDER BY created_at DESC`,
        [organizationId]
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    name: "name", certificateType: "certificate_type", title: "title", bodyText: "body_text",
    signatoryName: "signatory_name", signatoryTitle: "signatory_title", accentColor: "accent_color",
    logoPath: "logo_path"
};

async function update(id, data, db = pool) {
    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            params.push(data[key]);
            setClauses.push(`${column} = $${params.length}`);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE certificate_templates SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function archive(id, db = pool) {
    await db.execute(`UPDATE certificate_templates SET status = 'archived' WHERE id = $1`, [id]);
    return findById(id, db);
}

module.exports = { create, findById, listByOrganization, update, archive };
