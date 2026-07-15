const express = require("express");
const agendaController = require("../controllers/agendaController");
const { authenticate, requireRole, requireAgendaAccess } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");

const router = express.Router();
const asOrganizer = [authenticate, requireRole("organizer")];
const MANAGE_COMMITTEE_CONTENT = ["owner", "conference_manager", "committee_director"];
const MANAGE_STRUCTURE = ["owner", "conference_manager"];

router.put(
    "/:id", ...asOrganizer, requireAgendaAccess(...MANAGE_COMMITTEE_CONTENT),
    validateBody(entityValidation.agendaUpdate), agendaController.update
);
router.delete("/:id", ...asOrganizer, requireAgendaAccess(...MANAGE_STRUCTURE), agendaController.remove);

module.exports = router;
