/**
 * One-off script: adds 4 approved, published delegates to each of the 3
 * committees on the Demo conference (seedDemoOrg.js), each assigned to a
 * real portfolio from that committee's roster. Each delegate gets its own
 * Supabase Auth identity (delegates never need email verification, same
 * as a real delegate registration -- see authService.getOrCreateProfile).
 *
 * Not wired into package.json -- run directly with:
 *   node scripts/seedDemoDelegates.js
 */
require("dotenv").config();
const pool = require("../src/config/database");
const { adminClient, authClient } = require("../src/utils/supabaseClients");
const delegateModel = require("../src/models/delegateModel");
const assignmentModel = require("../src/models/assignmentModel");

const CONFERENCE_ID = 23;
const DEMO_PASSWORD = "Demo1234!";

const COMMITTEE_DELEGATES = {
    "United Nations Security Council (UNSC)": [
        { name: "Ava Thompson", country: "United States of America", exp: "10+" },
        { name: "Dmitri Volkov", country: "Russia", exp: "4-10" },
        { name: "Li Wei", country: "China", exp: "4-10" },
        { name: "Hannah Fischer", country: "Germany", exp: "1-3" },
    ],
    "World Health Organization (WHO)": [
        { name: "Priya Nair", country: "India", exp: "4-10" },
        { name: "Lucas Almeida", country: "Brazil", exp: "1-3" },
        { name: "Thandiwe Dlamini", country: "South Africa", exp: "beginner" },
        { name: "Chidi Okafor", country: "Nigeria", exp: "1-3" },
    ],
    "United Nations Environment Programme (UNEP)": [
        { name: "Aisha Hassan", country: "Maldives", exp: "beginner" },
        { name: "Sione Taufa", country: "Tuvalu", exp: "beginner" },
        { name: "Fahad Al-Rashid", country: "Saudi Arabia", exp: "4-10" },
        { name: "Dewi Putri", country: "Indonesia", exp: "1-3" },
    ],
};

async function createDelegateProfile(email, fullName) {
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: fullName },
    });
    if (!createError) return created.user.id;

    // Already exists from a prior run -- sign in to get the same profile id.
    const { data: signedIn, error: signInError } = await authClient.auth.signInWithPassword({ email, password: DEMO_PASSWORD });
    if (signInError) throw new Error(`Could not create or sign in ${email}: ${signInError.message}`);
    return signedIn.user.id;
}

async function run() {
    const [committees] = await pool.query(
        `SELECT id, name FROM committees WHERE conference_id = $1`,
        [CONFERENCE_ID]
    );

    for (const committee of committees) {
        const delegates = COMMITTEE_DELEGATES[committee.name];
        if (!delegates) {
            console.log(`Skipping "${committee.name}" -- no delegate list defined for it.`);
            continue;
        }

        for (const d of delegates) {
            const [[portfolio]] = await pool.query(
                `SELECT id FROM portfolios WHERE committee_id = $1 AND name = $2`,
                [committee.id, d.country]
            );
            if (!portfolio) {
                console.log(`  Skipping ${d.name} -- no "${d.country}" portfolio on "${committee.name}"`);
                continue;
            }

            const slug = d.name.toLowerCase().replace(/[^a-z]+/g, ".");
            const email = `demo.${slug}@munbuddy.demo`;
            const profileId = await createDelegateProfile(email, d.name);

            const connection = await pool.getConnection();
            try {
                await connection.beginTransaction();

                const existing = await delegateModel.findByConferenceAndProfile(CONFERENCE_ID, profileId, connection);
                const delegateId = existing
                    ? existing.id
                    : await delegateModel.create(
                        { conferenceId: CONFERENCE_ID, profileId, school: "Demo High School", grade: "11th Grade", munExperience: d.exp },
                        connection
                    );

                if (!existing || existing.status !== "approved") {
                    await delegateModel.updateStatus(delegateId, "approved", connection);
                }

                await assignmentModel.assign(
                    delegateId, { committeeId: committee.id, portfolioId: portfolio.id, publish: true }, connection
                );

                await connection.commit();
                console.log(`  ${d.name} (${d.country}) -> ${committee.name}`);
            } catch (err) {
                await connection.rollback();
                console.error(`  Failed for ${d.name}:`, err.message);
            } finally {
                connection.release();
            }
        }
    }

    console.log("Done.");
    process.exit(0);
}

run().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
