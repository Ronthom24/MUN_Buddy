const ApiError = require("../utils/ApiError");

function validateBody(validatorFn) {
    return (req, res, next) => {
        const errors = validatorFn(req.body || {});

        if (errors.length > 0) {
            return next(new ApiError(400, "Validation failed", errors));
        }

        next();
    };
}

module.exports = validateBody;
