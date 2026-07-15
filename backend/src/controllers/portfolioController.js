const asyncHandler = require("../utils/asyncHandler");
const portfolioModel = require("../models/portfolioModel");

const listForCommittee = asyncHandler(async (req, res) => {
    const committeeId = Number(req.params.id || req.params.committeeId);
    const portfolios = await portfolioModel.listByCommittee(committeeId);
    res.status(200).json({ success: true, portfolios });
});

const create = asyncHandler(async (req, res) => {
    const portfolioId = await portfolioModel.create({ committeeId: req.committee.id, ...req.body });
    const portfolio = await portfolioModel.findById(portfolioId);
    res.status(201).json({ success: true, portfolio });
});

const update = asyncHandler(async (req, res) => {
    const portfolio = await portfolioModel.update(req.portfolio.id, req.body);
    res.status(200).json({ success: true, portfolio });
});

const remove = asyncHandler(async (req, res) => {
    await portfolioModel.remove(req.portfolio.id);
    res.status(204).send();
});

module.exports = { listForCommittee, create, update, remove };
