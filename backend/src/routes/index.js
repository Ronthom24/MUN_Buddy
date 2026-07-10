const express = require("express");

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

module.exports = router;