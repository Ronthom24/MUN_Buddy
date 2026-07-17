const pool = require("../config/database");

async function create({ accountType, accountId, token, expiresAt }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO email_verification_tokens (account_type, account_id, token, expires_at) VALUES (?, ?, ?, ?)`,
        [accountType, accountId, token, expiresAt]
    );
    return result.insertId;
}

async function findValidByToken(token, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM email_verification_tokens
         WHERE token = ? AND used = FALSE AND expires_at > NOW()`,
        [token]
    );
    return rows[0] || null;
}

async function markUsed(id, db = pool) {
    await db.execute(`UPDATE email_verification_tokens SET used = TRUE WHERE id = ?`, [id]);
}

module.exports = { create, findValidByToken, markUsed };
