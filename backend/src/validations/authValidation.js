const { required, isEmail, minLength } = require("./rules");

function organizerRegister(body) {
    const errors = [];

    required(body.fullName, "fullName", errors);
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    if (required(body.password, "password", errors)) minLength(body.password, "password", 6, errors);
    if (body.confirmPassword !== undefined && body.confirmPassword !== body.password) {
        errors.push("confirmPassword must match password");
    }

    required(body.conferenceName, "conferenceName", errors);
    required(body.startDate, "startDate", errors);
    required(body.endDate, "endDate", errors);
    required(body.registrationDeadline, "registrationDeadline", errors);

    if (body.committees !== undefined && !Array.isArray(body.committees)) {
        errors.push("committees must be an array");
    }

    return errors;
}

function organizerLogin(body) {
    const errors = [];
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    required(body.password, "password", errors);
    return errors;
}

function delegateRegister(body) {
    const errors = [];

    required(body.fullName, "fullName", errors);
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    if (required(body.password, "password", errors)) minLength(body.password, "password", 6, errors);
    if (body.confirmPassword !== undefined && body.confirmPassword !== body.password) {
        errors.push("confirmPassword must match password");
    }
    required(body.conferenceId, "conferenceId", errors);

    if (body.committeePreferences !== undefined && !Array.isArray(body.committeePreferences)) {
        errors.push("committeePreferences must be an array");
    }
    if (body.countryPreferences !== undefined && !Array.isArray(body.countryPreferences)) {
        errors.push("countryPreferences must be an array");
    }

    return errors;
}

function delegateLogin(body) {
    const errors = [];
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    required(body.password, "password", errors);
    return errors;
}

function organizerAccessClaim(body) {
    const errors = [];
    required(body.conferenceId, "conferenceId", errors);
    required(body.fullName, "fullName", errors);
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    if (required(body.password, "password", errors)) minLength(body.password, "password", 6, errors);
    if (body.confirmPassword !== undefined && body.confirmPassword !== body.password) {
        errors.push("confirmPassword must match password");
    }
    return errors;
}

function passwordResetRequest(body) {
    const errors = [];
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    return errors;
}

function passwordResetConfirm(body) {
    const errors = [];
    required(body.token, "token", errors);
    if (required(body.newPassword, "newPassword", errors)) minLength(body.newPassword, "newPassword", 6, errors);
    return errors;
}

module.exports = {
    organizerRegister, organizerLogin, delegateRegister, delegateLogin,
    organizerAccessClaim, passwordResetRequest, passwordResetConfirm
};
