/**
 * One-off script: creates a "Demo" organization + conference for the
 * existing munbuddy26@gmail.com organizer account, with 3 committees
 * (each with a real agenda item and a country roster chosen to fit that
 * agenda), plus one placeholder OC and one placeholder EB (committee
 * director) invite so the Team Center's tabs have something to show.
 *
 * Not wired into package.json -- run directly with:
 *   node scripts/seedDemoOrg.js
 */
require("dotenv").config();
const pool = require("../src/config/database");
const organizationModel = require("../src/models/organizationModel");
const organizationMemberModel = require("../src/models/organizationMemberModel");
const conferenceModel = require("../src/models/conferenceModel");
const organizerAccessModel = require("../src/models/organizerAccessModel");
const committeeModel = require("../src/models/committeeModel");
const agendaModel = require("../src/models/agendaModel");
const portfolioModel = require("../src/models/portfolioModel");
const { uniqueSlug } = require("../src/utils/slug");
const { generateConferenceCode } = require("../src/utils/conferenceCode");

const OWNER_EMAIL = "munbuddy26@gmail.com";

const COMMITTEES = [
    {
        name: "United Nations Security Council",
        acronym: "UNSC",
        agenda: {
            title: "Addressing Cybersecurity Threats to Critical Infrastructure",
            description:
                "Debating a coordinated international response to state-sponsored and criminal cyberattacks on power grids, financial systems, and healthcare networks.",
        },
        countries: [
            "United States of America", "United Kingdom", "France", "Russia", "China",
            "Germany", "India", "Israel", "Estonia", "Ukraine", "Japan", "Brazil",
        ],
    },
    {
        name: "World Health Organization",
        acronym: "WHO",
        agenda: {
            title: "Strengthening Global Pandemic Preparedness and Equitable Vaccine Distribution",
            description:
                "Examining gaps exposed by recent outbreaks and negotiating a fairer framework for vaccine access and manufacturing capacity in developing nations.",
        },
        countries: [
            "United States of America", "India", "China", "Brazil", "Germany",
            "United Kingdom", "South Africa", "Nigeria", "Indonesia", "France", "Japan", "Kenya",
        ],
    },
    {
        name: "United Nations Environment Programme",
        acronym: "UNEP",
        agenda: {
            title: "Climate Finance and a Just Transition for Developing Nations",
            description:
                "Negotiating how climate adaptation and mitigation funding should be raised and distributed, balancing major emitters' responsibilities against the needs of the most climate-vulnerable states.",
        },
        countries: [
            "United States of America", "China", "India", "Brazil", "Germany", "France",
            "Indonesia", "Nigeria", "Bangladesh", "Maldives", "Tuvalu", "Saudi Arabia",
        ],
    },
];

async function run() {
    const [[owner]] = await pool.query(
        `SELECT id, full_name FROM profiles WHERE email = $1`,
        [OWNER_EMAIL]
    );
    if (!owner) throw new Error(`No profile found for ${OWNER_EMAIL}`);

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const orgName = "Demo";
        const slug = await uniqueSlug(connection, orgName);
        const organizationId = await organizationModel.create(
            { name: orgName, slug, contactEmail: OWNER_EMAIL, description: "Demo organization for exploring MUN Buddy." },
            connection
        );
        await organizationMemberModel.create(
            { organizationId, email: OWNER_EMAIL, profileId: owner.id, orgRole: "owner", status: "active" },
            connection
        );

        const conferenceName = "Demo Model United Nations 2026";
        const conferenceId = await conferenceModel.create(
            {
                createdBy: owner.id,
                organizationId,
                name: conferenceName,
                acronym: "DEMOMUN26",
                description: "A demo conference showing off committees, agendas, and a country roster.",
                startDate: "2026-12-05",
                endDate: "2026-12-07",
                registrationDeadline: "2026-11-20",
                conferenceCode: generateConferenceCode(conferenceName, "DEMOMUN26"),
                status: "published",
                registrationStatus: "closed",
            },
            connection
        );
        await organizerAccessModel.create(
            { conferenceId, email: OWNER_EMAIL, profileId: owner.id, role: "owner" },
            connection
        );

        let firstCommitteeId = null;
        for (const c of COMMITTEES) {
            const committeeId = await committeeModel.create(
                { conferenceId, name: `${c.name} (${c.acronym})`, type: "standard" },
                connection
            );
            if (!firstCommitteeId) firstCommitteeId = committeeId;

            await agendaModel.create(
                { committeeId, title: c.agenda.title, description: c.agenda.description, status: "published" },
                connection
            );
            await portfolioModel.bulkCreate(committeeId, c.countries, "country", connection);
        }

        // Placeholder OC + EB invites so Team Center's OC/EB tabs have
        // something to show -- unclaimed (no profile_id), same as a real
        // pending invitation.
        await organizerAccessModel.create(
            { conferenceId, email: "demo.oc@munbuddy.demo", role: "organizer", positionTitle: "Logistics Coordinator" },
            connection
        );
        await organizerAccessModel.create(
            {
                conferenceId, email: "demo.eb@munbuddy.demo", role: "committee_director",
                committeeId: firstCommitteeId, positionTitle: "Chair",
            },
            connection
        );

        await connection.commit();
        console.log(`Created organization "Demo" (id ${organizationId}), conference "${conferenceName}" (id ${conferenceId})`);
        console.log(`3 committees created, each with an agenda item and ~12 country portfolios.`);
        console.log(`Added 1 demo OC invite (demo.oc@munbuddy.demo) and 1 demo EB invite (demo.eb@munbuddy.demo).`);
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
        process.exit(0);
    }
}

run().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
