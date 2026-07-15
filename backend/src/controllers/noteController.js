const asyncHandler = require("../utils/asyncHandler");
const noteModel = require("../models/noteModel");

const create = asyncHandler(async (req, res) => {
    const noteId = await noteModel.create({
        delegateId: req.user.id,
        title: req.body.title,
        content: req.body.content,
        tags: req.body.tags
    });
    const note = await noteModel.findById(noteId);
    res.status(201).json({ success: true, note });
});

const listMine = asyncHandler(async (req, res) => {
    const notes = await noteModel.listByDelegate(req.user.id, {
        search: req.query.search,
        tag: req.query.tag
    });
    res.status(200).json({ success: true, notes });
});

const update = asyncHandler(async (req, res) => {
    const note = await noteModel.update(req.note.id, req.body);
    res.status(200).json({ success: true, note });
});

const remove = asyncHandler(async (req, res) => {
    await noteModel.remove(req.note.id);
    res.status(204).send();
});

module.exports = { create, listMine, update, remove };
