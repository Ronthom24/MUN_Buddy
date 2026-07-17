const express = require("express");
const { platformAuthenticate } = require("../middleware/platformAuth");

const organizationController = require("../controllers/platformOrganizationController");
const conferenceController = require("../controllers/platformConferenceController");
const adminViewController = require("../controllers/platformAdminViewController");
const userController = require("../controllers/platformUserController");
const auditController = require("../controllers/platformAuditController");
const analyticsController = require("../controllers/platformAnalyticsController");
const settingsController = require("../controllers/platformSettingsController");

const router = express.Router();

router.use(platformAuthenticate);

router.get("/dashboard", analyticsController.dashboard);
router.get("/analytics", analyticsController.analytics);

router.get("/organizations", organizationController.list);
router.get("/organizations/:id", organizationController.detail);
router.patch("/organizations/:id/status", organizationController.setStatus);
router.delete("/organizations/:id", organizationController.remove);

router.get("/conferences", conferenceController.list);
router.get("/conferences/:id", conferenceController.detail);
router.patch("/conferences/:id/archive", conferenceController.archive);
router.patch("/conferences/:id/disabled", conferenceController.setDisabled);
router.post("/conferences/:id/admin-view", adminViewController.mintAdminView);

router.get("/users", userController.list);
router.patch("/users/:type/:id/suspend", userController.suspend);
router.patch("/users/:type/:id/activate", userController.activate);
router.post("/users/:type/:id/force-logout", userController.forceLogout);

router.get("/audit-logs", auditController.listAuditLogs);
router.get("/login-history", auditController.listLoginHistory);
router.get("/security/suspicious-activity", auditController.suspiciousActivity);

router.get("/settings", settingsController.getSettings);
router.put("/settings", settingsController.updateSettings);

module.exports = router;
