const express = require("express");
const controller = require("../controllers/authController");
const validateBody = require("../middleware/validate");
const authValidation = require("../validations/authValidation");

const router = express.Router();

router.post("/organizer/register", validateBody(authValidation.organizerRegister), controller.organizerRegister);
router.post("/organizer/login", validateBody(authValidation.organizerLogin), controller.organizerLogin);
router.post("/delegate/register", validateBody(authValidation.delegateRegister), controller.delegateRegister);
router.post("/delegate/login", validateBody(authValidation.delegateLogin), controller.delegateLogin);

router.post(
    "/organizer-access/claim",
    validateBody(authValidation.organizerAccessClaim),
    controller.organizerAccessClaim
);

router.post(
    "/password-reset/request",
    validateBody(authValidation.passwordResetRequest),
    controller.passwordResetRequest
);
router.post(
    "/password-reset/confirm",
    validateBody(authValidation.passwordResetConfirm),
    controller.passwordResetConfirm
);

module.exports = router;
