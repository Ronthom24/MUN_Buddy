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
const organizationModel = require("../models/organizationModel");
const organizationMemberModel = require("../models/organizationMemberModel");
const permissionModel = require("../models/permissionModel");

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
 *
 * As of the Organization tier: if there is no direct organizer_access row,
 * an Organization owner/admin still gets full ('owner'-equivalent) access to
 * every conference under their organization, without needing an explicit
 * per-conference invite. This is what "Organization owns many conferences"
 * (spec Ch.5/8) actually means in terms of authorization -- individual
 * Executive Board / Organizing Committee members still need an explicit
 * per-conference organizer_access grant.
 */
async function resolveConferenceAccess(conference, email) {
    const direct = await organizerAccessModel.findByConferenceAndEmail(conference.id, email);
    if (direct) return direct;

    if (!conference.organization_id) return null;

    const membership = await organizationMemberModel.findByOrganizationAndEmail(conference.organization_id, email);
    if (membership && membership.status === "active" && ["owner", "admin"].includes(membership.org_role)) {
        return {
            id: null,
            conference_id: conference.id,
            email,
            role: "owner",
            committee_id: null,
            password_hash: null,
            via_organization: true
        };
    }

    return null;
}

const DEFAULT_OPERATIONAL_ROLES = ["owner", "conference_manager", "organizer"];

function requireConferenceAccess(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const conferenceId = Number(req.params.conferenceId || req.params.id);
            if (!conferenceId) return next(new ApiError(400, "A conference id is required"));

            const conference = await conferenceModel.findById(conferenceId);
            if (!conference) return next(new ApiError(404, "Conference not found"));

            const access = await resolveConferenceAccess(conference, req.user.email);
            if (!access || !allowedRoles.includes(access.role)) {
                return next(new ApiError(403, "You do not have access to this resource"));
            }

            req.conference = conference;
            req.access = { id: access.id, role: access.role, committeeId: access.committee_id };
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
            const access = await resolveConferenceAccess(conference, req.user.email);

            if (!access || !allowedRoles.includes(access.role)) {
                return next(new ApiError(403, "You do not have access to this resource"));
            }
            if (access.role === "committee_director" && access.committee_id !== committee.id) {
                return next(new ApiError(403, "You are not the director of this committee"));
            }

            req.committee = committee;
            req.conference = conference;
            req.access = { id: access.id, role: access.role, committeeId: access.committee_id };
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
            const access = await resolveConferenceAccess(conference, req.user.email);

            if (!access || !allowedRoles.includes(access.role)) {
                return next(new ApiError(403, "You do not have access to this resource"));
            }
            if (access.role === "committee_director" && access.committee_id !== committee.id) {
                return next(new ApiError(403, "You are not the director of this committee"));
            }

            req.agenda = agenda;
            req.committee = committee;
            req.conference = conference;
            req.access = { id: access.id, role: access.role, committeeId: access.committee_id };
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
            const access = await resolveConferenceAccess(conference, req.user.email);

            if (!access || !allowedRoles.includes(access.role)) {
                return next(new ApiError(403, "You do not have access to this resource"));
            }
            if (access.role === "committee_director" && access.committee_id !== committee.id) {
                return next(new ApiError(403, "You are not the director of this committee"));
            }

            req.portfolio = portfolio;
            req.committee = committee;
            req.conference = conference;
            req.access = { id: access.id, role: access.role, committeeId: access.committee_id };
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
        const access = await resolveConferenceAccess(conference, req.user.email);

        if (!access || !DEFAULT_OPERATIONAL_ROLES.includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }

        req.resource = resource;
        req.conference = conference;
        req.access = { id: access.id, role: access.role, committeeId: access.committee_id };
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
        const access = await resolveConferenceAccess(conference, req.user.email);

        if (!access || !DEFAULT_OPERATIONAL_ROLES.includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }

        req.announcement = announcement;
        req.conference = conference;
        req.access = { id: access.id, role: access.role, committeeId: access.committee_id };
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
        const access = await resolveConferenceAccess(conference, req.user.email);

        if (!access || !DEFAULT_OPERATIONAL_ROLES.includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }

        req.delegateRecord = delegate;
        req.conference = conference;
        req.access = { id: access.id, role: access.role, committeeId: access.committee_id };
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
        const access = await resolveConferenceAccess(conference, req.user.email);

        const allowed = ["owner", "conference_manager", "committee_director"];
        if (!access || !allowed.includes(access.role)) {
            return next(new ApiError(403, "You do not have access to this resource"));
        }
        if (access.role === "committee_director" && access.committee_id !== resolution.committee_id) {
            return next(new ApiError(403, "You are not the director of this resolution's committee"));
        }

        req.resolution = resolution;
        req.conference = conference;
        req.access = { id: access.id, role: access.role, committeeId: access.committee_id };
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
        const access = await resolveConferenceAccess(conference, req.user.email);

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

/**
 * Organization-level access equivalent of requireConferenceAccess: resolves
 * the caller's organization_members row for :organizationId (or :id) and
 * checks their org_role against the allowed list.
 */
function requireOrganizationAccess(...allowedOrgRoles) {
    return async (req, res, next) => {
        try {
            const organizationId = Number(req.params.organizationId || req.params.id);
            if (!organizationId) return next(new ApiError(400, "An organization id is required"));

            const organization = await organizationModel.findById(organizationId);
            if (!organization) return next(new ApiError(404, "Organization not found"));

            const membership = await organizationMemberModel.findByOrganizationAndEmail(organizationId, req.user.email);
            if (!membership || membership.status !== "active" || !allowedOrgRoles.includes(membership.org_role)) {
                return next(new ApiError(403, "You do not have access to this organization"));
            }

            req.organization = organization;
            req.orgAccess = { id: membership.id, role: membership.org_role };
            next();
        } catch (err) {
            next(err);
        }
    };
}

/**
 * Fine-grained capability check. Must run after a requireConferenceAccess /
 * requireCommitteeAccess / etc. middleware has already populated req.access
 * (role + organizer_access id) -- this checks the effective permission set
 * (role defaults + per-member overrides) for that access row rather than a
 * hardcoded role array, per spec 4.10's modular permission model.
 *
 * Access rows synthesized via the Organization-owner fallback (req.access.id
 * === null) are always treated as fully permitted, since organization
 * owners/admins already have blanket authority over every conference in
 * their org.
 */
function requirePermission(permissionKey) {
    return async (req, res, next) => {
        try {
            if (!req.access) {
                return next(new ApiError(500, "requirePermission used without a prior access-resolution middleware"));
            }
            if (req.access.id === null || req.access.id === undefined) {
                return next();
            }

            const allowed = await permissionModel.hasPermission(req.access.role, req.access.id, permissionKey);
            if (!allowed) {
                return next(new ApiError(403, `You do not have the '${permissionKey}' permission`));
            }
            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = {
    authenticate,
    requireRole,
    resolveConferenceAccess,
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
    requireFeedbackOwnership,
    requireOrganizationAccess,
    requirePermission
};
