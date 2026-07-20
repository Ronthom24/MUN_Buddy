const express = require("express");
const committeeController = require("../controllers/committeeController");
const agendaController = require("../controllers/agendaController");
const portfolioController = require("../controllers/portfolioController");
const { authenticate, requireRole, requireCommitteeAccess } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");

const router = express.Router();
const asOrganizer = [authenticate, requireRole("organizer")];

const MANAGE_STRUCTURE = ["owner", "conference_manager", "admin"];
const MANAGE_COMMITTEE_CONTENT = ["owner", "conference_manager", "admin", "committee_director"];

router.get("/:id", committeeController.getOne);
router.get("/:id/stats", committeeController.stats);
router.put(
    "/:id", ...asOrganizer, requireCommitteeAccess(...MANAGE_COMMITTEE_CONTENT),
    validateBody(entityValidation.committeeUpdate), committeeController.update
);
router.delete("/:id", ...asOrganizer, requireCommitteeAccess(...MANAGE_STRUCTURE), committeeController.remove);

router.get("/:id/agenda", agendaController.listForCommittee);
router.post(
    "/:id/agenda", ...asOrganizer, requireCommitteeAccess(...MANAGE_COMMITTEE_CONTENT),
    validateBody(entityValidation.agenda), agendaController.create
);

router.get("/:id/portfolios", portfolioController.listForCommittee);
router.post(
    "/:id/portfolios", ...asOrganizer, requireCommitteeAccess(...MANAGE_COMMITTEE_CONTENT),
    validateBody(entityValidation.portfolio), portfolioController.create
);

module.exports = router;
