const pool = require("../config/database");

async function create({ name, email, passwordHash }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO platform_admins (name, email, password_hash) VALUES (?, ?, ?)`,
        [name, email, passwordHash]
    );
    return result.insertId;
}

async function findByEmail(email, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM platform_admins WHERE email = ?`, [email]);
    return rows[0] || null;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM platform_admins WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function touchLastLogin(id, db = pool) {
    await db.execute(`UPDATE platform_admins SET last_login = NOW() WHERE id = ?`, [id]);
}

async function updatePasswordHash(id, passwordHash, db = pool) {
    await db.execute(`UPDATE platform_admins SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
}

module.exports = { create, findByEmail, findById, touchLastLogin, updatePasswordHash };
