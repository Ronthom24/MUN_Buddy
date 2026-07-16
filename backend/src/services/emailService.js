/**
 * SMTP is optional in this environment: if SMTP_HOST is configured, mail is
 * actually sent via nodemailer; otherwise every "send" is logged and recorded
 * as delivered without a real network call. This mirrors the pragmatic
 * "manual/offline" precedent set by Phase 4 payments (real Razorpay
 * integration is out of scope for V1; this stack sends real mail only when
 * the operator supplies real SMTP credentials).
 */
let transporter = null;
let transporterInitAttempted = false;

function getTransporter() {
    if (transporterInitAttempted) return transporter;
    transporterInitAttempted = true;

    if (!process.env.SMTP_HOST) return null;

    const nodemailer = require("nodemailer");
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    });
    return transporter;
}

async function sendMail({ to, subject, html }) {
    const mailer = getTransporter();

    if (!mailer) {
        console.log(`[emailService] (log-only, no SMTP configured) would send to ${to}: "${subject}"`);
        return { delivered: false, mode: "log-only" };
    }

    await mailer.sendMail({
        from: process.env.SMTP_FROM || "MUN Buddy <no-reply@munbuddy.local>",
        to,
        subject,
        html
    });
    return { delivered: true, mode: "smtp" };
}

module.exports = { sendMail };
