const pool = require("../config/database");

async function create({ conferenceId, recipientType, recipientId, type, title, message, link }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO notifications (conference_id, recipient_type, recipient_id, type, title, message, link)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [conferenceId || null, recipientType, recipientId, type || "info", title, message, link || null]
    );
    return result.insertId;
}

async function listForRecipient(recipientType, recipientId, { unreadOnly } = {}, db = pool) {
    const clauses = ["recipient_type = ?", "recipient_id = ?"];
    const params = [recipientType, recipientId];
    if (unreadOnly) clauses.push("read_at IS NULL");

    const [rows] = await db.query(
        `SELECT * FROM notifications WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT 100`,
        params
    );
    return rows;
}

async function countUnread(recipientType, recipientId, db = pool) {
    const [rows] = await db.execute(
        `SELECT COUNT(*) AS count FROM notifications WHERE recipient_type = ? AND recipient_id = ? AND read_at IS NULL`,
        [recipientType, recipientId]
    );
    return rows[0].count;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM notifications WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function markRead(id, db = pool) {
    await db.execute(`UPDATE notifications SET read_at = NOW() WHERE id = ?`, [id]);
}

async function markAllRead(recipientType, recipientId, db = pool) {
    await db.execute(
        `UPDATE notifications SET read_at = NOW() WHERE recipient_type = ? AND recipient_id = ? AND read_at IS NULL`,
        [recipientType, recipientId]
    );
}

async function getPreferences(recipientType, recipientId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM notification_preferences WHERE recipient_type = ? AND recipient_id = ?`,
        [recipientType, recipientId]
    );
    return rows[0] || { recipient_type: recipientType, recipient_id: recipientId, email_enabled: 1, in_app_enabled: 1, digest_enabled: 0 };
}

async function upsertPreferences(recipientType, recipientId, { emailEnabled, inAppEnabled, digestEnabled }, db = pool) {
    await db.execute(
        `INSERT INTO notification_preferences (recipient_type, recipient_id, email_enabled, in_app_enabled, digest_enabled)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            email_enabled = VALUES(email_enabled), in_app_enabled = VALUES(in_app_enabled), digest_enabled = VALUES(digest_enabled)`,
        [
            recipientType, recipientId,
            emailEnabled === undefined ? true : emailEnabled,
            inAppEnabled === undefined ? true : inAppEnabled,
            digestEnabled === undefined ? false : digestEnabled
        ]
    );
    return getPreferences(recipientType, recipientId, db);
}

module.exports = {
    create, listForRecipient, countUnread, findById, markRead, markAllRead, getPreferences, upsertPreferences
};
