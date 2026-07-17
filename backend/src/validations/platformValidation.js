const { required, isEmail } = require("./rules");

function login(body) {
    const errors = [];
    if (required(body.email, "email", errors)) isEmail(body.email, "email", errors);
    required(body.password, "password", errors);
    return errors;
}

module.exports = { login };
