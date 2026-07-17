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

const SPECIAL_CHAR_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/** Minimum 6 characters, at least 1 number, at least 1 special character. */
function strongPassword(value, field, errors) {
    if (!value) return;
    if (String(value).length < 6) {
        errors.push(`${field} must be at least 6 characters`);
    }
    if (!/\d/.test(value)) {
        errors.push(`${field} must contain at least one number`);
    }
    if (!SPECIAL_CHAR_RE.test(value)) {
        errors.push(`${field} must contain at least one special character`);
    }
}

module.exports = { required, isEmail, minLength, isOneOf, strongPassword };
