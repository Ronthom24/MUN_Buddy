const { Pool } = require("pg");
require("dotenv").config();

const pgPool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
});

function toMysqlShape(pgResult) {
    return [pgResult.rows, pgResult.fields];
}

/**
 * mysql2-compatible shim over `pg`. Every model calls `db.execute(sql,
 * params)` / `db.query(sql, params)` and destructures `[rows]`, and
 * transaction-using services do
 * `const connection = await pool.getConnection(); connection.beginTransaction()
 * / .commit() / .rollback() / .release()` -- this shim keeps that exact
 * shape working so the mysql2 -> pg migration only required converting SQL
 * strings themselves (placeholders, RETURNING, ON CONFLICT, etc.) across the
 * 39 model files, not rewriting every call site's control flow.
 */
const db = {
    async execute(sql, params) {
        return toMysqlShape(await pgPool.query(sql, params));
    },
    async query(sql, params) {
        return toMysqlShape(await pgPool.query(sql, params));
    },
    async getConnection() {
        const client = await pgPool.connect();
        return {
            async execute(sql, params) {
                return toMysqlShape(await client.query(sql, params));
            },
            async query(sql, params) {
                return toMysqlShape(await client.query(sql, params));
            },
            async beginTransaction() {
                await client.query("BEGIN");
            },
            async commit() {
                await client.query("COMMIT");
            },
            async rollback() {
                await client.query("ROLLBACK");
            },
            release() {
                client.release();
            }
        };
    },
    async end() {
        await pgPool.end();
    }
};

module.exports = db;
