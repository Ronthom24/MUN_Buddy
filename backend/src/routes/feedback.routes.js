const express = require("express");
const feedbackController = require("../controllers/feedbackController");
const { authenticate, requireRole, requireFeedbackOwnership } = require("../middleware/auth");

const router = express.Router();

router.delete(
    "/:id", authenticate, requireRole("organizer"), requireFeedbackOwnership, feedbackController.remove
);

module.exports = router;
