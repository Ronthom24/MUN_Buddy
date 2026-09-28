const pool = require("../config/database");

async function findByDelegateId(delegateId, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM assignments WHERE delegate_id = $1`, [delegateId]);
    return rows[0] || null;
}

async function ensureRow(delegateId, db = pool) {
    const existing = await findByDelegateId(delegateId, db);
    if (existing) return existing;

    await db.execute(`INSERT INTO assignments (delegate_id) VALUES ($1)`, [delegateId]);
    return findByDelegateId(delegateId, db);
}

async function assign(delegateId, { committeeId, portfolioId, publish }, db = pool) {
    await ensureRow(delegateId, db);

    const setClauses = [];
    const params = [];

    if (committeeId !== undefined) {
        params.push(committeeId);
        setClauses.push(`committee_id = $${params.length}`);
    }
    if (portfolioId !== undefined) {
        params.push(portfolioId);
        setClauses.push(`portfolio_id = $${params.length}`);
    }
    setClauses.push("status = 'assigned'");
    if (publish) setClauses.push("published = TRUE");

    params.push(delegateId);
    await db.execute(`UPDATE assignments SET ${setClauses.join(", ")} WHERE delegate_id = $${params.length}`, params);
    return findByDelegateId(delegateId, db);
}

/**
 * Only approved delegates are eligible for assignment (spec 13.18: "Only
 * approved delegates may be assigned"), so this intentionally excludes
 * pending/rejected/waitlisted/withdrawn delegates rather than listing every
 * delegate in the conference.
 */
async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT a.id, d.id AS delegate_id, a.committee_id, a.portfolio_id, a.status, a.published,
                pr.full_name AS delegate_name, d.school AS delegate_school, d.status AS delegate_status,
                c.name AS committee_name, p.name AS portfolio_name
         FROM delegates d
         JOIN profiles pr ON pr.id = d.profile_id
         LEFT JOIN assignments a ON a.delegate_id = d.id
         LEFT JOIN committees c ON c.id = a.committee_id
         LEFT JOIN portfolios p ON p.id = a.portfolio_id
         WHERE d.conference_id = $1 AND d.status = 'approved'
         ORDER BY pr.full_name ASC`,
        [conferenceId]
    );
    return rows;
}

async function countAssignedInCommittee(committeeId, db = pool) {
    const [[row]] = await db.query(
        `SELECT COUNT(*) AS count FROM assignments WHERE committee_id = $1 AND status = 'assigned'`,
        [committeeId]
    );
    return Number(row.count) || 0;
}

async function logHistory({ delegateId, committeeId, portfolioId, action, changedByAccessId }, db = pool) {
    await db.execute(
        `INSERT INTO assignment_history (delegate_id, committee_id, portfolio_id, action, changed_by_organizer_access_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [delegateId, committeeId ?? null, portfolioId ?? null, action, changedByAccessId ?? null]
    );
}

async function getHistoryForDelegate(delegateId, db = pool) {
    const [rows] = await db.query(
        `SELECT ah.*, c.name AS committee_name, p.name AS portfolio_name
         FROM assignment_history ah
         LEFT JOIN committees c ON c.id = ah.committee_id
         LEFT JOIN portfolios p ON p.id = ah.portfolio_id
         WHERE ah.delegate_id = $1
         ORDER BY ah.created_at ASC`,
        [delegateId]
    );
    return rows;
}

async function unassign(delegateId, db = pool) {
    await ensureRow(delegateId, db);
    await db.execute(
        `UPDATE assignments SET committee_id = NULL, portfolio_id = NULL, status = 'unassigned', published = FALSE
         WHERE delegate_id = $1`,
        [delegateId]
    );
    return findByDelegateId(delegateId, db);
}

async function publishAll(conferenceId, db = pool) {
    await db.query(
        `UPDATE assignments a
         SET published = TRUE
         FROM delegates d
         WHERE d.id = a.delegate_id AND d.conference_id = $1 AND a.status = 'assigned'`,
        [conferenceId]
    );
}

/**
 * Full country/portfolio roster for a committee, for the delegate-facing
 * "My Committee" page -- who's representing each seat and whether they've
 * checked in today. Only published assignments show a name (an unpublished
 * one reads as unassigned to other delegates, same privacy rule as their
 * own assignment being hidden until published). "Present today" checks for
 * any attendance_records row today across any schedule event, not just
 * this committee's own sessions, since attendance can be taken at a
 * ceremony/general event too.
 */
async function getRosterForCommittee(committeeId, db = pool) {
    const [rows] = await db.query(
        `SELECT p.id AS portfolio_id, p.name AS portfolio_name, p.type,
                CASE WHEN a.published THEN d.id END AS delegate_id,
                CASE WHEN a.published THEN pr.full_name END AS delegate_name,
                COALESCE(a.published AND a.status = 'assigned', FALSE) AS assigned,
                COALESCE(a.published, FALSE) AND EXISTS (
                    SELECT 1 FROM attendance_records ar
                    JOIN schedule_events se ON se.id = ar.schedule_event_id
                    JOIN conference_schedule_days csd ON csd.id = se.schedule_day_id
                    WHERE ar.delegate_id = d.id AND csd.day_date = CURRENT_DATE
                ) AS present_today
         FROM portfolios p
         LEFT JOIN assignments a ON a.portfolio_id = p.id AND a.status = 'assigned'
         LEFT JOIN delegates d ON d.id = a.delegate_id
         LEFT JOIN profiles pr ON pr.id = d.profile_id
         WHERE p.committee_id = $1 AND p.deleted_at IS NULL
         ORDER BY p.name ASC`,
        [committeeId]
    );
    return rows;
}

async function findPublishedByDelegateId(delegateId, db = pool) {
    const [rows] = await db.query(
        `SELECT a.*, c.name AS committee_name, p.name AS portfolio_name, p.type AS portfolio_type
         FROM assignments a
         LEFT JOIN committees c ON c.id = a.committee_id
         LEFT JOIN portfolios p ON p.id = a.portfolio_id
         WHERE a.delegate_id = $1`,
        [delegateId]
    );
    return rows[0] || null;
}

module.exports = {
    findByDelegateId, ensureRow, assign, listByConference, publishAll, findPublishedByDelegateId,
    countAssignedInCommittee, logHistory, getHistoryForDelegate, unassign, getRosterForCommittee
};
