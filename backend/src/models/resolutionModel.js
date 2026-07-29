const pool = require("../config/database");

async function create({ conferenceId, committeeId, agendaId, delegateId, title, body }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO resolutions (conference_id, committee_id, agenda_id, delegate_id, title, body)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [conferenceId, committeeId, agendaId || null, delegateId, title, body]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM resolutions WHERE id = $1`, [id]);
    return rows[0] || null;
}

async function listByDelegate(delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM resolutions WHERE delegate_id = $1 ORDER BY created_at DESC`,
        [delegateId]
    );
    return rows;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT r.*, pr.full_name AS delegate_name, c.name AS committee_name
         FROM resolutions r
         INNER JOIN delegates d ON d.id = r.delegate_id
         JOIN profiles pr ON pr.id = d.profile_id
         INNER JOIN committees c ON c.id = r.committee_id
         WHERE r.conference_id = $1
         ORDER BY r.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function updateContent(id, { title, body }, db = pool) {
    const setClauses = [];
    const params = [];

    if (title !== undefined) { params.push(title); setClauses.push(`title = $${params.length}`); }
    if (body !== undefined) { params.push(body); setClauses.push(`body = $${params.length}`); }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE resolutions SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function updateStatus(id, { status, organizerNotes }, db = pool) {
    const params = [status];
    const setClauses = [`status = $${params.length}`];

    if (organizerNotes !== undefined) {
        params.push(organizerNotes);
        setClauses.push(`organizer_notes = $${params.length}`);
    }

    params.push(id);
    await db.execute(`UPDATE resolutions SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM resolutions WHERE id = $1`, [id]);
}

module.exports = { create, findById, listByDelegate, listByConference, updateContent, updateStatus, remove };
