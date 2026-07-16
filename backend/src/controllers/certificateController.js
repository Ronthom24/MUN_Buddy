const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const certificateModel = require("../models/certificateModel");
const certificateTemplateModel = require("../models/certificateTemplateModel");
const certificateService = require("../services/certificateService");
const conferenceModel = require("../models/conferenceModel");
const { resolveConferenceAccess } = require("../middleware/auth");
const notificationService = require("../services/notificationService");
const auditLogService = require("../services/auditLogService");

const listTemplates = asyncHandler(async (req, res) => {
    const templates = await certificateTemplateModel.listByOrganization(req.organization.id, { includeArchived: true });
    res.status(200).json({ success: true, templates });
});

const createTemplate = asyncHandler(async (req, res) => {
    const template = await certificateService.createTemplate(req.organization.id, req.body);
    res.status(201).json({ success: true, template });
});

const updateTemplate = asyncHandler(async (req, res) => {
    const template = await certificateService.updateTemplate(req.organization.id, Number(req.params.templateId), req.body);
    res.status(200).json({ success: true, template });
});

const archiveTemplate = asyncHandler(async (req, res) => {
    const template = await certificateService.archiveTemplate(req.organization.id, Number(req.params.templateId));
    res.status(200).json({ success: true, template });
});

const listTemplatesForConference = asyncHandler(async (req, res) => {
    const templates = await certificateService.listTemplatesForConference(req.conference.id);
    res.status(200).json({ success: true, templates });
});

const listCertificates = asyncHandler(async (req, res) => {
    const certificates = await certificateModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, certificates });
});

const certificateStats = asyncHandler(async (req, res) => {
    const stats = await certificateModel.getStatsForConference(req.conference.id);
    res.status(200).json({ success: true, stats });
});

async function notifyCertificateReady(conferenceId, delegateId) {
    await notificationService.notify({
        conferenceId,
        recipientType: "delegate",
        recipientId: delegateId,
        type: "success",
        title: "Certificate ready",
        message: "A certificate has been issued for you and is ready to download.",
        link: "/delegate/certificates"
    });
}

const issueCertificate = asyncHandler(async (req, res) => {
    const delegateId = Number(req.params.delegateId);
    const certificate = await certificateService.issueCertificate(req.conference.id, delegateId, req.body, req.access.id);
    await notifyCertificateReady(req.conference.id, delegateId);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "certificate.issue",
        resourceType: "certificate", resourceId: certificate.id, newValue: certificate
    });
    res.status(201).json({ success: true, certificate });
});

const bulkIssue = asyncHandler(async (req, res) => {
    const { delegateIds, templateId, certificateType } = req.body;
    const result = await certificateService.bulkIssue(req.conference.id, delegateIds, { templateId, certificateType }, req.access.id);
    await Promise.all((result.issued || []).map((c) => notifyCertificateReady(req.conference.id, c.delegate_id)));
    if ((result.issued || []).length > 0) {
        await auditLogService.log({
            conferenceId: req.conference.id, user: req.user, action: "certificate.bulk_issue",
            resourceType: "certificate", newValue: { count: result.issued.length, certificateIds: result.issued.map((c) => c.id) }
        });
    }
    res.status(201).json({ success: true, ...result });
});

const myCertificates = asyncHandler(async (req, res) => {
    const certificates = await certificateModel.listByDelegate(req.user.id);
    res.status(200).json({ success: true, certificates });
});

/**
 * Shared PDF download for both roles: an organizer with conference access,
 * or the delegate the certificate was issued to. Mounted at the top level
 * (not conference-nested) since a certificate id is already globally
 * unique and this keeps the delegate download URL simple.
 */
const downloadPdf = asyncHandler(async (req, res) => {
    const certificate = await certificateModel.findById(Number(req.params.id));
    if (!certificate) throw new ApiError(404, "Certificate not found");

    let allowed = false;
    if (req.user.role === "delegate") {
        allowed = certificate.delegate_id === req.user.id;
    } else if (req.user.role === "organizer") {
        const conference = await conferenceModel.findById(certificate.conference_id);
        const access = await resolveConferenceAccess(conference, req.user.email);
        allowed = Boolean(access);
    }
    if (!allowed) throw new ApiError(403, "You do not have access to this certificate");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${certificate.certificate_number}.pdf"`);
    await certificateService.streamCertificatePdf(certificate.id, res);
});

const verify = asyncHandler(async (req, res) => {
    const result = await certificateService.verifyCertificate(req.params.certificateNumber);
    res.status(200).json({ success: true, ...result });
});

module.exports = {
    listTemplates, createTemplate, updateTemplate, archiveTemplate, listTemplatesForConference,
    listCertificates, certificateStats, issueCertificate, bulkIssue, myCertificates, downloadPdf, verify
};
