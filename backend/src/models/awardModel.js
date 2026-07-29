const pool = require("../config/database");

async function create({ conferenceId, delegateId, committeeId, portfolioId, category, citation, assignedByAccessId }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO awards (conference_id, delegate_id, committee_id, portfolio_id, category, citation, assigned_by_organizer_access_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [conferenceId, delegateId, committeeId || null, portfolioId || null, category, citation || null, assignedByAccessId || null]
    );
    return findById(rows[0].id, db);
}

async function findById(id, db = pool) {
    const [rows] = await db.query(
        `SELECT a.*, pr.full_name AS delegate_name, c.name AS committee_name, p.name AS portfolio_name
         FROM awards a
         INNER JOIN delegates d ON d.id = a.delegate_id
         JOIN profiles pr ON pr.id = d.profile_id
         LEFT JOIN committees c ON c.id = a.committee_id
         LEFT JOIN portfolios p ON p.id = a.portfolio_id
         WHERE a.id = $1`,
        [id]
    );
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT a.*, pr.full_name AS delegate_name, c.name AS committee_name, p.name AS portfolio_name
         FROM awards a
         INNER JOIN delegates d ON d.id = a.delegate_id
         JOIN profiles pr ON pr.id = d.profile_id
         LEFT JOIN committees c ON c.id = a.committee_id
         LEFT JOIN portfolios p ON p.id = a.portfolio_id
         WHERE a.conference_id = $1
         ORDER BY a.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function listByDelegate(delegateId, db = pool) {
    const [rows] = await db.query(
        `SELECT a.*, c.name AS committee_name, p.name AS portfolio_name
         FROM awards a
         LEFT JOIN committees c ON c.id = a.committee_id
         LEFT JOIN portfolios p ON p.id = a.portfolio_id
         WHERE a.delegate_id = $1
         ORDER BY a.created_at DESC`,
        [delegateId]
    );
    return rows;
}

const UPDATABLE_FIELDS = { category: "category", citation: "citation", committeeId: "committee_id", portfolioId: "portfolio_id" };

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
    await db.execute(`UPDATE awards SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM awards WHERE id = $1`, [id]);
}

module.exports = { create, findById, listByConference, listByDelegate, update, remove };
