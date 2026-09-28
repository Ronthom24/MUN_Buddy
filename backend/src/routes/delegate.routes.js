const express = require("express");
const delegateController = require("../controllers/delegateController");
const paymentController = require("../controllers/paymentController");
const resultsController = require("../controllers/resultsController");
const certificateController = require("../controllers/certificateController");
const attendanceController = require("../controllers/attendanceController");
const faqController = require("../controllers/faqController");
const { authenticate, requireRole, requireDelegateOwnership } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");
const paymentValidation = require("../validations/paymentValidation");
const faqValidation = require("../validations/faqValidation");

const router = express.Router();

router.get("/me", authenticate, requireRole("delegate"), delegateController.me);
router.get("/me/payment", authenticate, requireRole("delegate"), paymentController.myPaymentSummary);
router.post(
    "/me/payment", authenticate, requireRole("delegate"),
    validateBody(paymentValidation.paymentRecord), paymentController.submitMyPayment
);
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
router.get("/me/committee-roster", authenticate, requireRole("delegate"), delegateController.myCommitteeRoster);
router.get("/me/results", authenticate, requireRole("delegate"), resultsController.myResults);
router.get("/me/certificates", authenticate, requireRole("delegate"), certificateController.myCertificates);
router.get("/me/checkin-token", authenticate, requireRole("delegate"), attendanceController.myCheckinToken);
router.post("/me/reapply", authenticate, requireRole("delegate"), delegateController.reapply);
router.get("/me/faqs", authenticate, requireRole("delegate"), faqController.myQuestions);
router.post(
    "/me/faqs", authenticate, requireRole("delegate"),
    validateBody(faqValidation.ask), faqController.ask
);
router.patch(
    "/:id/status", authenticate, requireRole("organizer"), requireDelegateOwnership,
    validateBody(entityValidation.delegateStatus), delegateController.updateStatus
);

module.exports = router;
