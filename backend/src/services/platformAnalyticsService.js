const pool = require("../config/database");

async function getDashboardStats(db = pool) {
    const [[organizations]] = await db.query(
        `SELECT COUNT(*) AS total, SUM(status = 'active') AS active, SUM(status = 'suspended') AS suspended
         FROM organizations WHERE deleted_at IS NULL`
    );
    const [[conferences]] = await db.query(
        `SELECT COUNT(*) AS total, SUM(status = 'published') AS published, SUM(status = 'draft') AS draft,
                SUM(status = 'archived') AS archived, SUM(admin_disabled = 1) AS disabled
         FROM conferences WHERE deleted_at IS NULL`
    );
    const [[organizers]] = await db.query(
        `SELECT COUNT(*) AS total, SUM(status = 'suspended') AS suspended FROM organizers`
    );
    const [[delegates]] = await db.query(
        `SELECT COUNT(*) AS total, SUM(account_status = 'suspended') AS suspended FROM delegates`
    );
    const [[certificates]] = await db.query(`SELECT COUNT(*) AS total FROM certificates`);
    const [[payments]] = await db.query(
        `SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS totalAmount FROM payments WHERE status = 'verified'`
    );

    return {
        organizations: { total: Number(organizations.total), active: Number(organizations.active) || 0, suspended: Number(organizations.suspended) || 0 },
        conferences: {
            total: Number(conferences.total),
            published: Number(conferences.published) || 0,
            draft: Number(conferences.draft) || 0,
            archived: Number(conferences.archived) || 0,
            disabled: Number(conferences.disabled) || 0
        },
        organizers: { total: Number(organizers.total), suspended: Number(organizers.suspended) || 0 },
        delegates: { total: Number(delegates.total), suspended: Number(delegates.suspended) || 0 },
        certificates: { total: Number(certificates.total) },
        payments: { total: Number(payments.total), totalAmount: Number(payments.totalAmount) || 0 }
    };
}

async function getGrowthSeries(db = pool) {
    const [dailyRegistrations] = await db.query(
        `SELECT DATE(created_at) AS date, COUNT(*) AS count FROM delegates
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY DATE(created_at) ORDER BY date ASC`
    );
    const [monthlyConferences] = await db.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count FROM conferences
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC`
    );
    const [organizationGrowth] = await db.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count FROM organizations
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC`
    );

    return { dailyRegistrations, monthlyConferences, organizationGrowth };
}

module.exports = { getDashboardStats, getGrowthSeries };
