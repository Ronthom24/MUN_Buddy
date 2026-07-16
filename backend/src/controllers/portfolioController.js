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

module.exports = { listForCommittee, create, update, remove };
