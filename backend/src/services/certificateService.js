const ApiError = require("../utils/ApiError");
const certificateModel = require("../models/certificateModel");
const certificateTemplateModel = require("../models/certificateTemplateModel");
const delegateModel = require("../models/delegateModel");
const conferenceModel = require("../models/conferenceModel");
const awardModel = require("../models/awardModel");
const { generateCertificateNumber } = require("../utils/certificateNumber");
const { renderCertificatePdf } = require("../utils/certificatePdf");

async function createTemplate(organizationId, data) {
    return certificateTemplateModel.create({ organizationId, ...data });
}

async function updateTemplate(organizationId, templateId, data) {
    const template = await certificateTemplateModel.findById(templateId);
    if (!template || template.organization_id !== organizationId) throw new ApiError(404, "Certificate template not found");

    return certificateTemplateModel.update(templateId, data);
}

async function archiveTemplate(organizationId, templateId) {
    const template = await certificateTemplateModel.findById(templateId);
    if (!template || template.organization_id !== organizationId) throw new ApiError(404, "Certificate template not found");

    return certificateTemplateModel.archive(templateId);
}

async function listTemplatesForConference(conferenceId) {
    const conference = await conferenceModel.findById(conferenceId);
    return certificateTemplateModel.listByOrganization(conference.organization_id);
}

async function issueCertificate(conferenceId, delegateId, { templateId, certificateType, awardId }, issuedByAccessId) {
    const [delegate, conference, template] = await Promise.all([
        delegateModel.findById(delegateId),
        conferenceModel.findById(conferenceId),
        certificateTemplateModel.findById(templateId)
    ]);
    if (!delegate || delegate.conference_id !== conferenceId) throw new ApiError(404, "Delegate not found");
    if (!template) throw new ApiError(404, "Certificate template not found");

    if (awardId) {
        const award = await awardModel.findById(awardId);
        if (!award || award.conference_id !== conferenceId || award.delegate_id !== delegateId) {
            throw new ApiError(400, "Award does not belong to this delegate in this conference");
        }
    }

    const certificateNumber = generateCertificateNumber(conference);
    return certificateModel.create({
        certificateNumber, conferenceId, delegateId, templateId, awardId,
        certificateType: certificateType || template.certificate_type, issuedByAccessId
    });
}

async function bulkIssue(conferenceId, delegateIds, options, issuedByAccessId) {
    const issued = [];
    const failed = [];

    for (const delegateId of delegateIds) {
        try {
            const certificate = await issueCertificate(conferenceId, delegateId, options, issuedByAccessId);
            issued.push(certificate);
        } catch (err) {
            failed.push({ delegateId, reason: err.message || "Could not issue certificate" });
        }
    }

    return { issued, failed };
}

async function streamCertificatePdf(certificateId, stream, { recordDownload = true } = {}) {
    const context = await certificateModel.findRenderContext(certificateId);
    if (!context) throw new ApiError(404, "Certificate not found");

    renderCertificatePdf({
        certificate: { certificate_number: context.certificate_number, issued_at: context.issued_at },
        template: {
            title: context.template_title, body_text: context.template_body_text, accent_color: context.template_accent_color,
            signatory_name: context.template_signatory_name, signatory_title: context.template_signatory_title
        },
        conference: { name: context.conference_name, start_date: context.conference_start_date, end_date: context.conference_end_date },
        delegate: { full_name: context.delegate_full_name },
        award: context.award_category
            ? { category: context.award_category, committee_name: context.award_committee_name, portfolio_name: context.award_portfolio_name }
            : null
    }, stream);

    if (recordDownload) await certificateModel.recordDownload(certificateId);
}

async function verifyCertificate(certificateNumber) {
    const certificate = await certificateModel.findByNumber(certificateNumber);
    if (!certificate) return { valid: false };

    return {
        valid: true,
        certificateNumber: certificate.certificate_number,
        delegateName: certificate.delegate_name,
        conferenceName: certificate.conference_name,
        certificateType: certificate.certificate_type,
        issuedAt: certificate.issued_at
    };
}

module.exports = {
    createTemplate, updateTemplate, archiveTemplate, listTemplatesForConference,
    issueCertificate, bulkIssue, streamCertificatePdf, verifyCertificate
};
