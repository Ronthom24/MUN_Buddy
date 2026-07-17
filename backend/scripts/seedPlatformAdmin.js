const path = require("path");
const bcrypt = require("bcrypt");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const pool = require("../src/config/database");
const platformAdminModel = require("../src/models/platformAdminModel");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

async function run() {
    const name = process.env.SUPER_ADMIN_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!name || !email || !password) {
        console.error("SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD must all be set.");
        process.exit(1);
    }

    const existing = await platformAdminModel.findByEmail(email);
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    if (existing) {
        await platformAdminModel.updatePasswordHash(existing.id, passwordHash);
        console.log(`Platform administrator already existed for ${email} -- password updated.`);
    } else {
        await platformAdminModel.create({ name, email, passwordHash });
        console.log(`Platform administrator created for ${email}.`);
    }

    await pool.end();
}

run().catch((err) => {
    console.error("Seeding platform administrator failed:", err.message);
    process.exit(1);
});
