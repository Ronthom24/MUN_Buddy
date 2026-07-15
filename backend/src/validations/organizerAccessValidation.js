const { required, isEmail, isOneOf } = require("./rules");

const ROLES = ["conference_manager", "organizer", "committee_director"];

function invite(body) {
    const errors = [];
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    if (required(body.role, "role", errors)) isOneOf(body.role, "role", ROLES, errors);
    if (body.role === "committee_director") {
        required(body.committeeId, "committeeId", errors);
    }
    return errors;
}

function update(body) {
    const errors = [];
    isOneOf(body.role, "role", ROLES, errors);
    if (body.role === "committee_director" && body.committeeId === undefined) {
        errors.push("committeeId is required when role is committee_director");
    }
    return errors;
}

module.exports = { invite, update };
