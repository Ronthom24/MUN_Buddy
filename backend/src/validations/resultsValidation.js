const { required } = require("./rules");

function award(body) {
    const errors = [];
    required(body.delegateId, "delegateId", errors);
    required(body.category, "category", errors);
    return errors;
}

function awardUpdate(body) {
    const errors = [];
    if (body.category !== undefined) required(body.category, "category", errors);
    return errors;
}

module.exports = { award, awardUpdate };
