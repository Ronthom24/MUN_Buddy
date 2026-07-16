const { required, isOneOf } = require("./rules");

const CERTIFICATE_TYPES = ["participation", "award", "workshop_participation", "custom"];

function template(body) {
    const errors = [];
    required(body.name, "name", errors);
    required(body.bodyText, "bodyText", errors);
    isOneOf(body.certificateType, "certificateType", CERTIFICATE_TYPES, errors);
    return errors;
}

function templateUpdate(body) {
    const errors = [];
    if (body.bodyText !== undefined) required(body.bodyText, "bodyText", errors);
    isOneOf(body.certificateType, "certificateType", CERTIFICATE_TYPES, errors);
    return errors;
}

function issue(body) {
    const errors = [];
    required(body.templateId, "templateId", errors);
    isOneOf(body.certificateType, "certificateType", CERTIFICATE_TYPES, errors);
    return errors;
}

function bulkIssue(body) {
    const errors = [];
    required(body.templateId, "templateId", errors);
    if (!Array.isArray(body.delegateIds) || body.delegateIds.length === 0) {
        errors.push("delegateIds must be a non-empty array");
    }
    isOneOf(body.certificateType, "certificateType", CERTIFICATE_TYPES, errors);
    return errors;
}

module.exports = { template, templateUpdate, issue, bulkIssue };
