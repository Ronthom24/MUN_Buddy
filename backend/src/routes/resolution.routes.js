const express = require("express");
const resolutionController = require("../controllers/resolutionController");
const {
    authenticate, requireRole, requireOwnResolution, requireResolutionOwnership
} = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const resolutionValidation = require("../validations/resolutionValidation");

const router = express.Router();

router.post(
    "/", authenticate, requireRole("delegate"),
    validateBody(resolutionValidation.create), resolutionController.create
);
router.get("/mine", authenticate, requireRole("delegate"), resolutionController.listMine);

router.put(
    "/:id", authenticate, requireRole("delegate"), requireOwnResolution,
    validateBody(resolutionValidation.updateContent), resolutionController.updateContent
);
router.patch(
    "/:id/submit", authenticate, requireRole("delegate"), requireOwnResolution,
    resolutionController.submit
);

router.patch(
    "/:id/status", authenticate, requireRole("organizer"), requireResolutionOwnership,
    validateBody(resolutionValidation.updateStatus), resolutionController.updateStatus
);

router.delete("/:id", authenticate, requireRole("delegate", "organizer"), resolutionController.remove);

module.exports = router;
