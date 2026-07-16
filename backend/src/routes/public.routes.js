const express = require("express");
const publicController = require("../controllers/publicController");

const router = express.Router();

router.get("/organizations", publicController.listOrganizations);
router.get("/organizations/:slug", publicController.getOrganization);
router.get("/conferences", publicController.listConferences);
router.get("/conferences/:slug", publicController.getConference);
router.get("/resources/:resourceId/download", publicController.downloadResource);

module.exports = router;
