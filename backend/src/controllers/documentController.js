const asyncHandler = require("../utils/asyncHandler");
const documentModel = require("../models/documentModel");

const create = asyncHandler(async (req, res) => {
    const documentId = await documentModel.create({
        delegateId: req.user.id,
        committeeId: req.body.committeeId,
        agendaId: req.body.agendaId,
        type: req.body.type,
        title: req.body.title,
        content: req.body.content
    });
    const document = await documentModel.findById(documentId);
    res.status(201).json({ success: true, document });
});

const listMine = asyncHandler(async (req, res) => {
    const documents = await documentModel.listByDelegate(req.user.id, { type: req.query.type });
    res.status(200).json({ success: true, documents });
});

const update = asyncHandler(async (req, res) => {
    const document = await documentModel.update(req.document.id, req.body);
    res.status(200).json({ success: true, document });
});

const remove = asyncHandler(async (req, res) => {
    await documentModel.remove(req.document.id);
    res.status(204).send();
});

module.exports = { create, listMine, update, remove };
