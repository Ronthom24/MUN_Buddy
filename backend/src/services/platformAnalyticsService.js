const pool = require("../config/database");

/**
 * Never converted during the Phase 2 mysql2->pg model conversion since it
 * queries the db directly instead of going through a model -- MySQL-only
 * syntax here (SUM(bool_expr), the old `organizers` table, DATE_SUB/
 * DATE_FORMAT/CURDATE) all fail against Postgres. Rewritten to Postgres
 * idioms: COUNT(*) FILTER (WHERE ...) instead of SUM(bool_expr), profiles
 * (joined via organization_members/organizer_access) instead of the
 * retired `organizers` table, and date_trunc/TO_CHAR/CURRENT_DATE instead
 * of the MySQL date functions.
 */
async function getDashboardStats(db = pool) {
    const [[organizations]] = await db.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'active') AS active,
                COUNT(*) FILTER (WHERE status = 'suspended') AS suspended
         FROM organizations WHERE deleted_at IS NULL`
    );
    const [[conferences]] = await db.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'published') AS published,
                COUNT(*) FILTER (WHERE status = 'draft') AS draft,
                COUNT(*) FILTER (WHERE status = 'archived') AS archived,
                COUNT(*) FILTER (WHERE admin_disabled) AS disabled
         FROM conferences WHERE deleted_at IS NULL`
    );
    const [[organizers]] = await db.query(
        `SELECT COUNT(DISTINCT p.id) AS total,
                COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'suspended') AS suspended
         FROM profiles p
         WHERE EXISTS (SELECT 1 FROM organization_members om WHERE om.profile_id = p.id)
            OR EXISTS (SELECT 1 FROM organizer_access oa WHERE oa.profile_id = p.id)`
    );
    const [[delegates]] = await db.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE account_status = 'suspended') AS suspended FROM delegates`
    );
    const [[certificates]] = await db.query(`SELECT COUNT(*) AS total FROM certificates`);
    const [[payments]] = await db.query(
        `SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS "totalAmount" FROM payments WHERE status = 'verified'`
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
        `SELECT created_at::date AS date, COUNT(*) AS count FROM delegates
         WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY created_at::date ORDER BY date ASC`
    );
    const [monthlyConferences] = await db.query(
        `SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS count FROM conferences
         WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY month ASC`
    );
    const [organizationGrowth] = await db.query(
        `SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS count FROM organizations
         WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
         GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY month ASC`
    );

    return { dailyRegistrations, monthlyConferences, organizationGrowth };
}

module.exports = { getDashboardStats, getGrowthSeries };
