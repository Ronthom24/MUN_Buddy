const ApiError = require("../utils/ApiError");
const { authClient, adminClient } = require("../utils/supabaseClients");

const pool = require("../config/database");
const conferenceModel = require("../models/conferenceModel");
const organizerAccessModel = require("../models/organizerAccessModel");
const committeeModel = require("../models/committeeModel");
const delegateModel = require("../models/delegateModel");
const organizationModel = require("../models/organizationModel");
const organizationMemberModel = require("../models/organizationMemberModel");
const registrationFormModel = require("../models/registrationFormModel");
const profileModel = require("../models/profileModel");
const { generateConferenceCode } = require("../utils/conferenceCode");
const { uniqueSlug } = require("../utils/slug");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Creates the Supabase Auth identity for a brand-new registration and signs
 * them straight in, returning a real access token -- mirrors the old
 * "immediate usable account, no email verification wait" behavior
 * (REQUIRE_EMAIL_VERIFICATION=false) exactly, since email_confirm: true
 * marks the address confirmed at creation instead of sending a link.
 *
 * If the email already has an account, this is instead treated as "apply
 * with your existing account" (spec: one Supabase identity per email,
 * platform-wide) -- the caller must supply that account's correct password,
 * verified the same way login does. Wrong password -> 409, matching the
 * old "email already in use" rejection but phrased so the person knows to
 * log in with their existing password instead of retrying registration.
 */
async function getOrCreateProfile({ email, password, fullName }) {
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: fullName }
    });

    if (!createError) {
        const { data: signedIn, error: signInError } = await authClient.auth.signInWithPassword({ email, password });
        if (signInError) throw new ApiError(500, "Account created but sign-in failed: " + signInError.message);
        return { profileId: created.user.id, session: signedIn.session, isNewAccount: true };
    }

    // createUser fails with a 422/"already registered" style error when the email exists.
    const { data: signedIn, error: signInError } = await authClient.auth.signInWithPassword({ email, password });
    if (signInError) {
        throw new ApiError(409, "An account with this email already exists. Log in instead, or check your password.");
    }
    return { profileId: signedIn.user.id, session: signedIn.session, isNewAccount: false };
}

async function organizerRegister(body) {
    const { profileId, session, isNewAccount } = await getOrCreateProfile({
        email: body.email, password: body.password, fullName: body.fullName
    });

    const committeeNames = Array.isArray(body.committees) ? [...body.committees] : [];
    if (body.customCommittee && body.customCommittee.trim()) {
        committeeNames.push(body.customCommittee.trim());
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const organizationName = (body.organizationName && body.organizationName.trim())
            || `${body.fullName}'s Organization`;
        const slug = await uniqueSlug(connection, organizationName);
        const organizationId = await organizationModel.create({
            name: organizationName,
            slug,
            contactEmail: body.email
        }, connection);

        await organizationMemberModel.create({
            organizationId, email: body.email, profileId, fullName: body.fullName, orgRole: "owner", status: "active"
        }, connection);

        const conferenceId = await conferenceModel.create({
            createdBy: profileId,
            organizationId,
            name: body.conferenceName,
            acronym: body.conferenceAcronym,
            institution: body.institution,
            location: body.location,
            description: body.description,
            startDate: body.startDate,
            endDate: body.endDate,
            registrationDeadline: body.registrationDeadline,
            maxDelegates: body.maxDelegates,
            conferenceCode: generateConferenceCode(body.conferenceName, body.conferenceAcronym),
            registrationStatus: body.registrationStatus === "open" ? "open" : "closed"
        }, connection);

        await organizerAccessModel.create({
            conferenceId, email: body.email, profileId, role: "owner"
        }, connection);

        for (const email of body.organizerEmails || []) {
            if (email && email !== body.email) {
                await organizerAccessModel.create({ conferenceId, email, role: "organizer" }, connection);
            }
        }

        for (const name of committeeNames) {
            if (name && name.trim()) {
                await committeeModel.create({ conferenceId, name: name.trim() }, connection);
            }
        }

        await connection.commit();

        const conference = await conferenceModel.findById(conferenceId);
        const organization = await organizationModel.findById(organizationId);

        return {
            token: session.access_token,
            organizer: { id: profileId, fullName: body.fullName, email: body.email },
            organization,
            conference,
            existingAccount: !isNewAccount
        };
    } catch (err) {
        await connection.rollback();
        if (err.code === "23505") {
            throw new ApiError(409, "That conference code is already in use");
        }
        throw err;
    } finally {
        connection.release();
    }
}

/**
 * Adds a 2nd+ conference to an existing organization. Unlike
 * organizerRegister (which creates a brand new organization + conference
 * all at once), this assumes the organization and the requesting profile's
 * membership already exist.
 */
async function createConferenceForOrganization(organizationId, body, requestingProfileId, requestingEmail) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const conferenceId = await conferenceModel.create({
            createdBy: requestingProfileId,
            organizationId,
            name: body.conferenceName,
            acronym: body.conferenceAcronym,
            institution: body.institution,
            location: body.location,
            description: body.description,
            startDate: body.startDate,
            endDate: body.endDate,
            registrationDeadline: body.registrationDeadline,
            maxDelegates: body.maxDelegates,
            conferenceCode: generateConferenceCode(body.conferenceName, body.conferenceAcronym),
            registrationStatus: body.registrationStatus === "open" ? "open" : "closed"
        }, connection);

        await organizerAccessModel.create({
            conferenceId, email: requestingEmail, profileId: requestingProfileId, role: "owner"
        }, connection);

        for (const name of Array.isArray(body.committees) ? body.committees : []) {
            if (name && name.trim()) {
                await committeeModel.create({ conferenceId, name: name.trim() }, connection);
            }
        }

        await connection.commit();
        return conferenceModel.findById(conferenceId);
    } catch (err) {
        await connection.rollback();
        if (err.code === "23505") {
            throw new ApiError(409, "That conference code is already in use");
        }
        throw err;
    } finally {
        connection.release();
    }
}

/**
 * Backend-mediated login (not a frontend-direct Supabase call): keeps this
 * endpoint as the single place login attempts are observed, so
 * login_history recording and the Security Center's lockout enforcement
 * (loginHistoryService.assertNotLocked, checked by the controller before
 * this runs) keep working exactly as before -- Supabase Auth owns the
 * credential itself, but our backend is still the gateway that sees every
 * attempt, success or failure.
 */
async function organizerLogin({ email, password }) {
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) {
        // A suspended organizer is Supabase-banned (see platformUserService.suspendUser) --
        // surface the real reason instead of a generic credentials error.
        if (error.code === "user_banned") {
            throw new ApiError(403, "This account has been suspended. Contact your platform administrator.");
        }
        throw new ApiError(401, "Invalid email or password");
    }

    const profileId = data.user.id;
    const profile = await profileModel.findById(profileId);
    if (profile && profile.status === "suspended") {
        throw new ApiError(403, "This account has been suspended. Contact your platform administrator.");
    }

    const hasAccessRows = (await organizerAccessModel.listByProfile(profileId)).some((r) => r.status === "active");
    const hasOrgRows = (await organizationMemberModel.listByProfile(profileId)).some((r) => r.status === "active");
    if (!hasAccessRows && !hasOrgRows) {
        throw new ApiError(403, "This account doesn't have organizer access.");
    }

    return {
        token: data.session.access_token,
        organizer: { id: profileId, fullName: profile?.full_name || data.user.user_metadata?.full_name, email }
    };
}

/** Guards staff login/claim against the owning organization's owner being suspended -- see profileModel.setStatus. */
async function assertOwningOrganizerNotSuspended(conferenceId) {
    const conference = await conferenceModel.findById(conferenceId);
    if (!conference) return;

    const members = await organizationMemberModel.listByOrganization(conference.organization_id);
    const owner = members.find((m) => m.org_role === "owner" && m.status === "active" && m.profile_id);
    if (!owner) return;

    const ownerProfile = await profileModel.findById(owner.profile_id);
    if (ownerProfile && ownerProfile.status === "suspended") {
        throw new ApiError(403, "This conference's organizer account has been suspended.");
    }
}

async function organizerAccessClaim({ conferenceId, email, password, fullName }) {
    const access = await organizerAccessModel.findByConferenceAndEmail(conferenceId, email);
    if (!access) throw new ApiError(404, "No invitation found for this email on this conference");
    if (access.profile_id) {
        throw new ApiError(409, "This invitation has already been claimed. Please log in instead.");
    }
    await assertOwningOrganizerNotSuspended(conferenceId);

    const { profileId, session } = await getOrCreateProfile({ email, password, fullName });
    const updated = await organizerAccessModel.claimInvite(access.id, { profileId });

    return {
        token: session.access_token,
        organizer: { id: profileId, fullName, email },
        conferenceId: updated.conference_id,
        accessRole: updated.role
    };
}

async function delegateRegister(body) {
    const conference = await conferenceModel.findById(body.conferenceId);
    if (!conference) throw new ApiError(404, "Selected conference was not found");

    const { profileId, session } = await getOrCreateProfile({
        email: body.email, password: body.password, fullName: body.fullName
    });

    const existing = await delegateModel.findByConferenceAndProfile(body.conferenceId, profileId);
    if (existing) throw new ApiError(409, "You have already registered for this conference with this account");

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const delegateId = await delegateModel.create({
            conferenceId: body.conferenceId,
            profileId,
            school: body.school,
            grade: body.grade,
            munExperience: body.munExperience,
            profileText: body.profileText,
            specialNotes: body.specialNotes
        }, connection);

        await delegateModel.addCommitteePreferences(delegateId, body.committeePreferences, connection);
        await delegateModel.addCountryPreferences(delegateId, body.countryPreferences, connection);

        if (body.customResponses && typeof body.customResponses === "object") {
            const activeForm = await registrationFormModel.findActiveByConference(body.conferenceId, connection);
            if (activeForm) {
                await registrationFormModel.saveResponse(delegateId, activeForm.id, body.customResponses, connection);
            }
        }

        await connection.commit();

        const delegate = await delegateModel.findById(delegateId);

        return {
            token: session.access_token,
            delegate: { id: delegate.id, fullName: delegate.full_name, email: delegate.email, status: delegate.status },
            conference: { id: conference.id, name: conference.name }
        };
    } catch (err) {
        await connection.rollback();
        if (err.code === "23505") {
            throw new ApiError(409, "You have already registered for this conference with this email");
        }
        throw err;
    } finally {
        connection.release();
    }
}

async function delegateLogin({ email, password }) {
    const { data, error } = await authClient.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(401, "Invalid email or password");

    const profileId = data.user.id;
    const delegateRows = await delegateModel.listByProfile(profileId);
    if (delegateRows.length === 0) throw new ApiError(403, "This account doesn't have a delegate application.");

    // Same tiebreak as requireRole's delegate resolution (middleware/auth.js):
    // prefer the most recent non-suspended application.
    const active = delegateRows.find((row) => row.account_status !== "suspended") || delegateRows[0];
    if (active.account_status === "suspended") {
        throw new ApiError(403, "This account has been suspended. Contact your platform administrator.");
    }

    return {
        token: data.session.access_token,
        delegate: { id: active.id, fullName: active.full_name, email: active.email, status: active.status }
    };
}

/**
 * Supabase Auth owns password reset delivery now -- sends its own email
 * (or via custom SMTP configured in Supabase Auth settings) with a link
 * that lands on FRONTEND_URL's reset-password page carrying a recovery
 * session; the frontend calls supabase.auth.updateUser({ password })
 * directly from there. No backend confirm step needed (see Phase 4).
 */
async function requestPasswordReset({ email }) {
    await authClient.auth.resetPasswordForEmail(email, { redirectTo: `${FRONTEND_URL}/reset-password` });
    return { message: "If an account with that email exists, a reset link has been sent." };
}

module.exports = {
    organizerRegister, organizerLogin, organizerAccessClaim, delegateRegister, delegateLogin,
    requestPasswordReset, createConferenceForOrganization
};
