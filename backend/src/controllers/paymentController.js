const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/paymentService");
const paymentModel = require("../models/paymentModel");
const refundModel = require("../models/refundModel");
const discountModel = require("../models/discountModel");
const notificationService = require("../services/notificationService");

const getConfig = asyncHandler(async (req, res) => {
    const config = await paymentService.getConfig(req.conference.id);
    res.status(200).json({ success: true, config });
});

const updateConfig = asyncHandler(async (req, res) => {
    const config = await paymentService.updateConfig(req.conference.id, req.body);
    res.status(200).json({ success: true, config });
});

const createFeeCategory = asyncHandler(async (req, res) => {
    const feeCategory = await paymentService.createFeeCategory(req.conference.id, req.body);
    res.status(201).json({ success: true, feeCategory });
});

const updateFeeCategory = asyncHandler(async (req, res) => {
    const feeCategory = await paymentService.updateFeeCategory(req.conference.id, Number(req.params.feeCategoryId), req.body);
    res.status(200).json({ success: true, feeCategory });
});

const archiveFeeCategory = asyncHandler(async (req, res) => {
    const feeCategory = await paymentService.archiveFeeCategory(req.conference.id, Number(req.params.feeCategoryId));
    res.status(200).json({ success: true, feeCategory });
});

const listPayments = asyncHandler(async (req, res) => {
    const { status, method } = req.query;
    const payments = await paymentModel.listByConference(req.conference.id, { status, method });
    res.status(200).json({ success: true, payments });
});

const recordPayment = asyncHandler(async (req, res) => {
    const delegateId = Number(req.params.delegateId);
    const payment = await paymentService.recordPayment(req.conference.id, delegateId, req.body, req.access.id);
    res.status(201).json({ success: true, payment });
});

const verifyPayment = asyncHandler(async (req, res) => {
    const paymentId = Number(req.params.paymentId);
    const payment = await paymentService.verifyPayment(req.conference.id, paymentId, req.body.status, {
        verifiedByAccessId: req.access.id, notes: req.body.notes
    });

    if (payment.status === "verified") {
        await notificationService.notify({
            conferenceId: req.conference.id,
            recipientType: "delegate",
            recipientId: payment.delegate_id,
            type: "success",
            title: "Payment verified",
            message: "Your payment has been verified.",
            link: "/delegate/payment"
        });
    }

    res.status(200).json({ success: true, payment });
});

const refundPayment = asyncHandler(async (req, res) => {
    const paymentId = Number(req.params.paymentId);
    const refund = await paymentService.refundPayment(req.conference.id, paymentId, {
        ...req.body, approvedByAccessId: req.access.id
    });
    res.status(201).json({ success: true, refund });
});

const listRefunds = asyncHandler(async (req, res) => {
    const refunds = await refundModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, refunds });
});

const getDashboard = asyncHandler(async (req, res) => {
    const dashboard = await paymentService.getDashboard(req.conference.id);
    res.status(200).json({ success: true, dashboard });
});

const getAnalytics = asyncHandler(async (req, res) => {
    const analytics = await paymentService.getAnalytics(req.conference.id);
    res.status(200).json({ success: true, analytics });
});

const listDiscounts = asyncHandler(async (req, res) => {
    const discounts = await discountModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, discounts });
});

const applyDiscount = asyncHandler(async (req, res) => {
    const delegateId = Number(req.params.delegateId);
    const discount = await paymentService.applyDiscount(req.conference.id, delegateId, req.body, req.access.id);
    res.status(201).json({ success: true, discount });
});

const myPaymentSummary = asyncHandler(async (req, res) => {
    const summary = await paymentService.getDelegatePaymentSummary(req.user.id, req.user.conferenceId);
    res.status(200).json({ success: true, ...summary });
});

const submitMyPayment = asyncHandler(async (req, res) => {
    const payment = await paymentService.submitOwnPayment(req.user.id, req.user.conferenceId, req.body);
    res.status(201).json({ success: true, payment });
});

module.exports = {
    getConfig, updateConfig, createFeeCategory, updateFeeCategory, archiveFeeCategory,
    listPayments, recordPayment, verifyPayment, refundPayment, listRefunds,
    getDashboard, getAnalytics, listDiscounts, applyDiscount, myPaymentSummary, submitMyPayment
};
