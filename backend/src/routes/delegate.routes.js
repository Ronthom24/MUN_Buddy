const express = require("express");
const delegateController = require("../controllers/delegateController");
const { authenticate, requireRole, requireDelegateOwnership } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");

const router = express.Router();

router.get("/me", authenticate, requireRole("delegate"), delegateController.me);
router.put(
    "/me", authenticate, requireRole("delegate"),
    validateBody(entityValidation.delegateProfileUpdate), delegateController.updateMe
);
router.post(
    "/me/change-password", authenticate, requireRole("delegate"),
    validateBody(entityValidation.changePassword), delegateController.changePassword
);
router.get("/me/resources", authenticate, requireRole("delegate"), delegateController.myResources);
router.get("/me/announcements", authenticate, requireRole("delegate"), delegateController.myAnnouncements);
router.get("/me/schedule", authenticate, requireRole("delegate"), delegateController.mySchedule);
router.post("/me/reapply", authenticate, requireRole("delegate"), delegateController.reapply);
router.patch(
    "/:id/status", authenticate, requireRole("organizer"), requireDelegateOwnership,
    validateBody(entityValidation.delegateStatus), delegateController.updateStatus
);

module.exports = router;
