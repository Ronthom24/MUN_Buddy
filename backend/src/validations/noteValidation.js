const { required } = require("./rules");

function create(body) {
    const errors = [];
    required(body.title, "title", errors);
    return errors;
}

function update(body) {
    const errors = [];
    if (body.title === undefined && body.content === undefined && body.tags === undefined) {
        errors.push("At least one of title, content, or tags is required");
    }
    return errors;
}

module.exports = { create, update };
