const pool = require("../config/database");

async function getAll(db = pool) {
    const [rows] = await db.query(`SELECT setting_key, setting_value FROM platform_settings`);
    return rows.reduce((acc, row) => {
        acc[row.setting_key] = row.setting_value;
        return acc;
    }, {});
}

async function get(key, db = pool) {
    const [rows] = await db.execute(`SELECT setting_value FROM platform_settings WHERE setting_key = ?`, [key]);
    return rows[0] ? rows[0].setting_value : null;
}

async function set(key, value, db = pool) {
    await db.execute(
        `INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value]
    );
}

async function setMany(entries, db = pool) {
    for (const [key, value] of Object.entries(entries)) {
        await set(key, value, db);
    }
}

module.exports = { getAll, get, set, setMany };
