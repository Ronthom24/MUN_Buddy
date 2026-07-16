const express = require("express");
const conferenceController = require("../controllers/conferenceController");
const committeeController = require("../controllers/committeeController");
const delegateController = require("../controllers/delegateController");
const assignmentController = require("../controllers/assignmentController");
const resourceController = require("../controllers/resourceController");
const announcementController = require("../controllers/announcementController");
const resolutionController = require("../controllers/resolutionController");
const feedbackController = require("../controllers/feedbackController");
const organizerAccessController = require("../controllers/organizerAccessController");
const registrationFormController = require("../controllers/registrationFormController");
const scheduleController = require("../controllers/scheduleController");
const paymentController = require("../controllers/paymentController");
const resultsController = require("../controllers/resultsController");
const certificateController = require("../controllers/certificateController");
const attendanceController = require("../controllers/attendanceController");
const faqController = require("../controllers/faqController");
const broadcastController = require("../controllers/broadcastController");
const departmentController = require("../controllers/departmentController");
const teamController = require("../controllers/teamController");
const trashController = require("../controllers/trashController");
const auditLogController = require("../controllers/auditLogController");
const analyticsController = require("../controllers/analyticsController");
const reportController = require("../controllers/reportController");
const { authenticate, requireRole, requireConferenceAccess, requirePermission } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");
const feedbackValidation = require("../validations/feedbackValidation");
const organizerAccessValidation = require("../validations/organizerAccessValidation");
const paymentValidation = require("../validations/paymentValidation");
const resultsValidation = require("../validations/resultsValidation");
const certificateValidation = require("../validations/certificateValidation");
const attendanceValidation = require("../validations/attendanceValidation");
const faqValidation = require("../validations/faqValidation");
const broadcastValidation = require("../validations/broadcastValidation");
const departmentValidation = require("../validations/departmentValidation");
const upload = require("../middleware/upload");

const router = express.Router();
const asOrganizer = [authenticate, requireRole("organizer")];

// Anyone with any access role on the conference can read; write access varies by route below.
const ALL_ROLES = ["owner", "conference_manager", "organizer", "committee_director"];
const MANAGE_STRUCTURE = ["owner", "conference_manager"];
const OPERATIONAL = ["owner", "conference_manager", "organizer"];
const OWNER_ONLY = ["owner"];
const RESOLUTION_REVIEW = ["owner", "conference_manager", "committee_director"];

router.get("/open", conferenceController.listOpen);
router.get("/me", ...asOrganizer, conferenceController.listMine);

router.get("/:id", ...asOrganizer, requireConferenceAccess(...ALL_ROLES), conferenceController.getOne);
router.put("/:id", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), conferenceController.update);
router.delete("/:id", ...asOrganizer, requireConferenceAccess(...OWNER_ONLY), conferenceController.remove);

router.get("/:id/stats", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), conferenceController.stats);
router.get("/:id/analytics", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), conferenceController.analytics);

router.get("/:id/committees", committeeController.listForConference);
router.post(
    "/:id/committees", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE),
    validateBody(entityValidation.committee), committeeController.create
);

router.get("/:id/delegates", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), delegateController.listForConference);
router.patch(
    "/:id/delegates/bulk-status", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("approve_registrations"),
    validateBody(entityValidation.bulkDelegateStatus), delegateController.bulkUpdateStatus
);
router.get(
    "/:id/registrations/analytics", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_analytics"),
    delegateController.registrationAnalytics
);

router.get("/:id/registration-form", registrationFormController.getForConference);
router.put(
    "/:id/registration-form", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("edit_registration_form"),
    validateBody(entityValidation.registrationForm), registrationFormController.upsert
);

router.get("/:id/assignments", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), assignmentController.listForConference);
router.get(
    "/:id/assignments/analytics", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_analytics"),
    assignmentController.analytics
);
router.put(
    "/:id/assignments/:delegateId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("assign_delegates"),
    validateBody(entityValidation.assignment), assignmentController.assign
);
router.delete(
    "/:id/assignments/:delegateId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("assign_delegates"),
    assignmentController.unassign
);
router.get(
    "/:id/assignments/:delegateId/history", ...asOrganizer, requireConferenceAccess(...OPERATIONAL),
    assignmentController.history
);
router.post(
    "/:id/assignments/bulk", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("assign_delegates"),
    validateBody(entityValidation.bulkAssignment), assignmentController.bulkAssign
);
router.post(
    "/:id/assignments/publish", ...asOrganizer, requireConferenceAccess(...OPERATIONAL),
    assignmentController.publish
);

router.get("/:id/schedule", scheduleController.listForConference);
router.post(
    "/:id/schedule/days", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_schedules"),
    validateBody(entityValidation.scheduleDay), scheduleController.createDay
);
router.delete(
    "/:id/schedule/days/:dayId", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_schedules"),
    scheduleController.removeDay
);
router.post(
    "/:id/schedule/days/:dayId/events", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_schedules"),
    validateBody(entityValidation.scheduleEvent), scheduleController.createEvent
);
router.put(
    "/:id/schedule/events/:eventId", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_schedules"),
    scheduleController.updateEvent
);
router.delete(
    "/:id/schedule/events/:eventId", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_schedules"),
    scheduleController.removeEvent
);

router.get("/:id/resources", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), resourceController.listForConference);
router.post(
    "/:id/resources", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), upload.single("file"),
    validateBody(entityValidation.resource), resourceController.create
);

router.get("/:id/announcements", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), announcementController.listForConference);
router.post(
    "/:id/announcements", ...asOrganizer, requireConferenceAccess(...OPERATIONAL),
    validateBody(entityValidation.announcement), announcementController.create
);

router.get(
    "/:id/resolutions", ...asOrganizer, requireConferenceAccess(...RESOLUTION_REVIEW),
    resolutionController.listForConference
);

router.post(
    "/:id/feedback", authenticate, requireRole("delegate"),
    validateBody(feedbackValidation.create), feedbackController.create
);
router.get("/:id/feedback", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), feedbackController.listForConference);

router.get(
    "/:id/payments/config", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_financials"),
    paymentController.getConfig
);
router.put(
    "/:id/payments/config", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_payments"),
    validateBody(paymentValidation.paymentConfig), paymentController.updateConfig
);

router.post(
    "/:id/fee-categories", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_payments"),
    validateBody(paymentValidation.feeCategory), paymentController.createFeeCategory
);
router.put(
    "/:id/fee-categories/:feeCategoryId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_payments"),
    validateBody(paymentValidation.feeCategoryUpdate), paymentController.updateFeeCategory
);
router.delete(
    "/:id/fee-categories/:feeCategoryId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_payments"),
    paymentController.archiveFeeCategory
);

router.get(
    "/:id/payments", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_financials"),
    paymentController.listPayments
);
router.get(
    "/:id/payments/dashboard", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_financials"),
    paymentController.getDashboard
);
router.get(
    "/:id/payments/analytics", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_financials"),
    paymentController.getAnalytics
);
router.post(
    "/:id/delegates/:delegateId/payments", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_payments"),
    validateBody(paymentValidation.paymentRecord), paymentController.recordPayment
);
router.patch(
    "/:id/payments/:paymentId/verify", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("verify_payments"),
    validateBody(paymentValidation.paymentStatusUpdate), paymentController.verifyPayment
);
router.post(
    "/:id/payments/:paymentId/refund", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_payments"),
    validateBody(paymentValidation.refund), paymentController.refundPayment
);

router.get(
    "/:id/refunds", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_financials"),
    paymentController.listRefunds
);

router.get(
    "/:id/discounts", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_financials"),
    paymentController.listDiscounts
);
router.post(
    "/:id/delegates/:delegateId/discounts", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_payments"),
    validateBody(paymentValidation.discount), paymentController.applyDiscount
);

router.get(
    "/:id/awards", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    resultsController.listAwards
);
router.post(
    "/:id/awards", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    validateBody(resultsValidation.award), resultsController.createAward
);
router.put(
    "/:id/awards/:awardId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    validateBody(resultsValidation.awardUpdate), resultsController.updateAward
);
router.delete(
    "/:id/awards/:awardId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    resultsController.removeAward
);
router.post(
    "/:id/results/publish", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    resultsController.publish
);

router.get(
    "/:id/certificate-templates", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    certificateController.listTemplatesForConference
);
router.get(
    "/:id/certificates", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    certificateController.listCertificates
);
router.get(
    "/:id/certificates/stats", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    certificateController.certificateStats
);
router.post(
    "/:id/delegates/:delegateId/certificates", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    validateBody(certificateValidation.issue), certificateController.issueCertificate
);
router.post(
    "/:id/certificates/bulk", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_certificates"),
    validateBody(certificateValidation.bulkIssue), certificateController.bulkIssue
);

router.get(
    "/:id/schedule/events/:eventId/attendance", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_attendance"),
    attendanceController.getRoster
);
router.post(
    "/:id/schedule/events/:eventId/attendance/check-in", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_attendance"),
    validateBody(attendanceValidation.checkIn), attendanceController.checkIn
);
router.delete(
    "/:id/schedule/events/:eventId/attendance/:delegateId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_attendance"),
    attendanceController.undoCheckIn
);
router.get(
    "/:id/attendance/analytics", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_attendance"),
    attendanceController.analytics
);

router.get(
    "/:id/organizer-access", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_team"),
    organizerAccessController.list
);
router.post(
    "/:id/organizer-access", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_team"),
    validateBody(organizerAccessValidation.invite), organizerAccessController.invite
);
router.patch(
    "/:id/organizer-access/:accessId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_team"),
    validateBody(organizerAccessValidation.update), organizerAccessController.update
);
router.delete(
    "/:id/organizer-access/:accessId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_team"),
    organizerAccessController.remove
);

// ---- Communication Center: FAQs ----
router.get("/:id/faqs", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), faqController.listForConference);
router.get(
    "/:id/faqs/published", faqController.listPublished
);

// ---- Communication Center: Email Broadcasts ----
router.get(
    "/:id/broadcasts", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("send_broadcasts"),
    broadcastController.listForConference
);
router.post(
    "/:id/broadcasts", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("send_broadcasts"),
    validateBody(broadcastValidation.create), broadcastController.create
);
router.post(
    "/:id/broadcasts/:broadcastId/send", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("send_broadcasts"),
    broadcastController.send
);
router.get(
    "/:id/broadcasts/:broadcastId/recipients", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("send_broadcasts"),
    broadcastController.recipients
);

// ---- Team Center: Departments ----
router.get(
    "/:id/departments", ...asOrganizer, requireConferenceAccess(...OPERATIONAL),
    departmentController.listForConference
);
router.post(
    "/:id/departments", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_team"),
    validateBody(departmentValidation.create), departmentController.create
);
router.put(
    "/:id/departments/:departmentId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_team"),
    validateBody(departmentValidation.update), departmentController.update
);
router.delete(
    "/:id/departments/:departmentId", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("manage_team"),
    departmentController.remove
);

// ---- Team Center: dashboard + activity feed ----
router.get(
    "/:id/team/dashboard", ...asOrganizer, requireConferenceAccess(...OPERATIONAL),
    teamController.dashboard
);
router.get(
    "/:id/team/activity", ...asOrganizer, requireConferenceAccess(...OPERATIONAL),
    teamController.activity
);

// ---- Security & Audit (Phase 8) ----
router.get(
    "/:id/audit-log", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_team"),
    auditLogController.list
);
router.get(
    "/:id/trash", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_team"),
    trashController.list
);
router.post(
    "/:id/trash/:type/:itemId/restore", ...asOrganizer, requireConferenceAccess(...MANAGE_STRUCTURE), requirePermission("manage_team"),
    trashController.restore
);

// ---- Analytics & Intelligence Center (Phase 8) ----
router.get(
    "/:id/analytics/overview", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("view_analytics"),
    analyticsController.overview
);
router.get(
    "/:id/reports/:type/export", ...asOrganizer, requireConferenceAccess(...OPERATIONAL), requirePermission("export_reports"),
    reportController.exportReport
);

module.exports = router;
