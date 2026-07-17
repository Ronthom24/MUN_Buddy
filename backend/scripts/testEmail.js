const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const emailService = require("../src/services/emailService");

async function run() {
    const to = process.argv[2];
    if (!to) {
        console.error("Usage: node scripts/testEmail.js <recipient-email>");
        process.exit(1);
    }

    const result = await emailService.sendMail({
        to,
        subject: "MUN Buddy SMTP test",
        html: "<p>If you're reading this, MUN Buddy's real email delivery (via Brevo) is working.</p>"
    });

    console.log(JSON.stringify(result));
    if (result.mode === "log-only") {
        console.error("SMTP_HOST is not set -- this ran in log-only mode, no real email was sent.");
        process.exit(1);
    }
}

run().catch((err) => {
    console.error("Send failed:", err.message);
    process.exit(1);
});
