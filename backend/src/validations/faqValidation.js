const { required, isOneOf } = require("./rules");

const CATEGORIES = [
    "registration", "committees", "venue", "accommodation",
    "certificates", "payments", "schedule", "resources", "general"
];
const STATUSES = ["pending", "answered", "published", "archived"];

function ask(body) {
    const errors = [];
    required(body.question, "question", errors);
    isOneOf(body.category, "category", CATEGORIES, errors);
    return errors;
}

function answer(body) {
    const errors = [];
    required(body.answer, "answer", errors);
    isOneOf(body.status, "status", STATUSES, errors);
    return errors;
}

function update(body) {
    const errors = [];
    isOneOf(body.category, "category", CATEGORIES, errors);
    isOneOf(body.status, "status", STATUSES, errors);
    return errors;
}

module.exports = { ask, answer, update };
