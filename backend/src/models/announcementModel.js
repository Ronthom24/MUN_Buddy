const pool = require("../config/database");

async function create(
    {
        conferenceId, committeeId, portfolioId, title, category, targetAudience,
        priority, content, attachmentPath, publishDate, status
    },
    db = pool
) {
    const [result] = await db.execute(
        `INSERT INTO announcements
            (conference_id, committee_id, portfolio_id, title, category, target_audience, priority, content, attachment_path, publish_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            conferenceId, committeeId || null, portfolioId || null, title, category || "general_update",
            targetAudience || "all", priority || "normal", content, attachmentPath || null,
            publishDate || null, status || "draft"
        ]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM announcements WHERE id = ? AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT a.*,
                c.name AS committee_name, p.name AS portfolio_name,
                (SELECT COUNT(*) FROM announcement_reads r WHERE r.announcement_id = a.id) AS read_count
         FROM announcements a
         LEFT JOIN committees c ON c.id = a.committee_id
         LEFT JOIN portfolios p ON p.id = a.portfolio_id
         WHERE a.conference_id = ? AND a.deleted_at IS NULL
         ORDER BY a.created_at DESC`,
        [conferenceId]
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    title: "title", category: "category", targetAudience: "target_audience",
    committeeId: "committee_id", portfolioId: "portfolio_id",
    priority: "priority", content: "content", publishDate: "publish_date", status: "status"
};

async function update(id, data, db = pool) {
    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE announcements SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function remove(id, db = pool) {
    await db.execute(`UPDATE announcements SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
}

async function restore(id, db = pool) {
    await db.execute(`UPDATE announcements SET deleted_at = NULL WHERE id = ?`, [id]);
    return findById(id, db);
}

async function listTrashed(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM announcements WHERE conference_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
        [conferenceId]
    );
    return rows;
}

/**
 * Scheduled announcements auto-publish lazily: any 'scheduled' row whose
 * publish_date has passed is flipped to 'published' the next time this
 * conference's announcements are read (no cron worker in this stack).
 */
async function publishDueAnnouncements(conferenceId, db = pool) {
    await db.execute(
        `UPDATE announcements
         SET status = 'published'
         WHERE conference_id = ? AND status = 'scheduled' AND deleted_at IS NULL
           AND publish_date IS NOT NULL AND publish_date <= NOW()`,
        [conferenceId]
    );
}

async function listVisibleToDelegate(conferenceId, { delegateId, committeeId, portfolioId }, db = pool) {
    await publishDueAnnouncements(conferenceId, db);

    const [rows] = await db.query(
        `SELECT a.*, (SELECT COUNT(*) FROM announcement_reads r WHERE r.announcement_id = a.id AND r.delegate_id = ?) AS is_read
         FROM announcements a
         WHERE a.conference_id = ? AND a.status = 'published' AND a.deleted_at IS NULL AND a.target_audience IN ('all', 'delegates')
           AND (a.committee_id IS NULL OR a.committee_id = ?)
           AND (a.portfolio_id IS NULL OR a.portfolio_id = ?)
         ORDER BY COALESCE(a.publish_date, a.created_at) DESC`,
        [delegateId || 0, conferenceId, committeeId || null, portfolioId || null]
    );
    return rows;
}

async function markRead(announcementId, delegateId, db = pool) {
    await db.execute(
        `INSERT INTO announcement_reads (announcement_id, delegate_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE read_at = read_at`,
        [announcementId, delegateId]
    );
}

module.exports = {
    create, findById, listByConference, update, remove, listVisibleToDelegate, markRead, publishDueAnnouncements,
    restore, listTrashed
};
