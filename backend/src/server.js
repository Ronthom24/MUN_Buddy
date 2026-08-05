require("dotenv").config();

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_DB_URL:", process.env.SUPABASE_DB_URL ? "Loaded" : "Missing");

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await pool.getConnection();

        console.log("====================================");
        console.log("✅ Connected to Postgres (Supabase)");
        console.log("====================================");

        connection.release();

        app.listen(PORT, () => {
            console.log(`🚀 MUN Buddy Backend running on port ${PORT}`);
        });

    } catch (err) {
        console.error("❌ Database Connection Failed");
        console.error(err.message);
        process.exit(1);
    }
}

startServer();