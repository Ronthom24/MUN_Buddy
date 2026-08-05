const jwt = require("jsonwebtoken");
const { verifySupabaseToken } = require("../utils/supabaseAuth");
const { BRIDGE_TOKEN_ISSUER } = require("../services/platformAdminViewService");
const ApiError = require("../utils/ApiError");
const delegateModel = require("../models/delegateModel");
const conferenceModel = require("../models/conferenceModel");
const committeeModel = require("../models/committeeModel");
const agendaModel = require("../models/agendaModel");
const portfolioModel = require("../models/portfolioModel");
const resourceModel = require("../models/resourceModel");
const announcementModel = require("../models/announcementModel");
const resolutionModel = require("../models/resolutionModel");
const noteModel = require("../models/noteModel");
const documentModel = require("../models/documentModel");
const feedbackModel = require("../models/feedbackModel");
const organizerAccessModel = require("../models/organizerAccessModel");
const organizationModel = require("../models/organizationModel");
const organizationMemberModel = require("../models/organizationMemberModel");
const permissionModel = require("../models/permissionModel");
const profileModel = require("../models/profileModel");

/**
 * Two token families hit this middleware: real Supabase Auth access tokens
 * (verified against Supabase's JWKS, see utils/supabaseAuth.js), and the
 * platform-admin "view as organizer" bridge token (a scoped capability
 * grant, not a real identity -- see platformAdminViewService.js -- signed
 * with our own JWT_SECRET). `jwt.decode` here is UNVERIFIED, used only to
 * pick which real verifier to run; nothing from this decode is trusted
 * until the matching verify call below succeeds.
 *
 * Force-logout (Platform Administration spec ch.13): Supabase has no admin
 * API to instantly kill an already-issued access token short of banning the
 * account (blocks future logins too -- wrong semantic) or waiting for
 * natural expiry. `profiles.sessions_revoked_at` restores the old
 * token_version bump-to-revoke immediacy with a timestamp instead of a
 * counter -- any token whose `iat` predates the last revocation is rejected
 * on this very next request, same as before.
 */
async function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return next(new ApiError(401, "Missing or invalid Authorization header"));
    }

    const unverified = jwt.decode(token) || {};

    try {
        if (unverified.iss === BRIDGE_TOKEN_ISSUER) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } else {
            const payload = await verifySupabaseToken(token);

            const profile = await profileModel.findById(payload.sub);
            if (profile?.sessions_revoked_at && payload.iat * 1000 < new Date(profile.sessions_revoked_at).getTime()) {
                return next(new ApiError(401, "This session has been revoked. Please log in again."));
            }

            req.user = { id: payload.sub, email: payload.email };
        }
        next();
    } catch (err) {
        next(new ApiError(401, "Invalid or expired token"));
    }
}

async function hasOrganizerCapacity(profileId) {
    const accessRows = await organizerAccessModel.listByProfile(profileId);
    if (accessRows.some((row) => row.status === "active")) return true;

    const orgRows = await organizationMemberModel.listByProfile(profileId);
    return orgRows.some((row) => row.status === "active" && ["owner", "admin"].includes(row.org_role));
}

/**
 * There's no static "role" on a Supabase Auth token -- one identity can be
 * both an organizer and a delegate. `requireRole` resolves capacity from our
 * own tables instead, in the order the route listed its allowed roles (a
 * route written as `requireRole("delegate", "organizer")` is declaring which
 * capacity should win if the caller happens to have both -- rare, but
 * deterministic rather than arbitrary).
 *
 * For "delegate", this also rebinds req.user.id from the profile uuid to
 * the resolved delegate row's id (and sets req.user.conferenceId) -- the
 * original profile id survives as req.user.profileId. This restores the
 * exact req.user.id/conferenceId shape every delegate-facing controller
 * already expects (unchanged from the old per-conference delegate JWT),
 * so none of those call sites needed to change. A profile with delegate
 * rows in more than one conference (new, possible only since the one-
 * account-per-email migration) resolves to the most recently created one,
 * same tiebreak the old findLatestByEmail used.
 */
function requireRole(...roles) {
    return async (req, res, next) => {
        try {
            if (!req.user) return next(new ApiError(403, "You do not have access to this resource"));

            if (req.user.adminView) {
                if (!roles.includes(req.user.role)) return next(new ApiError(403, "You do not have access to this resource"));
                return next();
            }

            for (const role of roles) {
                if (role === "delegate") {
                    const delegateRows = await delegateModel.listByProfile(req.user.id);
                    // Prefer the most recent non-suspended application (old
                    // delegateLogin's tiebreak, plus honoring per-conference
                    // suspension instead of blindly picking a suspended one).
                    const active = delegateRows.find((row) => row.account_status !== "suspended") || delegateRows[0];
                    if (active) {
                        if (active.account_status === "suspended") {
                            return next(new ApiError(403, "This account has been suspended. Contact your platform administrator."));
                        }
                        req.user.profileId = req.user.id;
                        req.user.id = active.id;
                        req.user.conferenceId = active.conference_id;
                        req.user.role = "delegate";
                        return next();
                    }
                } else if (role === "organizer") {
                    if (await hasOrganizerCapacity(req.user.id)) {
                        req.user.role = "organizer";
                        return next();
                    }
                }
            }

            return next(new ApiError(403, "You do not have access to this resource"));
        } catch (err) {
            next(err);
        }
    };
}

/**
 * Every organizer-side authorization question reduces to: what row does this
 * profile have in organizer_access for this conference (the owner's own
 * profile always has a row there too, with role='owner', created at
 * registration).
 *
 * As of the Organization tier: if there is no direct organizer_access row,
 * an Organization owner/admin still gets full ('owner'-equivalent) access to
 * every conference under their organization, without needing an explicit
 * per-conference invite. This is what "Organization owns many conferences"
 * (spec Ch.5/8) actually means in terms of authorization -- individual
 * Executive Board / Organizing Committee members still need an explicit
 * per-conference organizer_access grant.
 *
 * Platform Administration bridge (spec ch.9): a platform admin's minted
 * admin-view token carries `adminView: true` + a `conferenceId` it was
 * scoped to at mint time (see services/platformAdminViewService.js). Only
 * THIS conference's access resolves via that token -- checked here, the one
 * choke point every conference-workspace sub-resource middleware funnels
 * through (committee/agenda/portfolio ids all resolve back to a conference
 * before calling this), so the scoping can't be bypassed by hitting a
 * sub-resource route directly with a token minted for a different
 * conference. Synthesizes the exact same shape as the org-owner fallback
 * below (id: null, role: 'owner') -- a proven pattern, not new surface area.
 */
async function resolveConferenceAccess(conference, user) {
    if (user.adminView && user.conferenceId === conference.id) {
        return {
            id: null,
            conference_id: conference.id,
            role: "owner",
            committee_id: null,
            via_platform_admin: true
        };
    }

    const profileId = user.profileId || user.id;

    const direct = await organizerAccessModel.findByConferenceAndProfile(conference.id, profileId);
    if (direct) return direct;

    if (!conference.organization_id) return null;

    const membership = await organizationMemberModel.findByOrganizationAndProfile(conference.organization_id, profileId);
    if (membership && membership.status === "active" && ["owner", "admin"].includes(membership.org_role)) {
        return {
            id: null,
            conference_id: conference.id,
            role: "owner",
            committee_id: null,
            via_organization: true
        };
    }

    return null;
}

const DEFAULT_OPERATIONAL_ROLES = ["owner", "conference_manager", "admin", "organizer"];

function requireConferenceAccess(...allowedRoles) {
    return async (req, res, next) => {
        try {
            const conferenceId = Number(req.params.conferenceId || req.params.id);
            if (!conferenceId) return next(new ApiError(400, "A conference id is required"));

            const conference = await conferenceModel.findById(conferenceId);
            if (!conference) return next(new ApiError(404, "Conference not found"));

            const access = await resolveConferenceAccess(conference, req.user);
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
            const access = await resolveConferenceAccess(conference, req.user);

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
            const access = await resolveConferenceAccess(conference, req.user);

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
            const access = await resolveConferenceAccess(conference, req.user);

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
        const access = await resolveConferenceAccess(conference, req.user);

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
        const access = await resolveConferenceAccess(conference, req.user);

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
        const access = await resolveConferenceAccess(conference, req.user);

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
        const access = await resolveConferenceAccess(conference, req.user);

        const allowed = ["owner", "conference_manager", "admin", "committee_director"];
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

/**
 * "Own" resolution/note/document checks compare against req.user.id, which
 * for a `requireRole("delegate")`-gated route is already the resolved
 * delegate row's id for the caller's current conference context (see
 * requireRole above) -- so this comparison is unchanged from before the
 * identity migration despite delegates now being profile-keyed underneath.
 */
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
        const access = await resolveConferenceAccess(conference, req.user);

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

            const membership = await organizationMemberModel.findByOrganizationAndProfile(organizationId, req.user.profileId || req.user.id);
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
