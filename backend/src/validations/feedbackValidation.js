const { required, isOneOf } = require("./rules");

function create(body) {
    const errors = [];
    required(body.comments, "comments", errors);
    isOneOf(body.category, "category", ["general", "committee", "logistics", "other"], errors);

    if (body.rating !== undefined && body.rating !== null) {
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            errors.push("rating must be an integer between 1 and 5");
        }
    }

    return errors;
}

module.exports = { create };
