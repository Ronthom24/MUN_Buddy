const express = require("express");
const faqController = require("../controllers/faqController");
const { authenticate, requireRole } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const faqValidation = require("../validations/faqValidation");

const router = express.Router();
const asOrganizer = [authenticate, requireRole("organizer")];

router.patch(
    "/:id/answer", ...asOrganizer, faqController.requireFaqAccess,
    validateBody(faqValidation.answer), faqController.answer
);
router.put("/:id", ...asOrganizer, faqController.requireFaqAccess, validateBody(faqValidation.update), faqController.update);
router.delete("/:id", ...asOrganizer, faqController.requireFaqAccess, faqController.remove);

module.exports = router;
