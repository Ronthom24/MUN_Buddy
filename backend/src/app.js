const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const indexRoutes = require("./routes");

const app = express();

// Security
app.use(helmet());

// Enable CORS
app.use(cors());

// Logging
app.use(morgan("dev"));

// Parse JSON requests
app.use(express.json());

// Parse URL encoded requests
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", indexRoutes);

module.exports = app;