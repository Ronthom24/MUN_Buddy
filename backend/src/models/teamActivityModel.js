const pool = require("../config/database");

async function create({ conferenceId, actorEmail, actorName, action }, db = pool) {
    await db.execute(
        `INSERT INTO team_activity (conference_id, actor_email, actor_name, action) VALUES ($1, $2, $3, $4)`,
        [conferenceId, actorEmail, actorName || null, action]
    );
}

async function listByConference(conferenceId, limit = 50, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM team_activity WHERE conference_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [conferenceId, limit]
    );
    return rows;
}

module.exports = { create, listByConference };
