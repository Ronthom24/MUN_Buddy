const notificationModel = require("../models/notificationModel");
const emailService = require("./emailService");

/**
 * Creates an in-app notification and, if the recipient's preferences allow
 * it, best-effort emails them too (fire-and-forget: a failed/log-only email
 * never blocks the in-app notification or the caller's own transaction).
 */
async function notify({ conferenceId, recipientType, recipientId, type, title, message, link, email }) {
    const id = await notificationModel.create({ conferenceId, recipientType, recipientId, type, title, message, link });

    if (email) {
        const prefs = await notificationModel.getPreferences(recipientType, recipientId);
        if (prefs.email_enabled) {
            emailService.sendMail({ to: email, subject: title, html: `<p>${message}</p>` }).catch(() => {});
        }
    }

    return id;
}

async function notifyMany(notifications) {
    for (const n of notifications) {
        await notify(n);
    }
}

module.exports = { notify, notifyMany };
