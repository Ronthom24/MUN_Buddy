const pool = require("../config/database");

async function findTokenByDelegate(delegateId, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM checkin_tokens WHERE delegate_id = ?`, [delegateId]);
    return rows[0] || null;
}

async function findByToken(token, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM checkin_tokens WHERE token = ?`, [token]);
    return rows[0] || null;
}

async function createToken(delegateId, token, db = pool) {
    await db.execute(`INSERT INTO checkin_tokens (delegate_id, token) VALUES (?, ?)`, [delegateId, token]);
    return findTokenByDelegate(delegateId, db);
}

async function findAttendanceRecord(scheduleEventId, delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM attendance_records WHERE schedule_event_id = ? AND delegate_id = ?`,
        [scheduleEventId, delegateId]
    );
    return rows[0] || null;
}

async function checkIn({ scheduleEventId, delegateId, checkedInByAccessId, method }, db = pool) {
    await db.execute(
        `INSERT INTO attendance_records (schedule_event_id, delegate_id, checked_in_by_organizer_access_id, method)
         VALUES (?, ?, ?, ?)`,
        [scheduleEventId, delegateId, checkedInByAccessId || null, method || "manual"]
    );
    return findAttendanceRecord(scheduleEventId, delegateId, db);
}

async function removeCheckIn(scheduleEventId, delegateId, db = pool) {
    await db.execute(`DELETE FROM attendance_records WHERE schedule_event_id = ? AND delegate_id = ?`, [scheduleEventId, delegateId]);
}

async function listForEvent(scheduleEventId, db = pool) {
    const [rows] = await db.execute(
        `SELECT ar.*, d.full_name AS delegate_name, d.email AS delegate_email
         FROM attendance_records ar
         INNER JOIN delegates d ON d.id = ar.delegate_id
         WHERE ar.schedule_event_id = ?
         ORDER BY ar.checked_in_at ASC`,
        [scheduleEventId]
    );
    return rows;
}

async function listForDelegate(delegateId, db = pool) {
    const [rows] = await db.query(
        `SELECT ar.*, se.title AS event_title, se.type AS event_type, se.start_time, se.end_time
         FROM attendance_records ar
         INNER JOIN schedule_events se ON se.id = ar.schedule_event_id
         WHERE ar.delegate_id = ?
         ORDER BY se.start_time ASC`,
        [delegateId]
    );
    return rows;
}

/**
 * Per-event attendance counts for every session in a conference, joined
 * through conference_schedule_days since schedule_events has no direct
 * conference_id column.
 */
async function getEventSummaries(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT se.id AS schedule_event_id, se.title, se.type, se.start_time, se.committee_id,
                COUNT(ar.id) AS checked_in_count
         FROM schedule_events se
         INNER JOIN conference_schedule_days csd ON csd.id = se.schedule_day_id
         LEFT JOIN attendance_records ar ON ar.schedule_event_id = se.id
         WHERE csd.conference_id = ?
         GROUP BY se.id, se.title, se.type, se.start_time, se.committee_id
         ORDER BY se.start_time ASC`,
        [conferenceId]
    );
    return rows;
}

module.exports = {
    findTokenByDelegate, findByToken, createToken, findAttendanceRecord, checkIn, removeCheckIn,
    listForEvent, listForDelegate, getEventSummaries
};
