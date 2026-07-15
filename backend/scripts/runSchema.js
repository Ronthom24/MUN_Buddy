const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SCHEMA_DIR = path.join(__dirname, "..", "..", "database", "schema");

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        multipleStatements: true
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    await connection.query(`USE ${process.env.DB_NAME}`);

    await connection.query(
        `CREATE TABLE IF NOT EXISTS _schema_migrations (
            filename VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    );

    const [appliedRows] = await connection.query(`SELECT filename FROM _schema_migrations`);
    const applied = new Set(appliedRows.map((row) => row.filename));

    const files = fs.readdirSync(SCHEMA_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();

    for (const file of files) {
        if (applied.has(file)) {
            console.log(`Skipped (already applied): ${file}`);
            continue;
        }

        const sql = fs.readFileSync(path.join(SCHEMA_DIR, file), "utf8");
        await connection.query(sql);
        await connection.execute(`INSERT INTO _schema_migrations (filename) VALUES (?)`, [file]);
        console.log(`Executed: ${file}`);
    }

    await connection.end();
    console.log("Schema load complete.");
}

run().catch((err) => {
    console.error("Schema load failed:", err.message);
    process.exit(1);
});
