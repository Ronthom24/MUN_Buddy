const asyncHandler = require("../utils/asyncHandler");
const registrationFormModel = require("../models/registrationFormModel");

const getForConference = asyncHandler(async (req, res) => {
    const conferenceId = Number(req.params.id);
    const form = await registrationFormModel.findActiveByConference(conferenceId);
    res.status(200).json({ success: true, form: form ? { id: form.id, schema: JSON.parse(form.schema_json) } : null });
});

const upsert = asyncHandler(async (req, res) => {
    const form = await registrationFormModel.upsert(req.conference.id, req.body.schema);
    res.status(200).json({ success: true, form: { id: form.id, schema: JSON.parse(form.schema_json) } });
});

module.exports = { getForConference, upsert };
