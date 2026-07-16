const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const broadcastModel = require("../models/broadcastModel");
const broadcastService = require("../services/broadcastService");
const emailTemplateModel = require("../models/emailTemplateModel");

const listForConference = asyncHandler(async (req, res) => {
    const broadcasts = await broadcastModel.listByConference(req.conference.id);
    res.status(200).json({ success: true, broadcasts });
});

const create = asyncHandler(async (req, res) => {
    const broadcast = await broadcastService.createBroadcast(req.conference, req.body, req.access.id);
    res.status(201).json({ success: true, broadcast });
});

const send = asyncHandler(async (req, res) => {
    const broadcast = await broadcastService.sendBroadcast(Number(req.params.broadcastId), req.conference.id);
    res.status(200).json({ success: true, broadcast });
});

const recipients = asyncHandler(async (req, res) => {
    const broadcast = await broadcastModel.findById(req.params.broadcastId);
    if (!broadcast || broadcast.conference_id !== req.conference.id) throw new ApiError(404, "Broadcast not found");
    const rows = await broadcastModel.listRecipients(broadcast.id);
    res.status(200).json({ success: true, recipients: rows });
});

const listTemplates = asyncHandler(async (req, res) => {
    const templates = await emailTemplateModel.listByOrganization(req.organization.id);
    res.status(200).json({ success: true, templates });
});

const createTemplate = asyncHandler(async (req, res) => {
    const templateId = await emailTemplateModel.create({ organizationId: req.organization.id, ...req.body });
    const template = await emailTemplateModel.findById(templateId);
    res.status(201).json({ success: true, template });
});

const updateTemplate = asyncHandler(async (req, res) => {
    const template = await emailTemplateModel.findById(req.params.templateId);
    if (!template || template.organization_id !== req.organization.id) throw new ApiError(404, "Template not found");
    const updated = await emailTemplateModel.update(template.id, req.body);
    res.status(200).json({ success: true, template: updated });
});

const removeTemplate = asyncHandler(async (req, res) => {
    const template = await emailTemplateModel.findById(req.params.templateId);
    if (!template || template.organization_id !== req.organization.id) throw new ApiError(404, "Template not found");
    await emailTemplateModel.remove(template.id);
    res.status(204).send();
});

module.exports = { listForConference, create, send, recipients, listTemplates, createTemplate, updateTemplate, removeTemplate };
