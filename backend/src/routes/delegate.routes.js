const express = require("express");
const delegateController = require("../controllers/delegateController");
const { authenticate, requireRole, requireDelegateOwnership } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");

const router = express.Router();

router.get("/me", authenticate, requireRole("delegate"), delegateController.me);
router.get("/me/resources", authenticate, requireRole("delegate"), delegateController.myResources);
router.patch(
    "/:id/status", authenticate, requireRole("organizer"), requireDelegateOwnership,
    validateBody(entityValidation.delegateStatus), delegateController.updateStatus
);

module.exports = router;
