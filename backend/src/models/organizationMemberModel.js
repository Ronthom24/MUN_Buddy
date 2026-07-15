const pool = require("../config/database");

async function create({ organizationId, email, fullName, orgRole, status, invitedBy }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO organization_members (organization_id, email, full_name, org_role, status, invited_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [organizationId, email, fullName || null, orgRole || "member", status || "active", invitedBy || null]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organization_members WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function findByOrganizationAndEmail(organizationId, email, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organization_members WHERE organization_id = ? AND email = ?`,
        [organizationId, email]
    );
    return rows[0] || null;
}

async function listByOrganization(organizationId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organization_members WHERE organization_id = ? ORDER BY created_at ASC`,
        [organizationId]
    );
    return rows;
}

async function update(id, { orgRole, status }, db = pool) {
    const setClauses = [];
    const params = [];

    if (orgRole !== undefined) {
        setClauses.push("org_role = ?");
        params.push(orgRole);
    }
    if (status !== undefined) {
        setClauses.push("status = ?");
        params.push(status);
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE organization_members SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM organization_members WHERE id = ?`, [id]);
}

module.exports = {
    create, findById, findByOrganizationAndEmail, listByOrganization, update, remove
};
