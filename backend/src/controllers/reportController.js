const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const reportService = require("../services/reportService");
const { toCsv, toExcel, toPdf } = require("../utils/tableExport");
const auditLogService = require("../services/auditLogService");

const exportReport = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const format = (req.query.format || "pdf").toLowerCase();
    const report = await reportService.build(type, req.conference.id);

    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "report.export",
        resourceType: "report", newValue: { type, format }
    });

    const filenameBase = `${type}-report-${req.conference.id}`;

    if (format === "csv") {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.csv"`);
        res.send(toCsv(report));
        return;
    }

    if (format === "excel" || format === "xlsx") {
        const buffer = await toExcel(report);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.xlsx"`);
        res.send(buffer);
        return;
    }

    if (format === "pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filenameBase}.pdf"`);
        toPdf(report, res);
        return;
    }

    throw new ApiError(400, `Unsupported export format "${format}"`);
});

module.exports = { exportReport };
