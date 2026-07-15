const asyncHandler = require("../utils/asyncHandler");
const agendaModel = require("../models/agendaModel");

const listForCommittee = asyncHandler(async (req, res) => {
    const committeeId = Number(req.params.id || req.params.committeeId);
    const agendas = await agendaModel.listByCommittee(committeeId);
    res.status(200).json({ success: true, agendas });
});

const create = asyncHandler(async (req, res) => {
    const agendaId = await agendaModel.create({ committeeId: req.committee.id, ...req.body });
    const agenda = await agendaModel.findById(agendaId);
    res.status(201).json({ success: true, agenda });
});

const update = asyncHandler(async (req, res) => {
    const agenda = await agendaModel.update(req.agenda.id, req.body);
    res.status(200).json({ success: true, agenda });
});

const remove = asyncHandler(async (req, res) => {
    await agendaModel.remove(req.agenda.id);
    res.status(204).send();
});

module.exports = { listForCommittee, create, update, remove };
