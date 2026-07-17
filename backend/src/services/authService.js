const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../config/database");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");
const { generateConferenceCode } = require("../utils/conferenceCode");
const { uniqueSlug } = require("../utils/slug");

const organizerModel = require("../models/organizerModel");
const conferenceModel = require("../models/conferenceModel");
const organizerAccessModel = require("../models/organizerAccessModel");
const committeeModel = require("../models/committeeModel");
const delegateModel = require("../models/delegateModel");
const passwordResetTokenModel = require("../models/passwordResetTokenModel");
const emailVerificationTokenModel = require("../models/emailVerificationTokenModel");
const organizationModel = require("../models/organizationModel");
const organizationMemberModel = require("../models/organizationMemberModel");
const registrationFormModel = require("../models/registrationFormModel");
const emailService = require("./emailService");

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

/**
 * Temporary escape hatch: real SMTP delivery needs a verified domain, which
 * isn't set up yet (Brevo can't reliably deliver "from" a gmail.com address
 * or their own shared brevosend.com domain -- see 2026-07-17 session notes).
 * Until a domain is in place, set REQUIRE_EMAIL_VERIFICATION=false to fall
 * back to the pre-verification behavior (immediate usable login on
 * register). Flip back to true (or unset -- true is the default) once real
 * delivery works, no other code changes needed.
 */
const REQUIRE_EMAIL_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION !== "false";

/**
 * Sends (or, without SMTP configured, log-only "sends" -- see emailService.js)
 * an email verification link and returns it too, so callers can surface a
 * devVerifyLink in non-production API responses the same way password reset
 * already does. Organizer/delegate self-registration both gate login on this;
 * organizer_access staff (invited, not self-registered) don't need a
 * separate verification step -- accepting the invite already proves email
 * ownership.
 */
async function sendVerificationEmail({ accountType, accountId, email, fullName }) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
    await emailVerificationTokenModel.create({ accountType, accountId, token, expiresAt });

    const verifyLink = `${FRONTEND_URL}/verify-email?type=${accountType}&token=${token}`;
    await emailService.sendMail({
        to: email,
        subject: "Verify your MUN Buddy email address",
        html: `<p>Hi ${fullName},</p>
               <p>Welcome to MUN Buddy. Please verify your email address to activate your account:</p>
               <p><a href="${verifyLink}">${verifyLink}</a></p>
               <p>This link expires in 24 hours.</p>`
    });

    return verifyLink;
}

async function organizerRegister(body) {
    const existing = await organizerModel.findByEmail(body.email);
    if (existing) {
        throw new ApiError(409, "An organizer account with this email already exists");
    }

    const committeeNames = Array.isArray(body.committees) ? [...body.committees] : [];
    if (body.customCommittee && body.customCommittee.trim()) {
        committeeNames.push(body.customCommittee.trim());
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
        const organizerId = await organizerModel.create({
            fullName: body.fullName,
            email: body.email,
            phone: body.phone,
            passwordHash
        }, connection);

        const organizationName = (body.organizationName && body.organizationName.trim())
            || `${body.fullName}'s Organization`;
        const slug = await uniqueSlug(connection, organizationName);
        const organizationId = await organizationModel.create({
            name: organizationName,
            slug,
            contactEmail: body.email
        }, connection);

        await organizationMemberModel.create({
            organizationId, email: body.email, fullName: body.fullName, orgRole: "owner", status: "active"
        }, connection);

        const conferenceId = await conferenceModel.create({
            organizerId,
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
            conferenceId, email: body.email, role: "owner"
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

        const organizer = await organizerModel.findById(organizerId);
        const conference = await conferenceModel.findById(conferenceId);
        const organization = await organizationModel.findById(organizationId);

        if (!REQUIRE_EMAIL_VERIFICATION) {
            await organizerModel.setEmailVerified(organizer.id);
            const token = signToken({ id: organizer.id, role: "organizer", email: organizer.email, tv: organizer.token_version });
            return {
                token,
                organizer: { id: organizer.id, fullName: organizer.full_name, email: organizer.email },
                organization,
                conference
            };
        }

        const verifyLink = await sendVerificationEmail({
            accountType: "organizer", accountId: organizer.id, email: organizer.email, fullName: organizer.full_name
        });

        return {
            message: "Account created. Check your email to verify your address before logging in.",
            organizer: { id: organizer.id, fullName: organizer.full_name, email: organizer.email },
            organization,
            conference,
            ...(process.env.NODE_ENV !== "production" ? { devVerifyLink: verifyLink } : {})
        };
    } catch (err) {
        await connection.rollback();
        if (err.code === "ER_DUP_ENTRY") {
            throw new ApiError(409, "That email or conference code is already in use");
        }
        throw err;
    } finally {
        connection.release();
    }
}

/**
 * Adds a 2nd+ conference to an existing organization. Unlike
 * organizerRegister (which creates a brand new organizer+organization+
 * conference all at once), this assumes the organization and the
 * requesting organizer's membership already exist -- it's the path that,
 * before the Organization tier, simply didn't exist at all.
 */
async function createConferenceForOrganization(organizationId, body, requestingEmail) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const organizer = await organizerModel.findByEmail(requestingEmail);
        if (!organizer) {
            throw new ApiError(400, "Only a registered organizer account can create a conference");
        }

        const conferenceId = await conferenceModel.create({
            organizerId: organizer.id,
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
            conferenceId, email: requestingEmail, role: "owner"
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
        if (err.code === "ER_DUP_ENTRY") {
            throw new ApiError(409, "That conference code is already in use");
        }
        throw err;
    } finally {
        connection.release();
    }
}

async function organizerLogin({ email, password }) {
    const organizer = await organizerModel.findByEmail(email);
    if (organizer) {
        const matches = await bcrypt.compare(password, organizer.password_hash);
        if (matches) {
            if (organizer.status === "suspended") {
                throw new ApiError(403, "This account has been suspended. Contact your platform administrator.");
            }
            if (REQUIRE_EMAIL_VERIFICATION && !organizer.email_verified) {
                throw new ApiError(403, "Please verify your email before logging in. Check your inbox for the verification link.");
            }
            const token = signToken({ id: organizer.id, role: "organizer", email: organizer.email, tv: organizer.token_version });
            return {
                token,
                organizer: { id: organizer.id, fullName: organizer.full_name, email: organizer.email }
            };
        }
    }

    const staffRows = await organizerAccessModel.listClaimedByEmail(email);
    for (const row of staffRows) {
        const matches = await bcrypt.compare(password, row.password_hash);
        if (matches) {
            // Deliberately no `tv` claim here: row.id is an organizer_access id, not an
            // organizers.id, so it can't be checked against organizers.token_version.
            // Force-logout/suspend (Platform Administration) covers organizers + delegates
            // only -- see services/platformUserService.js.
            const token = signToken({ id: row.id, role: "organizer", email: row.email });
            return {
                token,
                organizer: { id: row.id, fullName: row.full_name, email: row.email },
                conferenceId: row.conference_id,
                accessRole: row.role
            };
        }
    }

    throw new ApiError(401, "Invalid email or password");
}

async function organizerAccessClaim({ conferenceId, email, password, fullName }) {
    const access = await organizerAccessModel.findByConferenceAndEmail(conferenceId, email);
    if (!access) throw new ApiError(404, "No invitation found for this email on this conference");
    if (access.password_hash) {
        throw new ApiError(409, "This invitation has already been claimed. Please log in instead.");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const updated = await organizerAccessModel.setPassword(access.id, { passwordHash, fullName });

    const token = signToken({ id: updated.id, role: "organizer", email: updated.email });
    return {
        token,
        organizer: { id: updated.id, fullName: updated.full_name, email: updated.email },
        conferenceId: updated.conference_id,
        accessRole: updated.role
    };
}

async function delegateRegister(body) {
    const conference = await conferenceModel.findById(body.conferenceId);
    if (!conference) throw new ApiError(404, "Selected conference was not found");

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
        const delegateId = await delegateModel.create({
            conferenceId: body.conferenceId,
            fullName: body.fullName,
            email: body.email,
            phone: body.phone,
            passwordHash,
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

        if (!REQUIRE_EMAIL_VERIFICATION) {
            await delegateModel.setEmailVerified(delegate.id);
            const token = signToken({
                id: delegate.id, role: "delegate", email: delegate.email, conferenceId: delegate.conference_id,
                tv: delegate.token_version
            });
            return {
                token,
                delegate: { id: delegate.id, fullName: delegate.full_name, email: delegate.email, status: delegate.status },
                conference: { id: conference.id, name: conference.name }
            };
        }

        const verifyLink = await sendVerificationEmail({
            accountType: "delegate", accountId: delegate.id, email: delegate.email, fullName: delegate.full_name
        });

        return {
            message: "Application submitted. Check your email to verify your address before logging in.",
            delegate: { id: delegate.id, fullName: delegate.full_name, email: delegate.email, status: delegate.status },
            conference: { id: conference.id, name: conference.name },
            ...(process.env.NODE_ENV !== "production" ? { devVerifyLink: verifyLink } : {})
        };
    } catch (err) {
        await connection.rollback();
        if (err.code === "ER_DUP_ENTRY") {
            throw new ApiError(409, "You have already registered for this conference with this email");
        }
        throw err;
    } finally {
        connection.release();
    }
}

async function delegateLogin({ email, password }) {
    const delegate = await delegateModel.findLatestByEmail(email);
    if (!delegate) throw new ApiError(401, "Invalid email or password");

    const matches = await bcrypt.compare(password, delegate.password_hash);
    if (!matches) throw new ApiError(401, "Invalid email or password");

    if (delegate.account_status === "suspended") {
        throw new ApiError(403, "This account has been suspended. Contact your platform administrator.");
    }
    if (REQUIRE_EMAIL_VERIFICATION && !delegate.email_verified) {
        throw new ApiError(403, "Please verify your email before logging in. Check your inbox for the verification link.");
    }

    const token = signToken({
        id: delegate.id, role: "delegate", email: delegate.email, conferenceId: delegate.conference_id,
        tv: delegate.token_version
    });
    return {
        token,
        delegate: { id: delegate.id, fullName: delegate.full_name, email: delegate.email, status: delegate.status }
    };
}

async function requestPasswordReset({ email, conferenceId }) {
    let accountType = null;
    let accountId = null;

    const organizer = await organizerModel.findByEmail(email);
    if (organizer) {
        accountType = "organizer";
        accountId = organizer.id;
    } else if (conferenceId) {
        const access = await organizerAccessModel.findByConferenceAndEmail(conferenceId, email);
        if (access && access.password_hash) {
            accountType = "organizer_access";
            accountId = access.id;
        }
    }

    if (!accountType) {
        const delegate = await delegateModel.findLatestByEmail(email);
        if (delegate) {
            accountType = "delegate";
            accountId = delegate.id;
        }
    }

    const genericResponse = { message: "If an account with that email exists, a reset link has been generated." };
    if (!accountType) return genericResponse;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await passwordResetTokenModel.create({ accountType, accountId, token, expiresAt });

    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
    await emailService.sendMail({
        to: email,
        subject: "Reset your MUN Buddy password",
        html: `<p>We received a request to reset your MUN Buddy password.</p>
               <p><a href="${resetLink}">${resetLink}</a></p>
               <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`
    });

    if (process.env.NODE_ENV !== "production") {
        return { ...genericResponse, devResetLink: resetLink, devToken: token };
    }
    return genericResponse;
}

async function confirmPasswordReset({ token, newPassword }) {
    const record = await passwordResetTokenModel.findValidByToken(token);
    if (!record) throw new ApiError(400, "This reset link is invalid or has expired");

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    if (record.account_type === "organizer") {
        await organizerModel.updatePasswordHash(record.account_id, passwordHash);
    } else if (record.account_type === "organizer_access") {
        await organizerAccessModel.updatePasswordHash(record.account_id, passwordHash);
    } else if (record.account_type === "delegate") {
        await delegateModel.updatePasswordHash(record.account_id, passwordHash);
    }

    await passwordResetTokenModel.markUsed(record.id);
    return { message: "Password has been reset successfully" };
}

async function verifyEmail({ token }) {
    const record = await emailVerificationTokenModel.findValidByToken(token);
    if (!record) throw new ApiError(400, "This verification link is invalid or has expired");

    if (record.account_type === "organizer") {
        await organizerModel.setEmailVerified(record.account_id);
    } else if (record.account_type === "delegate") {
        await delegateModel.setEmailVerified(record.account_id);
    }

    await emailVerificationTokenModel.markUsed(record.id);
    return { accountType: record.account_type, message: "Email verified. You can now log in." };
}

async function resendVerificationEmail({ email, accountType }) {
    const genericResponse = { message: "If an unverified account with that email exists, a new verification link has been sent." };

    const account = accountType === "organizer"
        ? await organizerModel.findByEmail(email)
        : await delegateModel.findLatestByEmail(email);

    if (!account || account.email_verified) return genericResponse;

    const verifyLink = await sendVerificationEmail({
        accountType, accountId: account.id, email: account.email, fullName: account.full_name
    });

    if (process.env.NODE_ENV !== "production") {
        return { ...genericResponse, devVerifyLink: verifyLink };
    }
    return genericResponse;
}

module.exports = {
    organizerRegister, organizerLogin, organizerAccessClaim, delegateRegister, delegateLogin,
    requestPasswordReset, confirmPasswordReset, createConferenceForOrganization,
    verifyEmail, resendVerificationEmail
};
