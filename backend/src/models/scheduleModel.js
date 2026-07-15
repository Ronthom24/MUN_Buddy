const pool = require("../config/database");

async function createDay({ conferenceId, dayDate, label }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO conference_schedule_days (conference_id, day_date, label) VALUES (?, ?, ?)`,
        [conferenceId, dayDate, label || null]
    );
    return result.insertId;
}

async function findDayById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM conference_schedule_days WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function removeDay(id, db = pool) {
    await db.execute(`DELETE FROM conference_schedule_days WHERE id = ?`, [id]);
}

async function createEvent(
    { scheduleDayId, committeeId, title, type, location, startTime, endTime, status },
    db = pool
) {
    const [result] = await db.execute(
        `INSERT INTO schedule_events (schedule_day_id, committee_id, title, type, location, start_time, end_time, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            scheduleDayId, committeeId || null, title, type || "general_event",
            location || null, startTime, endTime, status || "scheduled"
        ]
    );
    return result.insertId;
}

async function findEventById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM schedule_events WHERE id = ?`, [id]);
    return rows[0] || null;
}

const UPDATABLE_EVENT_FIELDS = {
    title: "title", type: "type", location: "location", startTime: "start_time",
    endTime: "end_time", status: "status", committeeId: "committee_id"
};

async function updateEvent(id, data, db = pool) {
    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(UPDATABLE_EVENT_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findEventById(id, db);

    params.push(id);
    await db.execute(`UPDATE schedule_events SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findEventById(id, db);
}

async function removeEvent(id, db = pool) {
    await db.execute(`DELETE FROM schedule_events WHERE id = ?`, [id]);
}

async function listForConference(conferenceId, db = pool) {
    const [days] = await db.execute(
        `SELECT * FROM conference_schedule_days WHERE conference_id = ? ORDER BY day_date ASC`,
        [conferenceId]
    );
    if (days.length === 0) return [];

    const dayIds = days.map((d) => d.id);
    const [events] = await db.query(
        `SELECT se.*, c.name AS committee_name
         FROM schedule_events se
         LEFT JOIN committees c ON c.id = se.committee_id
         WHERE se.schedule_day_id IN (?)
         ORDER BY se.start_time ASC`,
        [dayIds]
    );

    return days.map((day) => ({
        ...day,
        events: events.filter((e) => e.schedule_day_id === day.id)
    }));
}

module.exports = {
    createDay, findDayById, removeDay, createEvent, findEventById, updateEvent, removeEvent, listForConference
};
