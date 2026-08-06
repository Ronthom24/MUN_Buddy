const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { adminClient } = require("../src/utils/supabaseClients");
const platformAdminModel = require("../src/models/platformAdminModel");

/**
 * Supabase-native replacement for the old bcrypt/mysql seeder -- platform
 * admins are Supabase Auth identities now (see platformAuthService.js),
 * flagged as admin via platform_admins(profile_id), not a separate
 * credential store. email_confirm: true skips the verification-email wait,
 * same as authService.getOrCreateProfile does for organizer/delegate
 * registration.
 */
async function findUserByEmail(email) {
    let page = 1;
    // 1000 is the max perPage the admin API accepts.
    for (;;) {
        const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw error;
        const found = data.users.find((u) => u.email === email);
        if (found) return found;
        if (data.users.length < 1000) return null;
        page += 1;
    }
}

async function run() {
    const name = process.env.SUPER_ADMIN_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!name || !email || !password) {
        console.error("SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD must all be set.");
        process.exit(1);
    }

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { full_name: name }
    });

    let profileId;
    if (!createError) {
        profileId = created.user.id;
        console.log(`Platform administrator account created for ${email}.`);
    } else {
        const existing = await findUserByEmail(email);
        if (!existing) throw createError;

        const { error: updateError } = await adminClient.auth.admin.updateUserById(existing.id, { password });
        if (updateError) throw updateError;

        profileId = existing.id;
        console.log(`Platform administrator account already existed for ${email} -- password updated.`);
    }

    await platformAdminModel.create(profileId);
    console.log(`Profile ${profileId} flagged as a platform administrator.`);
}

run().catch((err) => {
    console.error("Seeding platform administrator failed:", err.message);
    process.exit(1);
});
