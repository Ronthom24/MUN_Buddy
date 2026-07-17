const pool = require("../config/database");

async function create({ userType, userId, email, success, ipAddress, userAgent }, db = pool) {
    await db.execute(
        `INSERT INTO login_history (user_type, user_id, email, success, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userType, userId || null, email, success, ipAddress || null, (userAgent || "").slice(0, 255)]
    );
}

async function listForUser(userType, userId, { limit = 20 } = {}, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM login_history WHERE user_type = ? AND user_id = ? ORDER BY created_at DESC LIMIT ?`,
        [userType, userId, limit]
    );
    return rows;
}

async function listRecent({ limit = 100, success } = {}, db = pool) {
    const clauses = [];
    const params = [];
    if (success !== undefined) {
        clauses.push("success = ?");
        params.push(success ? 1 : 0);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    params.push(limit);

    const [rows] = await db.query(
        `SELECT * FROM login_history ${where} ORDER BY created_at DESC LIMIT ?`,
        params
    );
    return rows;
}

/** Emails with N+ failed attempts within the last `windowMinutes` -- the Security Center's "suspicious activity" heuristic. */
async function listSuspiciousEmails({ windowMinutes = 15, threshold = 5 } = {}, db = pool) {
    const [rows] = await db.query(
        `SELECT email, COUNT(*) AS failed_attempts, MAX(created_at) AS last_attempt_at
         FROM login_history
         WHERE success = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
         GROUP BY email
         HAVING failed_attempts >= ?
         ORDER BY failed_attempts DESC`,
        [windowMinutes, threshold]
    );
    return rows;
}

/** Failed-attempt count for one email in the trailing window -- the basis for login lockout enforcement. */
async function countRecentFailures(email, { windowMinutes = 15 } = {}, db = pool) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM login_history
         WHERE email = ? AND success = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
        [email, windowMinutes]
    );
    return rows[0].count;
}

module.exports = { create, listForUser, listRecent, listSuspiciousEmails, countRecentFailures };
