const asyncHandler = require("../utils/asyncHandler");
const pool = require("../config/database");
const loginHistoryModel = require("../models/loginHistoryModel");

const listAuditLogs = asyncHandler(async (req, res) => {
    const clauses = [];
    const params = [];
    if (req.query.actorType) {
        clauses.push("actor_type = ?");
        params.push(req.query.actorType);
    }
    if (req.query.resourceType) {
        clauses.push("resource_type = ?");
        params.push(req.query.resourceType);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    params.push(limit);

    const [rows] = await pool.query(
        `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ?`,
        params
    );
    res.status(200).json({ success: true, logs: rows });
});

const listLoginHistory = asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const success = req.query.success === undefined ? undefined : req.query.success === "true";
    const history = await loginHistoryModel.listRecent({ limit, success });
    res.status(200).json({ success: true, history });
});

const suspiciousActivity = asyncHandler(async (req, res) => {
    const emails = await loginHistoryModel.listSuspiciousEmails({});
    res.status(200).json({ success: true, emails });
});

module.exports = { listAuditLogs, listLoginHistory, suspiciousActivity };
