const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const faqModel = require("../models/faqModel");
const conferenceModel = require("../models/conferenceModel");
const organizerAccessModel = require("../models/organizerAccessModel");
const notificationService = require("../services/notificationService");
const { resolveConferenceAccess } = require("../middleware/auth");

const listForConference = asyncHandler(async (req, res) => {
    const faqs = await faqModel.listByConference(req.conference.id, { status: req.query.status, category: req.query.category });
    res.status(200).json({ success: true, faqs });
});

const listPublished = asyncHandler(async (req, res) => {
    const faqs = await faqModel.listPublished(req.params.id);
    res.status(200).json({ success: true, faqs });
});

const ask = asyncHandler(async (req, res) => {
    const faqId = await faqModel.create({
        conferenceId: req.user.conferenceId,
        category: req.body.category,
        question: req.body.question,
        askedByDelegateId: req.user.id
    });
    const faq = await faqModel.findById(faqId);

    const conference = await conferenceModel.findById(req.user.conferenceId);
    const staff = await organizerAccessModel.listByConference(conference.id);
    await notificationService.notifyMany(
        staff.map((s) => ({
            conferenceId: conference.id,
            recipientType: "organizer",
            recipientId: s.id,
            type: "info",
            title: "New FAQ question",
            message: faq.question,
            link: `/conferences/${conference.id}/communication`
        }))
    );

    res.status(201).json({ success: true, faq });
});

const myQuestions = asyncHandler(async (req, res) => {
    const faqs = await faqModel.listByConference(req.user.conferenceId, {});
    res.status(200).json({ success: true, faqs: faqs.filter((f) => f.asked_by_delegate_id === req.user.id) });
});

async function requireFaqAccess(req, res, next) {
    try {
        const faq = await faqModel.findById(req.params.id);
        if (!faq) return next(new ApiError(404, "FAQ not found"));

        const conference = await conferenceModel.findById(faq.conference_id);
        const access = await resolveConferenceAccess(conference, req.user);
        if (!access || !["owner", "conference_manager", "admin", "organizer", "committee_director"].includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }

        req.faq = faq;
        req.conference = conference;
        req.access = { id: access.id, role: access.role };
        next();
    } catch (err) {
        next(err);
    }
}

const answer = asyncHandler(async (req, res) => {
    const faq = await faqModel.answer(req.faq.id, {
        answer: req.body.answer,
        status: req.body.status || "answered",
        answeredByAccessId: req.access.id
    });

    if (faq.asked_by_delegate_id) {
        await notificationService.notify({
            conferenceId: faq.conference_id,
            recipientType: "delegate",
            recipientId: faq.asked_by_delegate_id,
            type: "success",
            title: "Your question was answered",
            message: faq.question,
            link: "/delegate/faqs"
        });
    }

    res.status(200).json({ success: true, faq });
});

const update = asyncHandler(async (req, res) => {
    const faq = await faqModel.update(req.faq.id, req.body);
    res.status(200).json({ success: true, faq });
});

const remove = asyncHandler(async (req, res) => {
    await faqModel.remove(req.faq.id);
    res.status(204).send();
});

module.exports = { listForConference, listPublished, ask, myQuestions, requireFaqAccess, answer, update, remove };
