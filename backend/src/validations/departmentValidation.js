const { required } = require("./rules");

function create(body) {
    const errors = [];
    required(body.name, "name", errors);
    return errors;
}

function update() {
    return [];
}

module.exports = { create, update };
