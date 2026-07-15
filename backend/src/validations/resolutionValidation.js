const { required, isOneOf } = require("./rules");

function create(body) {
    const errors = [];
    required(body.title, "title", errors);
    required(body.body, "body", errors);
    required(body.committeeId, "committeeId", errors);
    return errors;
}

function updateContent(body) {
    const errors = [];
    if (body.title === undefined && body.body === undefined) {
        errors.push("At least one of title or body is required");
    }
    return errors;
}

function updateStatus(body) {
    const errors = [];
    required(body.status, "status", errors);
    isOneOf(body.status, "status", ["submitted", "under_review", "passed", "failed"], errors);
    return errors;
}

module.exports = { create, updateContent, updateStatus };
