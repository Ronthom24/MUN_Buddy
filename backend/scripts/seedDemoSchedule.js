/**
 * One-off script: builds a proper 3-day schedule for the Demo conference --
 * opening ceremony, 5 committee session slots (each running in parallel
 * across all 3 committees), a social event, and a closing ceremony.
 *
 * Not wired into package.json -- run directly with:
 *   node scripts/seedDemoSchedule.js
 */
require("dotenv").config();
const pool = require("../src/config/database");
const scheduleModel = require("../src/models/scheduleModel");

const CONFERENCE_ID = 23;

const DAYS = [
    {
        date: "2026-12-05",
        label: "Day 1",
        events: [
            { title: "Opening Ceremony", type: "ceremony", location: "Main Auditorium", start: "09:00", end: "10:00" },
            { title: "Committee Session I", type: "committee_session", perCommittee: true, start: "10:30", end: "13:00" },
            { title: "Committee Session II", type: "committee_session", perCommittee: true, start: "14:00", end: "17:00" },
        ],
    },
    {
        date: "2026-12-06",
        label: "Day 2",
        events: [
            { title: "Committee Session III", type: "committee_session", perCommittee: true, start: "09:30", end: "12:30" },
            { title: "Committee Session IV", type: "committee_session", perCommittee: true, start: "13:30", end: "16:30" },
            { title: "Cultural Night", type: "general_event", location: "Banquet Hall", start: "18:00", end: "20:00" },
        ],
    },
    {
        date: "2026-12-07",
        label: "Day 3",
        events: [
            { title: "Committee Session V", type: "committee_session", perCommittee: true, start: "09:00", end: "11:30" },
            { title: "Draft Resolution Voting", type: "committee_session", perCommittee: true, start: "12:00", end: "14:00" },
            { title: "Closing Ceremony", type: "ceremony", location: "Main Auditorium", start: "15:00", end: "16:30" },
        ],
    },
];

async function run() {
    const [committees] = await pool.query(
        `SELECT id, name FROM committees WHERE conference_id = $1 ORDER BY name ASC`,
        [CONFERENCE_ID]
    );
    if (committees.length === 0) throw new Error("No committees found for this conference.");

    for (const day of DAYS) {
        const [[existingDay]] = await pool.query(
            `SELECT id FROM conference_schedule_days WHERE conference_id = $1 AND day_date = $2`,
            [CONFERENCE_ID, day.date]
        );
        const dayId = existingDay
            ? existingDay.id
            : await scheduleModel.createDay({ conferenceId: CONFERENCE_ID, dayDate: day.date, label: day.label });

        console.log(`${day.label} (${day.date}):`);

        for (const event of day.events) {
            if (event.perCommittee) {
                for (const committee of committees) {
                    await scheduleModel.createEvent({
                        scheduleDayId: dayId,
                        committeeId: committee.id,
                        title: event.title,
                        type: event.type,
                        location: `Committee Room — ${committee.name}`,
                        startTime: event.start,
                        endTime: event.end,
                    });
                    console.log(`  ${event.start}-${event.end}  ${event.title}  [${committee.name}]`);
                }
            } else {
                await scheduleModel.createEvent({
                    scheduleDayId: dayId,
                    title: event.title,
                    type: event.type,
                    location: event.location,
                    startTime: event.start,
                    endTime: event.end,
                });
                console.log(`  ${event.start}-${event.end}  ${event.title}`);
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
