const ApiError = require("../utils/ApiError");
const delegateModel = require("../models/delegateModel");
const committeeModel = require("../models/committeeModel");
const assignmentModel = require("../models/assignmentModel");
const paymentModel = require("../models/paymentModel");
const attendanceModel = require("../models/attendanceModel");
const certificateModel = require("../models/certificateModel");

/**
 * Spec 17.12 (Reports): each builder returns { title, columns, rows } --
 * a plain tabular shape shared by the PDF/Excel/CSV renderers in
 * utils/tableExport.js, so adding a new report type never touches the
 * export/format code.
 */
const BUILDERS = {
    async registrations(conferenceId) {
        const delegates = await delegateModel.listByConference(conferenceId);
        return {
            title: "Registration Report",
            columns: [
                { key: "full_name", label: "Name" }, { key: "email", label: "Email" },
                { key: "school", label: "School" }, { key: "status", label: "Status" },
                { key: "mun_experience", label: "Experience" }, { key: "created_at", label: "Registered" }
            ],
            rows: delegates.map((d) => ({ ...d, created_at: new Date(d.created_at).toLocaleDateString() }))
        };
    },

    async committees(conferenceId) {
        const committees = await committeeModel.listByConference(conferenceId);
        return {
            title: "Committee Report",
            columns: [
                { key: "name", label: "Committee" }, { key: "type", label: "Type" },
                { key: "capacity", label: "Capacity" }, { key: "status", label: "Status" },
                { key: "chair", label: "Chair" }, { key: "vice_chair", label: "Vice Chair" }
            ],
            rows: committees
        };
    },

    async assignments(conferenceId) {
        const rows = await assignmentModel.listByConference(conferenceId);
        return {
            title: "Assignment Report",
            columns: [
                { key: "delegate_name", label: "Delegate" }, { key: "delegate_school", label: "School" },
                { key: "committee_name", label: "Committee" }, { key: "portfolio_name", label: "Portfolio" },
                { key: "status", label: "Status" }
            ],
            rows: rows.map((r) => ({ ...r, status: r.status || "unassigned" }))
        };
    },

    async financial(conferenceId) {
        const payments = await paymentModel.listByConference(conferenceId);
        return {
            title: "Financial Report",
            columns: [
                { key: "delegate_name", label: "Delegate" }, { key: "fee_category_name", label: "Fee" },
                { key: "amount", label: "Amount" }, { key: "method", label: "Method" },
                { key: "status", label: "Status" }, { key: "created_at", label: "Date" }
            ],
            rows: payments.map((p) => ({ ...p, created_at: new Date(p.created_at).toLocaleDateString() }))
        };
    },

    async attendance(conferenceId) {
        const summaries = await attendanceModel.getEventSummaries(conferenceId);
        return {
            title: "Attendance Report",
            columns: [
                { key: "title", label: "Session" }, { key: "type", label: "Type" },
                { key: "start_time", label: "Start" }, { key: "checked_in_count", label: "Checked In" }
            ],
            rows: summaries.map((s) => ({ ...s, start_time: new Date(s.start_time).toLocaleString() }))
        };
    },

    async certificates(conferenceId) {
        const certificates = await certificateModel.listByConference(conferenceId);
        return {
            title: "Certificate Report",
            columns: [
                { key: "delegate_name", label: "Delegate" }, { key: "certificate_number", label: "Certificate No." },
                { key: "certificate_type", label: "Type" }, { key: "download_count", label: "Downloads" },
                { key: "issued_at", label: "Issued" }
            ],
            rows: certificates.map((c) => ({ ...c, issued_at: new Date(c.issued_at).toLocaleDateString() }))
        };
    }
};

async function build(type, conferenceId) {
    const builder = BUILDERS[type];
    if (!builder) throw new ApiError(400, `Unknown report type "${type}"`);
    return builder(conferenceId);
}

module.exports = { build, REPORT_TYPES: Object.keys(BUILDERS) };
