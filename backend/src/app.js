const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const indexRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimit");
const { maintenanceMode } = require("./middleware/maintenanceMode");
const ApiError = require("./utils/ApiError");

const app = express();

// Security
app.use(helmet());
app.set("trust proxy", 1);
app.use("/api", generalLimiter);
app.use(maintenanceMode);

// Enable CORS -- restricted to known frontend origins. CORS_ORIGINS
// overrides with a comma-separated list; otherwise falls back to
// FRONTEND_URL alone. Auth is Bearer-token-based (no cookies), so
// credentials don't need to be enabled here.
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new ApiError(403, `Origin ${origin} is not allowed by CORS`));
    }
}));

// Logging
app.use(morgan("dev"));

// Parse JSON requests
app.use(express.json());

// Parse URL encoded requests
app.use(express.urlencoded({ extended: true }));

// Static file access for uploaded resources
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/", indexRoutes);

// 404 + centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;