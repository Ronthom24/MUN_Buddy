const pool = require("../config/database");

async function findActiveByConference(conferenceId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM registration_forms WHERE conference_id = ? AND is_active = TRUE ORDER BY created_at DESC LIMIT 1`,
        [conferenceId]
    );
    return rows[0] || null;
}

async function upsert(conferenceId, schema, db = pool) {
    const existing = await findActiveByConference(conferenceId, db);
    if (existing) {
        await db.execute(`UPDATE registration_forms SET schema_json = ? WHERE id = ?`, [
            JSON.stringify(schema), existing.id
        ]);
        return findActiveByConference(conferenceId, db);
    }

    await db.execute(
        `INSERT INTO registration_forms (conference_id, schema_json, is_active) VALUES (?, ?, TRUE)`,
        [conferenceId, JSON.stringify(schema)]
    );
    return findActiveByConference(conferenceId, db);
}

async function saveResponse(delegateId, formId, responses, db = pool) {
    await db.execute(
        `INSERT INTO delegate_registration_responses (delegate_id, form_id, responses_json)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE responses_json = VALUES(responses_json)`,
        [delegateId, formId, JSON.stringify(responses)]
    );
}

async function getResponseForDelegate(delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM delegate_registration_responses WHERE delegate_id = ?`,
        [delegateId]
    );
    return rows[0] || null;
}

module.exports = { findActiveByConference, upsert, saveResponse, getResponseForDelegate };
