const pool = require("../config/database");

async function create({ userType, userId, email, success, ipAddress, userAgent }, db = pool) {
    await db.execute(
        `INSERT INTO login_history (user_type, user_id, email, success, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userType, userId || null, email, success, ipAddress || null, (userAgent || "").slice(0, 255)]
    );
}

async function listForUser(userType, userId, { limit = 20 } = {}, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM login_history WHERE user_type = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT $3`,
        [userType, userId, limit]
    );
    return rows;
}

async function listRecent({ limit = 100, success } = {}, db = pool) {
    const clauses = [];
    const params = [];
    if (success !== undefined) {
        params.push(success ? true : false);
        clauses.push(`success = $${params.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    params.push(limit);

    const [rows] = await db.query(
        `SELECT * FROM login_history ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
        params
    );
    return rows;
}

/** Emails with N+ failed attempts within the last `windowMinutes` -- the Security Center's "suspicious activity" heuristic. */
async function listSuspiciousEmails({ windowMinutes = 15, threshold = 5 } = {}, db = pool) {
    const [rows] = await db.query(
        `SELECT email, COUNT(*) AS failed_attempts, MAX(created_at) AS last_attempt_at
         FROM login_history
         WHERE success = FALSE AND created_at >= now() - ($1 || ' minutes')::interval
         GROUP BY email
         HAVING COUNT(*) >= $2
         ORDER BY failed_attempts DESC`,
        [windowMinutes, threshold]
    );
    return rows;
}

/** Failed-attempt count for one email in the trailing window -- the basis for login lockout enforcement. */
async function countRecentFailures(email, { windowMinutes = 15 } = {}, db = pool) {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM login_history
         WHERE email = $1 AND success = FALSE AND created_at >= now() - ($2 || ' minutes')::interval`,
        [email, windowMinutes]
    );
    return rows[0].count;
}

module.exports = { create, listForUser, listRecent, listSuspiciousEmails, countRecentFailures };
