const asyncHandler = require("../utils/asyncHandler");
const portfolioModel = require("../models/portfolioModel");
const auditLogService = require("../services/auditLogService");

const listForCommittee = asyncHandler(async (req, res) => {
    const committeeId = Number(req.params.id || req.params.committeeId);
    const portfolios = await portfolioModel.listByCommittee(committeeId);
    res.status(200).json({ success: true, portfolios });
});

const create = asyncHandler(async (req, res) => {
    const portfolioId = await portfolioModel.create({ committeeId: req.committee.id, ...req.body });
    const portfolio = await portfolioModel.findById(portfolioId);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "portfolio.create",
        resourceType: "portfolio", resourceId: portfolio.id, newValue: portfolio
    });
    res.status(201).json({ success: true, portfolio });
});

const bulkCreate = asyncHandler(async (req, res) => {
    const names = Array.isArray(req.body.names) ? req.body.names.map((n) => String(n).trim()).filter(Boolean) : [];
    const createdIds = await portfolioModel.bulkCreate(req.committee.id, names, req.body.type);
    const portfolios = await portfolioModel.listByCommittee(req.committee.id);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "portfolio.bulk_create",
        resourceType: "committee", resourceId: req.committee.id, newValue: { addedCount: createdIds.length, names }
    });
    res.status(201).json({ success: true, addedCount: createdIds.length, portfolios });
});

const update = asyncHandler(async (req, res) => {
    const previous = req.portfolio;
    const portfolio = await portfolioModel.update(req.portfolio.id, req.body);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "portfolio.update",
        resourceType: "portfolio", resourceId: portfolio.id, previousValue: previous, newValue: portfolio
    });
    res.status(200).json({ success: true, portfolio });
});

const remove = asyncHandler(async (req, res) => {
    await portfolioModel.remove(req.portfolio.id);
    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: "portfolio.remove",
        resourceType: "portfolio", resourceId: req.portfolio.id, previousValue: req.portfolio
    });
    res.status(204).send();
});

module.exports = { listForCommittee, create, bulkCreate, update, remove };
