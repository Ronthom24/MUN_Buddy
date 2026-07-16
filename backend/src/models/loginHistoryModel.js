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

module.exports = { create, listForUser };
