const express = require("express");
const controller = require("../controllers/platformAuthController");
const { platformAuthenticate } = require("../middleware/platformAuth");
const { authLimiter } = require("../middleware/rateLimit");
const validateBody = require("../middleware/validate");
const platformValidation = require("../validations/platformValidation");

const router = express.Router();

router.post("/login", authLimiter, validateBody(platformValidation.login), controller.login);
router.get("/me", platformAuthenticate, controller.me);

module.exports = router;
