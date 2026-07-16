const pool = require("../config/database");

async function create({ organizationId, name, subject, body }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO email_templates (organization_id, name, subject, body) VALUES (?, ?, ?, ?)`,
        [organizationId, name, subject, body]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM email_templates WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByOrganization(organizationId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM email_templates WHERE organization_id = ? ORDER BY created_at DESC`,
        [organizationId]
    );
    return rows;
}

async function update(id, { name, subject, body }, db = pool) {
    const setClauses = [];
    const params = [];
    if (name !== undefined) { setClauses.push("name = ?"); params.push(name); }
    if (subject !== undefined) { setClauses.push("subject = ?"); params.push(subject); }
    if (body !== undefined) { setClauses.push("body = ?"); params.push(body); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE email_templates SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM email_templates WHERE id = ?`, [id]);
}

module.exports = { create, findById, listByOrganization, update, remove };
