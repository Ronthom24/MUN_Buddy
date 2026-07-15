const express = require("express");
const announcementController = require("../controllers/announcementController");
const { authenticate, requireRole, requireAnnouncementOwnership } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");

const router = express.Router();

router.put(
    "/:id", authenticate, requireRole("organizer"), requireAnnouncementOwnership,
    validateBody(entityValidation.announcementUpdate), announcementController.update
);
router.delete(
    "/:id", authenticate, requireRole("organizer"), requireAnnouncementOwnership, announcementController.remove
);

module.exports = router;
