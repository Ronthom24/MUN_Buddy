const { required, isOneOf } = require("./rules");

function create(body) {
    const errors = [];
    required(body.subject, "subject", errors);
    required(body.body, "body", errors);
    isOneOf(body.audience, "audience", ["all", "approved", "committee", "waitlisted", "rejected"], errors);
    if (body.audience === "committee") required(body.committeeId, "committeeId", errors);
    return errors;
}

function template(body) {
    const errors = [];
    required(body.name, "name", errors);
    required(body.subject, "subject", errors);
    required(body.body, "body", errors);
    return errors;
}

module.exports = { create, template };
