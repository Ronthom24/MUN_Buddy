const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SCHEMA_DIR = path.join(__dirname, "..", "..", "database", "schema-postgres");

async function run() {
    const client = new Client({
        connectionString: process.env.SUPABASE_DB_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    await client.query(
        `CREATE TABLE IF NOT EXISTS _schema_migrations (
            filename TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`
    );

    const { rows: appliedRows } = await client.query(`SELECT filename FROM _schema_migrations`);
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

        try {
            await client.query("BEGIN");
            await client.query(sql);
            await client.query(`INSERT INTO _schema_migrations (filename) VALUES ($1)`, [file]);
            await client.query("COMMIT");
            console.log(`Executed: ${file}`);
        } catch (err) {
            await client.query("ROLLBACK");
            throw new Error(`Failed applying ${file}: ${err.message}`);
        }
    }

    await client.end();
    console.log("Schema load complete.");
}

run().catch((err) => {
    console.error("Schema load failed:", err.message);
    process.exit(1);
});
