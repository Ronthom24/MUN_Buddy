function checkIn(body) {
    const errors = [];
    if (!body.delegateId && !body.token) {
        errors.push("Either delegateId or token is required");
    }
    return errors;
}

module.exports = { checkIn };
