const { required, isOneOf } = require("./rules");

function create(body) {
    const errors = [];
    required(body.title, "title", errors);
    if (required(body.type, "type", errors)) isOneOf(body.type, "type", ["position_paper", "speech"], errors);
    return errors;
}

function update(body) {
    const errors = [];
    isOneOf(body.status, "status", ["draft", "final"], errors);
    if (body.title === undefined && body.content === undefined && body.status === undefined) {
        errors.push("At least one of title, content, or status is required");
    }
    return errors;
}

module.exports = { create, update };
