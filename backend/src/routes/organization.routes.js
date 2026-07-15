const express = require("express");
const organizationController = require("../controllers/organizationController");
const organizationMemberController = require("../controllers/organizationMemberController");
const { authenticate, requireRole, requireOrganizationAccess } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const organizationValidation = require("../validations/organizationValidation");

const router = express.Router();
const asOrganizer = [authenticate, requireRole("organizer")];

const ANY_MEMBER = ["owner", "admin", "member"];
const MANAGE = ["owner", "admin"];
const OWNER_ONLY = ["owner"];

router.get("/me", ...asOrganizer, organizationController.listMine);

router.get("/:id", ...asOrganizer, requireOrganizationAccess(...ANY_MEMBER), organizationController.getOne);
router.put(
    "/:id", ...asOrganizer, requireOrganizationAccess(...MANAGE),
    validateBody(organizationValidation.update), organizationController.update
);
router.get("/:id/stats", ...asOrganizer, requireOrganizationAccess(...ANY_MEMBER), organizationController.stats);

router.get("/:id/conferences", ...asOrganizer, requireOrganizationAccess(...ANY_MEMBER), organizationController.listConferences);
router.post(
    "/:id/conferences", ...asOrganizer, requireOrganizationAccess(...MANAGE),
    validateBody(organizationValidation.createConference), organizationController.createConference
);

router.get("/:id/members", ...asOrganizer, requireOrganizationAccess(...MANAGE), organizationMemberController.list);
router.post(
    "/:id/members", ...asOrganizer, requireOrganizationAccess(...OWNER_ONLY),
    validateBody(organizationValidation.inviteMember), organizationMemberController.invite
);
router.patch(
    "/:id/members/:memberId", ...asOrganizer, requireOrganizationAccess(...OWNER_ONLY),
    validateBody(organizationValidation.updateMember), organizationMemberController.update
);
router.delete(
    "/:id/members/:memberId", ...asOrganizer, requireOrganizationAccess(...OWNER_ONLY),
    organizationMemberController.remove
);

module.exports = router;
