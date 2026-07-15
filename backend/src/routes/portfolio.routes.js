const express = require("express");
const portfolioController = require("../controllers/portfolioController");
const { authenticate, requireRole, requirePortfolioAccess } = require("../middleware/auth");
const validateBody = require("../middleware/validate");
const entityValidation = require("../validations/entityValidation");

const router = express.Router();
const asOrganizer = [authenticate, requireRole("organizer")];
const MANAGE_COMMITTEE_CONTENT = ["owner", "conference_manager", "committee_director"];

router.put(
    "/:id", ...asOrganizer, requirePortfolioAccess(...MANAGE_COMMITTEE_CONTENT),
    validateBody(entityValidation.portfolioUpdate), portfolioController.update
);
router.delete(
    "/:id", ...asOrganizer, requirePortfolioAccess(...MANAGE_COMMITTEE_CONTENT), portfolioController.remove
);

module.exports = router;
