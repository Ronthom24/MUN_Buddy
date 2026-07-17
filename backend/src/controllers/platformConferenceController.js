const asyncHandler = require("../utils/asyncHandler");
const platformConferenceService = require("../services/platformConferenceService");

const list = asyncHandler(async (req, res) => {
    const conferences = await platformConferenceService.listConferences({
        search: req.query.search,
        organizationId: req.query.organizationId ? Number(req.query.organizationId) : undefined,
        status: req.query.status
    });
    res.status(200).json({ success: true, conferences });
});

const detail = asyncHandler(async (req, res) => {
    const conference = await platformConferenceService.getConference(Number(req.params.id));
    res.status(200).json({ success: true, conference });
});

const archive = asyncHandler(async (req, res) => {
    const conference = await platformConferenceService.setArchived(Number(req.params.id));
    res.status(200).json({ success: true, conference });
});

const setDisabled = asyncHandler(async (req, res) => {
    const conference = await platformConferenceService.setDisabled(Number(req.params.id), Boolean(req.body.disabled));
    res.status(200).json({ success: true, conference });
});

module.exports = { list, detail, archive, setDisabled };
