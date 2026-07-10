require("dotenv").config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD ? "Loaded" : "Missing");

const app = require("./app");
const pool = require("./config/database");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        const connection = await pool.getConnection();

        console.log("====================================");
        console.log("✅ Connected to MySQL");
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