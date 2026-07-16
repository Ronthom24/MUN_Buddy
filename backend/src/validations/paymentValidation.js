const { required, isOneOf } = require("./rules");

const METHODS = ["cash", "bank_transfer", "upi", "cheque", "other"];
const VERIFY_STATUSES = ["under_verification", "verified", "failed"];
const DISCOUNT_TYPES = ["early_bird", "institution_discount", "organizer_waiver", "scholarship", "promotional_code", "other"];

function isPositiveAmount(value, field, errors) {
    if (required(value, field, errors)) {
        const num = Number(value);
        if (!Number.isFinite(num) || num <= 0) errors.push(`${field} must be a positive number`);
    }
}

function paymentConfig(body) {
    const errors = [];
    if (body.currency !== undefined && String(body.currency).trim().length !== 3) {
        errors.push("currency must be a 3-letter currency code");
    }
    return errors;
}

function feeCategory(body) {
    const errors = [];
    required(body.name, "name", errors);
    isPositiveAmount(body.amount, "amount", errors);
    return errors;
}

function feeCategoryUpdate(body) {
    const errors = [];
    if (body.amount !== undefined) isPositiveAmount(body.amount, "amount", errors);
    return errors;
}

function paymentRecord(body) {
    const errors = [];
    isPositiveAmount(body.amount, "amount", errors);
    if (required(body.method, "method", errors)) isOneOf(body.method, "method", METHODS, errors);
    return errors;
}

function paymentStatusUpdate(body) {
    const errors = [];
    if (required(body.status, "status", errors)) isOneOf(body.status, "status", VERIFY_STATUSES, errors);
    return errors;
}

function refund(body) {
    const errors = [];
    isPositiveAmount(body.amount, "amount", errors);
    required(body.reason, "reason", errors);
    return errors;
}

function discount(body) {
    const errors = [];
    if (required(body.type, "type", errors)) isOneOf(body.type, "type", DISCOUNT_TYPES, errors);
    isPositiveAmount(body.amount, "amount", errors);
    required(body.reason, "reason", errors);
    return errors;
}

module.exports = { paymentConfig, feeCategory, feeCategoryUpdate, paymentRecord, paymentStatusUpdate, refund, discount };
