const pool = require("../config/database");

async function create({ fullName, email, phone, passwordHash }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO organizers (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)`,
        [fullName, email, phone || null, passwordHash]
    );
    return result.insertId;
}

async function findByEmail(email, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizers WHERE email = ?`, [email]);
    return rows[0] || null;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizers WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function updatePasswordHash(id, passwordHash, db = pool) {
    await db.execute(`UPDATE organizers SET password_hash = ? WHERE id = ?`, [passwordHash, id]);
}

module.exports = { create, findByEmail, findById, updatePasswordHash };

