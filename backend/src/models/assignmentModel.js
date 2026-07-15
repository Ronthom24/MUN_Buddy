const pool = require("../config/database");

async function findByDelegateId(delegateId, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM assignments WHERE delegate_id = ?`, [delegateId]);
    return rows[0] || null;
}

async function ensureRow(delegateId, db = pool) {
    const existing = await findByDelegateId(delegateId, db);
    if (existing) return existing;

    await db.execute(`INSERT INTO assignments (delegate_id) VALUES (?)`, [delegateId]);
    return findByDelegateId(delegateId, db);
}

async function assign(delegateId, { committeeId, portfolioId }, db = pool) {
    await ensureRow(delegateId, db);

    const setClauses = [];
    const params = [];

    if (committeeId !== undefined) {
        setClauses.push("committee_id = ?");
        params.push(committeeId);
    }
    if (portfolioId !== undefined) {
        setClauses.push("portfolio_id = ?");
        params.push(portfolioId);
    }
    setClauses.push("status = 'assigned'");

    params.push(delegateId);
    await db.execute(`UPDATE assignments SET ${setClauses.join(", ")} WHERE delegate_id = ?`, params);
    return findByDelegateId(delegateId, db);
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT a.*, d.full_name AS delegate_name, d.school AS delegate_school,
                c.name AS committee_name, p.name AS portfolio_name
         FROM delegates d
         LEFT JOIN assignments a ON a.delegate_id = d.id
         LEFT JOIN committees c ON c.id = a.committee_id
         LEFT JOIN portfolios p ON p.id = a.portfolio_id
         WHERE d.conference_id = ?
         ORDER BY d.full_name ASC`,
        [conferenceId]
    );
    return rows;
}

async function publishAll(conferenceId, db = pool) {
    await db.query(
        `UPDATE assignments a
         INNER JOIN delegates d ON d.id = a.delegate_id
         SET a.published = 1
         WHERE d.conference_id = ? AND a.status = 'assigned'`,
        [conferenceId]
    );
}

async function findPublishedByDelegateId(delegateId, db = pool) {
    const [rows] = await db.query(
        `SELECT a.*, c.name AS committee_name, p.name AS portfolio_name, p.type AS portfolio_type
         FROM assignments a
         LEFT JOIN committees c ON c.id = a.committee_id
         LEFT JOIN portfolios p ON p.id = a.portfolio_id
         WHERE a.delegate_id = ?`,
        [delegateId]
    );
    return rows[0] || null;
}

module.exports = { findByDelegateId, ensureRow, assign, listByConference, publishAll, findPublishedByDelegateId };
