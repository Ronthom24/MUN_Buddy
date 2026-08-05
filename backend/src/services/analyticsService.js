const pool = require("../config/database");
const delegateService = require("./delegateService");
const assignmentService = require("./assignmentService");
const paymentService = require("./paymentService");
const attendanceService = require("./attendanceService");

/**
 * Spec Chapter 17 (Analytics & Intelligence Center): a single consolidated
 * endpoint aggregating every module's numbers into one dashboard payload,
 * rather than scattering a dozen per-module analytics calls across the
 * frontend. Registration/assignment/financial/attendance analytics already
 * existed per-module (Phases 2-5); this adds the two genuinely missing
 * domains (committee occupancy/popularity, communication + resource stats)
 * and wraps everything in one call.
 */
async function getCommitteeAnalytics(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT
            c.id, c.name, c.capacity, c.type, c.status,
            COUNT(a.id) AS assigned_count,
            (SELECT COUNT(*) FROM delegate_committee_preferences dcp WHERE dcp.committee_id = c.id) AS preference_count
         FROM committees c
         LEFT JOIN assignments a ON a.committee_id = c.id AND a.status = 'assigned'
         WHERE c.conference_id = $1 AND c.deleted_at IS NULL
         GROUP BY c.id, c.name, c.capacity, c.type, c.status
         ORDER BY assigned_count DESC`,
        [conferenceId]
    );

    return rows.map((row) => ({
        committeeId: row.id,
        committeeName: row.name,
        capacity: row.capacity,
        type: row.type,
        status: row.status,
        assignedCount: Number(row.assigned_count) || 0,
        remainingCapacity: row.capacity ? Math.max(row.capacity - Number(row.assigned_count), 0) : null,
        capacityUtilization: row.capacity ? Number((Number(row.assigned_count) / row.capacity).toFixed(2)) : null,
        preferenceCount: Number(row.preference_count) || 0
    }));
}

async function getResourceAnalytics(conferenceId, db = pool) {
    const [[totals]] = await db.query(
        `SELECT COUNT(*) AS total_resources, SUM(download_count) AS total_downloads
         FROM resources WHERE conference_id = $1 AND deleted_at IS NULL`,
        [conferenceId]
    );
    const [mostDownloaded] = await db.query(
        `SELECT id, title, download_count FROM resources
         WHERE conference_id = $1 AND deleted_at IS NULL
         ORDER BY download_count DESC LIMIT 5`,
        [conferenceId]
    );
    const [recentlyUploaded] = await db.query(
        `SELECT id, title, created_at FROM resources
         WHERE conference_id = $1 AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 5`,
        [conferenceId]
    );
    const [[unused]] = await db.query(
        `SELECT COUNT(*) AS unused_count FROM resources
         WHERE conference_id = $1 AND deleted_at IS NULL AND status = 'published' AND download_count = 0`,
        [conferenceId]
    );

    return {
        totalResources: Number(totals.total_resources) || 0,
        totalDownloads: Number(totals.total_downloads) || 0,
        unusedCount: Number(unused.unused_count) || 0,
        mostDownloaded: mostDownloaded.map((r) => ({ id: r.id, title: r.title, downloadCount: r.download_count })),
        recentlyUploaded: recentlyUploaded.map((r) => ({ id: r.id, title: r.title, createdAt: r.created_at }))
    };
}

async function getCommunicationAnalytics(conferenceId, db = pool) {
    const [[announcementStats]] = await db.query(
        `SELECT COUNT(*) AS published_count FROM announcements
         WHERE conference_id = $1 AND status = 'published' AND deleted_at IS NULL`,
        [conferenceId]
    );
    const [readRateRows] = await db.query(
        `SELECT a.id, (SELECT COUNT(*) FROM announcement_reads r WHERE r.announcement_id = a.id) AS read_count
         FROM announcements a WHERE a.conference_id = $1 AND a.status = 'published' AND a.deleted_at IS NULL`,
        [conferenceId]
    );
    const [[approvedCount]] = await db.query(
        `SELECT COUNT(*) AS count FROM delegates WHERE conference_id = $1 AND status = 'approved'`,
        [conferenceId]
    );
    const audience = Number(approvedCount.count) || 0;
    const avgReadRate = audience > 0 && readRateRows.length > 0
        ? Number((readRateRows.reduce((sum, r) => sum + Number(r.read_count), 0) / (readRateRows.length * audience)).toFixed(2))
        : 0;

    const [[faqStats]] = await db.query(
        `SELECT
            COUNT(*) AS total_faqs,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_faqs,
            AVG(CASE WHEN answered_at IS NOT NULL THEN EXTRACT(EPOCH FROM (answered_at - created_at)) / 3600 END) AS avg_resolution_hours
         FROM faqs WHERE conference_id = $1`,
        [conferenceId]
    );

    const [[notificationStats]] = await db.query(
        `SELECT COUNT(*) AS total_sent, COUNT(*) FILTER (WHERE read_at IS NOT NULL) AS total_read
         FROM notifications WHERE conference_id = $1`,
        [conferenceId]
    );

    const [[broadcastStats]] = await db.query(
        `SELECT
            COUNT(DISTINCT b.id) AS total_broadcasts,
            COUNT(r.id) AS total_recipients,
            COUNT(*) FILTER (WHERE r.status = 'sent') AS total_delivered
         FROM email_broadcasts b
         LEFT JOIN email_broadcast_recipients r ON r.broadcast_id = b.id
         WHERE b.conference_id = $1`,
        [conferenceId]
    );

    return {
        announcementsPublished: Number(announcementStats.published_count) || 0,
        announcementAvgReadRate: avgReadRate,
        totalFaqs: Number(faqStats.total_faqs) || 0,
        pendingFaqs: Number(faqStats.pending_faqs) || 0,
        faqAvgResolutionHours: faqStats.avg_resolution_hours ? Number(Number(faqStats.avg_resolution_hours).toFixed(1)) : null,
        notificationsSent: Number(notificationStats.total_sent) || 0,
        notificationsRead: Number(notificationStats.total_read) || 0,
        broadcastsSent: Number(broadcastStats.total_broadcasts) || 0,
        broadcastDeliveryRate: Number(broadcastStats.total_recipients) > 0
            ? Number((Number(broadcastStats.total_delivered) / Number(broadcastStats.total_recipients)).toFixed(2))
            : 0
    };
}

async function getOverview(conference) {
    const [registration, committees, assignment, attendance, resources, communication] = await Promise.all([
        delegateService.getRegistrationAnalytics(conference.id),
        getCommitteeAnalytics(conference.id),
        assignmentService.getAnalytics(conference.id),
        attendanceService.getAnalytics(conference.id),
        getResourceAnalytics(conference.id),
        getCommunicationAnalytics(conference.id)
    ]);

    const financial = conference.payment_required ? await paymentService.getAnalytics(conference.id) : null;

    return { registration, committees, assignment, financial, attendance, resources, communication };
}

module.exports = { getOverview, getCommitteeAnalytics, getResourceAnalytics, getCommunicationAnalytics };
