const express = require("express");
const resourceController = require("../controllers/resourceController");
const { authenticate, requireRole, requireResourceOwnership } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/:id/download", authenticate, requireRole("organizer", "delegate"), resourceController.download);
router.get("/:id/preview", authenticate, requireRole("organizer", "delegate"), resourceController.preview);

router.put(
    "/:id", authenticate, requireRole("organizer"), requireResourceOwnership,
    validateBody(entityValidation.resourceUpdate), resourceController.update
);
router.delete("/:id", authenticate, requireRole("organizer"), requireResourceOwnership, resourceController.remove);

router.get("/:id/versions", authenticate, requireRole("organizer"), requireResourceOwnership, resourceController.listVersions);
router.post(
    "/:id/versions", authenticate, requireRole("organizer"), requireResourceOwnership, upload.single("file"),
    resourceController.uploadVersion
);

module.exports = router;
