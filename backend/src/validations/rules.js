const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function required(value, field, errors) {
    if (value === undefined || value === null || String(value).trim() === "") {
        errors.push(`${field} is required`);
        return false;
    }
    return true;
}

function isEmail(value, field, errors) {
    if (value && !EMAIL_RE.test(value)) {
        errors.push(`${field} must be a valid email address`);
    }
}

function minLength(value, field, min, errors) {
    if (value && String(value).length < min) {
        errors.push(`${field} must be at least ${min} characters`);
    }
}

function isOneOf(value, field, allowed, errors) {
    if (value !== undefined && value !== null && !allowed.includes(value)) {
        errors.push(`${field} must be one of: ${allowed.join(", ")}`);
    }
}

module.exports = { required, isEmail, minLength, isOneOf };
