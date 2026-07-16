const express = require("express");
const certificateController = require("../controllers/certificateController");
const { authenticate, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/verify/:certificateNumber", certificateController.verify);
router.get("/:id/pdf", authenticate, requireRole("organizer", "delegate"), certificateController.downloadPdf);

module.exports = router;
