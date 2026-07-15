const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");
const conferenceModel = require("../models/conferenceModel");
const committeeModel = require("../models/committeeModel");
const agendaModel = require("../models/agendaModel");
const portfolioModel = require("../models/portfolioModel");
const resourceModel = require("../models/resourceModel");
const announcementModel = require("../models/announcementModel");
const delegateModel = require("../models/delegateModel");
const resolutionModel = require("../models/resolutionModel");
const noteModel = require("../models/noteModel");
const documentModel = require("../models/documentModel");
const feedbackModel = require("../models/feedbackModel");
const organizerAccessModel = require("../models/organizerAccessModel");

function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new ApiError(401, "Missing or invalid Authorization header"));
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch (err) {
        next(new ApiError(401, "Invalid or expired token"));
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }
        next();
    };
}

/**
 * Every organizer-side authorization question reduces to: what row does this
 * email have in organizer_access for this conference (the owner's own email
 * always has a row there too, with role='owner', created at registration).
 */
async function resolveConferenceAccess(conferenceId, email) {
    return organizerAccessModel.findByConferenceAndEmail(conferenceId, email);
}

const DEFAULT_OPERATIONAL_ROLES = ["owner", "conference_manager", "organizer"];

function requireConferenceAccess(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const conferenceId = Number(req.params.conferenceId || req.params.id);
            if (!conferenceId) return next(new ApiError(400, "A conference id is required"));

            const conference = await conferenceModel.findById(conferenceId);
            if (!conference) return next(new ApiError(404, "Conference not found"));

            const access = await resolveConferenceAccess(conferenceId, req.user.email);
            if (!access || !allowedRoles.includes(access.role)) {
                return next(new ApiError(403, "You do not have access to this resource"));
            }

            req.conference = conference;
            req.access = { role: access.role, committeeId: access.committee_id };
            next();
        } catch (err) {
            next(err);
        }
    };
}

function requireCommitteeAccess(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const committee = await committeeModel.findById(req.params.id || req.params.committeeId);
            if (!committee) return next(new ApiError(404, "Committee not found"));

            const conference = await conferenceModel.findById(committee.conference_id);
            const access = await resolveConferenceAccess(conference.id, req.user.email);

            if (!access || !allowedRoles.includes(access.role)) {
                return next(new ApiError(403, "You do not have access to this resource"));
            }
            if (access.role === "committee_director" && access.committee_id !== committee.id) {
                return next(new ApiError(403, "You are not the director of this committee"));
            }

            req.committee = committee;
            req.conference = conference;
            req.access = { role: access.role, committeeId: access.committee_id };
            next();
        } catch (err) {
            next(err);
        }
    };
}

function requireAgendaAccess(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const agenda = await agendaModel.findById(req.params.id);
            if (!agenda) return next(new ApiError(404, "Agenda not found"));

            const committee = await committeeModel.findById(agenda.committee_id);
            const conference = await conferenceModel.findById(committee.conference_id);
            const access = await resolveConferenceAccess(conference.id, req.user.email);

            if (!access || !allowedRoles.includes(access.role)) {
                return next(new ApiError(403, "You do not have access to this resource"));
            }
            if (access.role === "committee_director" && access.committee_id !== committee.id) {
                return next(new ApiError(403, "You are not the director of this committee"));
            }

            req.agenda = agenda;
            req.committee = committee;
            req.conference = conference;
            req.access = { role: access.role, committeeId: access.committee_id };
            next();
        } catch (err) {
            next(err);
        }
    };
}

function requirePortfolioAccess(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const portfolio = await portfolioModel.findById(req.params.id);
            if (!portfolio) return next(new ApiError(404, "Portfolio not found"));

            const committee = await committeeModel.findById(portfolio.committee_id);
            const conference = await conferenceModel.findById(committee.conference_id);
            const access = await resolveConferenceAccess(conference.id, req.user.email);

            if (!access || !allowedRoles.includes(access.role)) {
                return next(new ApiError(403, "You do not have access to this resource"));
            }
            if (access.role === "committee_director" && access.committee_id !== committee.id) {
                return next(new ApiError(403, "You are not the director of this committee"));
            }

            req.portfolio = portfolio;
            req.committee = committee;
            req.conference = conference;
            req.access = { role: access.role, committeeId: access.committee_id };
            next();
        } catch (err) {
            next(err);
        }
    };
}

async function requireResourceOwnership(req, res, next) {
    try {
        const resource = await resourceModel.findById(req.params.id);
        if (!resource) return next(new ApiError(404, "Resource not found"));

        const conference = await conferenceModel.findById(resource.conference_id);
        const access = await resolveConferenceAccess(conference.id, req.user.email);

        if (!access || !DEFAULT_OPERATIONAL_ROLES.includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }

        req.resource = resource;
        req.conference = conference;
        req.access = { role: access.role, committeeId: access.committee_id };
        next();
    } catch (err) {
        next(err);
    }
}

async function requireAnnouncementOwnership(req, res, next) {
    try {
        const announcement = await announcementModel.findById(req.params.id);
        if (!announcement) return next(new ApiError(404, "Announcement not found"));

        const conference = await conferenceModel.findById(announcement.conference_id);
        const access = await resolveConferenceAccess(conference.id, req.user.email);

        if (!access || !DEFAULT_OPERATIONAL_ROLES.includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }

        req.announcement = announcement;
        req.conference = conference;
        req.access = { role: access.role, committeeId: access.committee_id };
        next();
    } catch (err) {
        next(err);
    }
}

async function requireDelegateOwnership(req, res, next) {
    try {
        const delegate = await delegateModel.findById(req.params.id || req.params.delegateId);
        if (!delegate) return next(new ApiError(404, "Delegate not found"));

        const conference = await conferenceModel.findById(delegate.conference_id);
        const access = await resolveConferenceAccess(conference.id, req.user.email);

        if (!access || !DEFAULT_OPERATIONAL_ROLES.includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }

        req.delegateRecord = delegate;
        req.conference = conference;
        req.access = { role: access.role, committeeId: access.committee_id };
        next();
    } catch (err) {
        next(err);
    }
}

async function requireResolutionOwnership(req, res, next) {
    try {
        const resolution = await resolutionModel.findById(req.params.id);
        if (!resolution) return next(new ApiError(404, "Resolution not found"));

        const conference = await conferenceModel.findById(resolution.conference_id);
        const access = await resolveConferenceAccess(conference.id, req.user.email);

        const allowed = ["owner", "conference_manager", "committee_director"];
        if (!access || !allowed.includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }
        if (access.role === "committee_director" && access.committee_id !== resolution.committee_id) {
            return next(new ApiError(403, "You are not the director of this resolution's committee"));
        }

        req.resolution = resolution;
        req.conference = conference;
        req.access = { role: access.role, committeeId: access.committee_id };
        next();
    } catch (err) {
        next(err);
    }
}

async function requireOwnResolution(req, res, next) {
    try {
        const resolution = await resolutionModel.findById(req.params.id);
        if (!resolution) return next(new ApiError(404, "Resolution not found"));

        if (resolution.delegate_id !== req.user.id) {
            return next(new ApiError(403, "This is not your resolution"));
        }

        req.resolution = resolution;
        next();
    } catch (err) {
        next(err);
    }
}

async function requireOwnNote(req, res, next) {
    try {
        const note = await noteModel.findById(req.params.id);
        if (!note) return next(new ApiError(404, "Note not found"));

        if (note.delegate_id !== req.user.id) {
            return next(new ApiError(403, "This is not your note"));
        }

        req.note = note;
        next();
    } catch (err) {
        next(err);
    }
}

async function requireFeedbackOwnership(req, res, next) {
    try {
        const feedback = await feedbackModel.findById(req.params.id);
        if (!feedback) return next(new ApiError(404, "Feedback not found"));

        const conference = await conferenceModel.findById(feedback.conference_id);
        const access = await resolveConferenceAccess(conference.id, req.user.email);

        if (!access || access.role !== "owner") {
            return next(new ApiError(403, "You do not have access to this resource"));
        }

        req.feedback = feedback;
        req.conference = conference;
        next();
    } catch (err) {
        next(err);
    }
}

async function requireOwnDocument(req, res, next) {
    try {
        const document = await documentModel.findById(req.params.id);
        if (!document) return next(new ApiError(404, "Document not found"));

        if (document.delegate_id !== req.user.id) {
            return next(new ApiError(403, "This is not your document"));
        }

        req.document = document;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    authenticate,
    requireRole,
    requireConferenceAccess,
    requireCommitteeAccess,
    requireAgendaAccess,
    requirePortfolioAccess,
    requireResourceOwnership,
    requireAnnouncementOwnership,
    requireDelegateOwnership,
    requireResolutionOwnership,
    requireOwnResolution,
    requireOwnNote,
    requireOwnDocument,
    requireFeedbackOwnership
};
