const pool = require("../config/database");

async function create(
    { conferenceId, actorType, actorEmail, actorName, action, resourceType, resourceId, previousValue, newValue },
    db = pool
) {
    await db.execute(
        `INSERT INTO audit_logs
            (conference_id, actor_type, actor_email, actor_name, action, resource_type, resource_id, previous_value, new_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
            conferenceId || null, actorType || "organizer", actorEmail || null, actorName || null,
            action, resourceType, resourceId || null,
            previousValue !== undefined ? JSON.stringify(previousValue) : null,
            newValue !== undefined ? JSON.stringify(newValue) : null
        ]
    );
}

async function listByConference(conferenceId, { limit = 100 } = {}, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM audit_logs WHERE conference_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [conferenceId, limit]
    );
    return rows;
}

module.exports = { create, listByConference };
