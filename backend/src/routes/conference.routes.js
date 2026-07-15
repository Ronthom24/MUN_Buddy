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
const { authenticate, requireRole, requireConferenceAccess, requirePermission } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");
const feedbackValidation = require("../validations/feedbackValidation");
const organizerAccessValidation = require("../validations/organizerAccessValidation");
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
    "/:id/organizer-access", ...asOrganizer, requireConferenceAccess(...OWNER_ONLY),
    organizerAccessController.list
);
router.post(
    "/:id/organizer-access", ...asOrganizer, requireConferenceAccess(...OWNER_ONLY),
    validateBody(organizerAccessValidation.invite), organizerAccessController.invite
);
router.patch(
    "/:id/organizer-access/:accessId", ...asOrganizer, requireConferenceAccess(...OWNER_ONLY),
    validateBody(organizerAccessValidation.update), organizerAccessController.update
);
router.delete(
    "/:id/organizer-access/:accessId", ...asOrganizer, requireConferenceAccess(...OWNER_ONLY),
    organizerAccessController.remove
);

module.exports = router;
