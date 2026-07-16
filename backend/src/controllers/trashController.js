const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const committeeModel = require("../models/committeeModel");
const portfolioModel = require("../models/portfolioModel");
const resourceModel = require("../models/resourceModel");
const announcementModel = require("../models/announcementModel");
const auditLogService = require("../services/auditLogService");

const RESTORERS = {
    committee: { model: committeeModel, listTrashed: (conferenceId) => committeeModel.listTrashed(conferenceId) },
    portfolio: { model: portfolioModel, listTrashed: (conferenceId) => portfolioModel.listTrashedByConference(conferenceId) },
    resource: { model: resourceModel, listTrashed: (conferenceId) => resourceModel.listTrashed(conferenceId) },
    announcement: { model: announcementModel, listTrashed: (conferenceId) => announcementModel.listTrashed(conferenceId) }
};

const list = asyncHandler(async (req, res) => {
    const [committees, portfolios, resources, announcements] = await Promise.all([
        committeeModel.listTrashed(req.conference.id),
        portfolioModel.listTrashedByConference(req.conference.id),
        resourceModel.listTrashed(req.conference.id),
        announcementModel.listTrashed(req.conference.id)
    ]);

    res.status(200).json({
        success: true,
        trash: {
            committees, portfolios, resources, announcements
        }
    });
});

const restore = asyncHandler(async (req, res) => {
    const { type, itemId } = req.params;
    const restorer = RESTORERS[type];
    if (!restorer) throw new ApiError(400, `Unknown trash item type "${type}"`);

    // Confirm the item is actually in this conference's trash before restoring --
    // ids are only unique per-table, not globally, so this is the isolation check.
    const trashed = await restorer.listTrashed(req.conference.id);
    if (!trashed.some((row) => row.id === Number(itemId))) {
        throw new ApiError(404, "Item not found in this conference's trash");
    }

    const restored = await restorer.model.restore(Number(itemId));

    await auditLogService.log({
        conferenceId: req.conference.id, user: req.user, action: `${type}.restore`,
        resourceType: type, resourceId: Number(itemId), newValue: restored
    });

    res.status(200).json({ success: true, item: restored });
});

module.exports = { list, restore };
