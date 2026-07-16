const ApiError = require("../utils/ApiError");
const paymentModel = require("../models/paymentModel");
const feeCategoryModel = require("../models/feeCategoryModel");
const refundModel = require("../models/refundModel");
const discountModel = require("../models/discountModel");
const delegateModel = require("../models/delegateModel");
const conferenceModel = require("../models/conferenceModel");

/**
 * A delegate's payment status (spec 18.7) is only partly stored: "Not
 * Required" and "Pending" are derived from the absence of any payment row
 * plus the conference's payment_required flag, since a payment record isn't
 * created until the delegate (or an organizer on their behalf) actually
 * submits one.
 */
function derivePaymentStatus(paymentRequired, latestPayment) {
    if (latestPayment) return latestPayment.status;
    return paymentRequired ? "pending" : "not_required";
}

async function getConfig(conferenceId) {
    const [conference, feeCategories] = await Promise.all([
        conferenceModel.findById(conferenceId),
        feeCategoryModel.listByConference(conferenceId)
    ]);
    return {
        paymentRequired: Boolean(conference.payment_required),
        currency: conference.currency,
        feeCategories
    };
}

async function updateConfig(conferenceId, { paymentRequired, currency }) {
    await conferenceModel.updatePaymentConfig(conferenceId, { paymentRequired, currency });
    return getConfig(conferenceId);
}

async function createFeeCategory(conferenceId, data) {
    return feeCategoryModel.create({ conferenceId, ...data });
}

async function updateFeeCategory(conferenceId, feeCategoryId, data) {
    const feeCategory = await feeCategoryModel.findById(feeCategoryId);
    if (!feeCategory || feeCategory.conference_id !== conferenceId) throw new ApiError(404, "Fee category not found");
    return feeCategoryModel.update(feeCategoryId, data);
}

async function archiveFeeCategory(conferenceId, feeCategoryId) {
    const feeCategory = await feeCategoryModel.findById(feeCategoryId);
    if (!feeCategory || feeCategory.conference_id !== conferenceId) throw new ApiError(404, "Fee category not found");
    return feeCategoryModel.archive(feeCategoryId);
}

async function getDashboard(conferenceId) {
    const [stats, requiredFeeTotal, discountTotal, approvedDelegates] = await Promise.all([
        paymentModel.getDashboardStats(conferenceId),
        feeCategoryModel.sumRequiredAmount(conferenceId),
        discountModel.sumForConference(conferenceId),
        delegateModel.listByConference(conferenceId, { status: "approved" })
    ]);

    const expectedRevenue = Math.max(requiredFeeTotal * approvedDelegates.length - discountTotal, 0);
    const totalRevenue = Math.max(stats.collectedRevenue - stats.refundedAmount, 0);

    return {
        totalRevenue,
        expectedRevenue,
        collectedRevenue: stats.collectedRevenue,
        outstandingPayments: Math.max(expectedRevenue - stats.collectedRevenue, 0),
        pendingVerification: stats.pendingVerification,
        pendingVerificationCount: stats.pendingVerificationCount,
        refundedAmount: stats.refundedAmount,
        refundedCount: stats.refundedCount,
        paymentSuccessRate: stats.paymentSuccessRate,
        recentTransactions: stats.recentTransactions,
        dailyRevenue: stats.dailyRevenue
    };
}

async function getAnalytics(conferenceId) {
    const [analytics, dashboard] = await Promise.all([
        paymentModel.getAnalytics(conferenceId),
        getDashboard(conferenceId)
    ]);

    return {
        ...analytics,
        collectionRate: dashboard.expectedRevenue > 0
            ? Number((dashboard.collectedRevenue / dashboard.expectedRevenue).toFixed(2))
            : 0,
        outstandingBalance: dashboard.outstandingPayments
    };
}

async function recordPayment(conferenceId, delegateId, data, createdByAccessId) {
    const delegate = await delegateModel.findById(delegateId);
    if (!delegate || delegate.conference_id !== conferenceId) throw new ApiError(404, "Delegate not found");

    return paymentModel.create({
        conferenceId, delegateId, recordedBy: "organizer", createdByAccessId, ...data
    });
}

async function submitOwnPayment(delegateId, conferenceId, data) {
    return paymentModel.create({
        conferenceId, delegateId, recordedBy: "delegate", status: "submitted", ...data
    });
}

async function verifyPayment(conferenceId, paymentId, status, { verifiedByAccessId, notes }) {
    const payment = await paymentModel.findById(paymentId);
    if (!payment || payment.conference_id !== conferenceId) throw new ApiError(404, "Payment not found");
    if (["refunded", "cancelled"].includes(payment.status)) {
        throw new ApiError(400, `Cannot change status of a ${payment.status} payment`);
    }

    return paymentModel.updateStatus(paymentId, status, { verifiedByAccessId, notes });
}

async function refundPayment(conferenceId, paymentId, { amount, reason, notes, refundDate, approvedByAccessId }) {
    const payment = await paymentModel.findById(paymentId);
    if (!payment || payment.conference_id !== conferenceId) throw new ApiError(404, "Payment not found");
    if (payment.status !== "verified") throw new ApiError(400, "Only verified payments can be refunded");
    if (Number(amount) > Number(payment.amount)) throw new ApiError(400, "Refund amount cannot exceed the original payment amount");

    const refund = await refundModel.create({
        paymentId, conferenceId, amount, reason, notes, refundDate: refundDate || new Date().toISOString().slice(0, 10),
        approvedByAccessId
    });
    await paymentModel.updateStatus(paymentId, "refunded", {});
    return refund;
}

async function applyDiscount(conferenceId, delegateId, data, appliedByAccessId) {
    const delegate = await delegateModel.findById(delegateId);
    if (!delegate || delegate.conference_id !== conferenceId) throw new ApiError(404, "Delegate not found");

    return discountModel.create({ conferenceId, delegateId, appliedByAccessId, ...data });
}

async function getDelegatePaymentSummary(delegateId, conferenceId) {
    const [conference, feeCategories, payments, discounts] = await Promise.all([
        conferenceModel.findById(conferenceId),
        feeCategoryModel.listByConference(conferenceId),
        paymentModel.listByDelegate(delegateId),
        discountModel.listByDelegate(delegateId)
    ]);

    const paymentRequired = Boolean(conference.payment_required);
    return {
        paymentRequired,
        currency: conference.currency,
        feeCategories,
        payments,
        discounts,
        status: derivePaymentStatus(paymentRequired, payments[0] || null)
    };
}

module.exports = {
    getConfig, updateConfig, createFeeCategory, updateFeeCategory, archiveFeeCategory,
    getDashboard, getAnalytics, recordPayment, submitOwnPayment, verifyPayment, refundPayment,
    applyDiscount, getDelegatePaymentSummary
};
