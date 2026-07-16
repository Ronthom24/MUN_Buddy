const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const indexRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimit");

const app = express();

// Security
app.use(helmet());
app.set("trust proxy", 1);
app.use("/api", generalLimiter);

// Enable CORS
app.use(cors());

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