const pool = require("../config/database");

async function create({ conferenceId, committeeId, agendaId, delegateId, title, body }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO resolutions (conference_id, committee_id, agenda_id, delegate_id, title, body)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [conferenceId, committeeId, agendaId || null, delegateId, title, body]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM resolutions WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByDelegate(delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM resolutions WHERE delegate_id = ? ORDER BY created_at DESC`,
        [delegateId]
    );
    return rows;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT r.*, d.full_name AS delegate_name, c.name AS committee_name
         FROM resolutions r
         INNER JOIN delegates d ON d.id = r.delegate_id
         INNER JOIN committees c ON c.id = r.committee_id
         WHERE r.conference_id = ?
         ORDER BY r.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function updateContent(id, { title, body }, db = pool) {
    const setClauses = [];
    const params = [];

    if (title !== undefined) { setClauses.push("title = ?"); params.push(title); }
    if (body !== undefined) { setClauses.push("body = ?"); params.push(body); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE resolutions SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function updateStatus(id, { status, organizerNotes }, db = pool) {
    const setClauses = ["status = ?"];
    const params = [status];

    if (organizerNotes !== undefined) {
        setClauses.push("organizer_notes = ?");
        params.push(organizerNotes);
    }

    params.push(id);
    await db.execute(`UPDATE resolutions SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM resolutions WHERE id = ?`, [id]);
}

module.exports = { create, findById, listByDelegate, listByConference, updateContent, updateStatus, remove };
