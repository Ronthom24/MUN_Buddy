const express = require("express");
const notificationController = require("../controllers/notificationController");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();
const asAnyUser = [authenticate, requireRole("organizer", "delegate")];

router.get("/me", ...asAnyUser, notificationController.myNotifications);
router.get("/me/unread-count", ...asAnyUser, notificationController.myUnreadCount);
router.post("/me/read-all", ...asAnyUser, notificationController.markAllRead);
router.patch("/:id/read", ...asAnyUser, notificationController.markRead);
router.get("/me/preferences", ...asAnyUser, notificationController.getPreferences);
router.put("/me/preferences", ...asAnyUser, notificationController.updatePreferences);

module.exports = router;
