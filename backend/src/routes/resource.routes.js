const express = require("express");
const resourceController = require("../controllers/resourceController");
const { authenticate, requireRole, requireResourceOwnership } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");

const router = express.Router();

router.get("/:id/download", authenticate, requireRole("organizer", "delegate"), resourceController.download);

router.put(
    "/:id", authenticate, requireRole("organizer"), requireResourceOwnership,
    validateBody(entityValidation.resourceUpdate), resourceController.update
);
router.delete("/:id", authenticate, requireRole("organizer"), requireResourceOwnership, resourceController.remove);

module.exports = router;
