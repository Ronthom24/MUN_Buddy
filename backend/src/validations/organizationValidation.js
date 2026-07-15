const { required, isEmail, isOneOf } = require("./rules");

function update(body) {
    const errors = [];
    if (body.name !== undefined) required(body.name, "name", errors);
    if (body.contactEmail !== undefined && body.contactEmail) isEmail(body.contactEmail, "contactEmail", errors);
    return errors;
}

function createConference(body) {
    const errors = [];
    required(body.conferenceName, "conferenceName", errors);
    required(body.startDate, "startDate", errors);
    required(body.endDate, "endDate", errors);
    required(body.registrationDeadline, "registrationDeadline", errors);
    if (body.committees !== undefined && !Array.isArray(body.committees)) {
        errors.push("committees must be an array");
    }
    return errors;
}

function inviteMember(body) {
    const errors = [];
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    if (body.orgRole !== undefined) isOneOf(body.orgRole, "orgRole", ["owner", "admin", "member"], errors);
    return errors;
}

function updateMember(body) {
    const errors = [];
    if (body.orgRole !== undefined) isOneOf(body.orgRole, "orgRole", ["owner", "admin", "member"], errors);
    if (body.status !== undefined) isOneOf(body.status, "status", ["invited", "active", "revoked"], errors);
    return errors;
}

module.exports = { update, createConference, inviteMember, updateMember };
