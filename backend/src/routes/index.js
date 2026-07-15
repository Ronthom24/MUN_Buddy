const express = require("express");

const authRoutes = require("./auth.routes");
const conferenceRoutes = require("./conference.routes");
const committeeRoutes = require("./committee.routes");
const agendaRoutes = require("./agenda.routes");
const portfolioRoutes = require("./portfolio.routes");
const delegateRoutes = require("./delegate.routes");
const resourceRoutes = require("./resource.routes");
const announcementRoutes = require("./announcement.routes");
const resolutionRoutes = require("./resolution.routes");
const noteRoutes = require("./note.routes");
const feedbackRoutes = require("./feedback.routes");
const documentRoutes = require("./document.routes");

const router = express.Router();

router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "MUN Buddy Backend is running! 🚀",
        version: "1.0.0"
    });
});

router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "Healthy"
    });
});

router.use("/api/auth", authRoutes);
router.use("/api/conferences", conferenceRoutes);
router.use("/api/committees", committeeRoutes);
router.use("/api/agendas", agendaRoutes);
router.use("/api/portfolios", portfolioRoutes);
router.use("/api/delegates", delegateRoutes);
router.use("/api/resources", resourceRoutes);
router.use("/api/announcements", announcementRoutes);
router.use("/api/resolutions", resolutionRoutes);
router.use("/api/notes", noteRoutes);
router.use("/api/feedback", feedbackRoutes);
router.use("/api/documents", documentRoutes);

module.exports = router;