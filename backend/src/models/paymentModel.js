const pool = require("../config/database");

async function create(
    {
        conferenceId, delegateId, feeCategoryId, amount, currency, method, transactionReference,
        paymentDate, notes, recordedBy, createdByAccessId, status
    },
    db = pool
) {
    const [rows] = await db.execute(
        `INSERT INTO payments
            (conference_id, delegate_id, fee_category_id, amount, currency, method, transaction_reference,
             payment_date, notes, recorded_by, created_by_organizer_access_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [
            conferenceId, delegateId, feeCategoryId || null, amount, currency || "INR", method,
            transactionReference || null, paymentDate || null, notes || null, recordedBy || "delegate",
            createdByAccessId || null, status || "submitted"
        ]
    );
    return findById(rows[0].id, db);
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(
        `SELECT p.*, pr.full_name AS delegate_name, pr.email AS delegate_email, fc.name AS fee_category_name
         FROM payments p
         INNER JOIN delegates d ON d.id = p.delegate_id
         JOIN profiles pr ON pr.id = d.profile_id
         LEFT JOIN fee_categories fc ON fc.id = p.fee_category_id
         WHERE p.id = $1`,
        [id]
    );
    return rows[0] || null;
}

async function listByConference(conferenceId, filters = {}, db = pool) {
    const clauses = ["p.conference_id = $1"];
    const params = [conferenceId];

    if (filters.status) {
        params.push(filters.status);
        clauses.push(`p.status = $${params.length}`);
    }
    if (filters.method) {
        params.push(filters.method);
        clauses.push(`p.method = $${params.length}`);
    }

    const [rows] = await db.execute(
        `SELECT p.*, pr.full_name AS delegate_name, pr.email AS delegate_email, fc.name AS fee_category_name
         FROM payments p
         INNER JOIN delegates d ON d.id = p.delegate_id
         JOIN profiles pr ON pr.id = d.profile_id
         LEFT JOIN fee_categories fc ON fc.id = p.fee_category_id
         WHERE ${clauses.join(" AND ")}
         ORDER BY p.created_at DESC`,
        params
    );
    return rows;
}

async function listByDelegate(delegateId, db = pool) {
    const [rows] = await db.execute(
        `SELECT p.*, fc.name AS fee_category_name
         FROM payments p
         LEFT JOIN fee_categories fc ON fc.id = p.fee_category_id
         WHERE p.delegate_id = $1
         ORDER BY p.created_at DESC`,
        [delegateId]
    );
    return rows;
}

async function hasVerifiedPayment(delegateId, db = pool) {
    const [[row]] = await db.query(
        `SELECT COUNT(*) AS count FROM payments WHERE delegate_id = $1 AND status = 'verified'`,
        [delegateId]
    );
    return Number(row.count) > 0;
}

async function updateStatus(id, status, { verifiedByAccessId, notes } = {}, db = pool) {
    const setClauses = [];
    const params = [];
    params.push(status);
    setClauses.push(`status = $${params.length}`);

    if (["verified", "failed"].includes(status)) {
        params.push(verifiedByAccessId ?? null);
        setClauses.push(`verified_by_organizer_access_id = $${params.length}`, "verified_at = CURRENT_TIMESTAMP");
    }
    if (notes !== undefined) {
        params.push(notes);
        setClauses.push(`notes = $${params.length}`);
    }

    params.push(id);
    await db.execute(`UPDATE payments SET ${setClauses.join(", ")} WHERE id = $${params.length}`, params);
    return findById(id, db);
}

async function getDashboardStats(conferenceId, db = pool) {
    const [[collected]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM payments
         WHERE conference_id = $1 AND status = 'verified'`,
        [conferenceId]
    );
    const [[pendingVerification]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM payments
         WHERE conference_id = $1 AND status IN ('submitted', 'under_verification')`,
        [conferenceId]
    );
    const [[refunded]] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM refunds WHERE conference_id = $1`,
        [conferenceId]
    );
    const [[outcomes]] = await db.query(
        `SELECT
            COUNT(*) FILTER (WHERE status IN ('verified', 'refunded')) AS verified_count,
            COUNT(*) FILTER (WHERE status IN ('verified', 'failed', 'refunded')) AS decided_count
         FROM payments WHERE conference_id = $1`,
        [conferenceId]
    );
    const [recentTransactions] = await db.query(
        `SELECT p.*, pr.full_name AS delegate_name, fc.name AS fee_category_name
         FROM payments p
         INNER JOIN delegates d ON d.id = p.delegate_id
         JOIN profiles pr ON pr.id = d.profile_id
         LEFT JOIN fee_categories fc ON fc.id = p.fee_category_id
         WHERE p.conference_id = $1
         ORDER BY p.created_at DESC LIMIT 10`,
        [conferenceId]
    );
    const [dailyRevenue] = await db.query(
        `SELECT DATE(payment_date) AS day, COALESCE(SUM(amount), 0) AS total
         FROM payments WHERE conference_id = $1 AND status = 'verified' AND payment_date IS NOT NULL
         GROUP BY DATE(payment_date) ORDER BY day ASC`,
        [conferenceId]
    );

    const decided = Number(outcomes.decided_count) || 0;
    const verified = Number(outcomes.verified_count) || 0;

    return {
        collectedRevenue: Number(collected.total) || 0,
        collectedCount: Number(collected.count) || 0,
        pendingVerification: Number(pendingVerification.total) || 0,
        pendingVerificationCount: Number(pendingVerification.count) || 0,
        refundedAmount: Number(refunded.total) || 0,
        refundedCount: Number(refunded.count) || 0,
        paymentSuccessRate: decided > 0 ? Number((verified / decided).toFixed(2)) : 0,
        recentTransactions,
        dailyRevenue: dailyRevenue.map((row) => ({ day: row.day, total: Number(row.total) }))
    };
}

async function getAnalytics(conferenceId, db = pool) {
    const [byMethod] = await db.query(
        `SELECT method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
         FROM payments WHERE conference_id = $1 AND status = 'verified'
         GROUP BY method`,
        [conferenceId]
    );
    const [byFeeCategory] = await db.query(
        `SELECT fc.id AS fee_category_id, fc.name AS fee_category_name, COALESCE(SUM(p.amount), 0) AS total
         FROM payments p
         INNER JOIN fee_categories fc ON fc.id = p.fee_category_id
         WHERE p.conference_id = $1 AND p.status = 'verified'
         GROUP BY fc.id, fc.name`,
        [conferenceId]
    );
    const [revenueByDate] = await db.query(
        `SELECT DATE(payment_date) AS day, COALESCE(SUM(amount), 0) AS total
         FROM payments WHERE conference_id = $1 AND status = 'verified' AND payment_date IS NOT NULL
         GROUP BY DATE(payment_date) ORDER BY day ASC`,
        [conferenceId]
    );
    const [refundTrends] = await db.query(
        `SELECT DATE(refund_date) AS day, COALESCE(SUM(amount), 0) AS total
         FROM refunds WHERE conference_id = $1
         GROUP BY DATE(refund_date) ORDER BY day ASC`,
        [conferenceId]
    );

    return {
        paymentMethodDistribution: byMethod.map((row) => ({
            method: row.method, count: Number(row.count), total: Number(row.total)
        })),
        revenueByFeeType: byFeeCategory.map((row) => ({
            feeCategoryId: row.fee_category_id, feeCategoryName: row.fee_category_name, total: Number(row.total)
        })),
        revenueByDate: revenueByDate.map((row) => ({ day: row.day, total: Number(row.total) })),
        refundTrends: refundTrends.map((row) => ({ day: row.day, total: Number(row.total) }))
    };
}

module.exports = {
    create, findById, listByConference, listByDelegate, hasVerifiedPayment, updateStatus,
    getDashboardStats, getAnalytics
};
