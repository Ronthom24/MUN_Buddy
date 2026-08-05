const express = require("express");
const controller = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimit");
const validateBody = require("../middleware/validate");
const authValidation = require("../validations/authValidation");

const router = express.Router();

router.post(
    "/organizer/register", authLimiter, validateBody(authValidation.organizerRegister), controller.organizerRegister
);
router.post("/organizer/login", authLimiter, validateBody(authValidation.organizerLogin), controller.organizerLogin);
router.post(
    "/delegate/register", authLimiter, validateBody(authValidation.delegateRegister), controller.delegateRegister
);
router.post("/delegate/login", authLimiter, validateBody(authValidation.delegateLogin), controller.delegateLogin);

router.post(
    "/organizer-access/claim", authLimiter,
    validateBody(authValidation.organizerAccessClaim),
    controller.organizerAccessClaim
);

router.post(
    "/password-reset/request", authLimiter,
    validateBody(authValidation.passwordResetRequest),
    controller.passwordResetRequest
);
// Password reset confirmation and email verification are handled by Supabase
// Auth directly on the frontend now (supabase.auth.updateUser / the emailed
// confirmation link) -- no backend confirm step needed, see authService.js.

router.get("/me/login-history", authenticate, controller.myLoginHistory);

module.exports = router;
