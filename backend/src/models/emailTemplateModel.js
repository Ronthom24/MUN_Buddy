const pool = require("../config/database");

async function create({ organizationId, name, subject, body }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO email_templates (organization_id, name, subject, body) VALUES ($1, $2, $3, $4) RETURNING id`,
        [organizationId, name, subject, body]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM email_templates WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function listByOrganization(organizationId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM email_templates WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
    );
    return rows;
}

async function update(id, { name, subject, body }, db = pool) {
    const setClauses = [];
    const params = [];
    let idx = 1;
    if (name !== undefined) { setClauses.push(`name = $${idx++}`); params.push(name); }
    if (subject !== undefined) { setClauses.push(`subject = $${idx++}`); params.push(subject); }
    if (body !== undefined) { setClauses.push(`body = $${idx++}`); params.push(body); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE email_templates SET ${setClauses.join(", ")} WHERE id = $${idx}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM email_templates WHERE id = $1`, [id]);
}

module.exports = { create, findById, listByOrganization, update, remove };
