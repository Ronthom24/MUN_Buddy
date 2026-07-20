const ApiError = require("../utils/ApiError");
const attendanceModel = require("../models/attendanceModel");
const scheduleModel = require("../models/scheduleModel");
const delegateModel = require("../models/delegateModel");
const assignmentModel = require("../models/assignmentModel");
const { generateToken, tokenToDataUrl } = require("../utils/checkinQr");

async function getOrCreateOwnToken(delegateId) {
    let row = await attendanceModel.findTokenByDelegate(delegateId);
    if (!row) row = await attendanceModel.createToken(delegateId, generateToken());

    const qrDataUrl = await tokenToDataUrl(row.token);
    return { token: row.token, qrDataUrl };
}

async function resolveEventForConference(conferenceId, scheduleEventId) {
    const event = await scheduleModel.findEventById(scheduleEventId);
    if (!event) throw new ApiError(404, "Session not found");

    const day = await scheduleModel.findDayById(event.schedule_day_id);
    if (!day || day.conference_id !== conferenceId) throw new ApiError(404, "Session not found");

    return event;
}

async function checkIn(conferenceId, scheduleEventId, { delegateId, token }, checkedInByAccessId) {
    const event = await resolveEventForConference(conferenceId, scheduleEventId);

    let resolvedDelegateId = delegateId;
    let method = "manual";

    if (token) {
        const tokenRow = await attendanceModel.findByToken(token);
        if (!tokenRow) throw new ApiError(404, "This check-in code was not recognized");
        resolvedDelegateId = tokenRow.delegate_id;
        method = "qr_token";
    }

    const delegate = await delegateModel.findById(resolvedDelegateId);
    if (!delegate || delegate.conference_id !== conferenceId) throw new ApiError(404, "Delegate not found in this conference");

    // Committee-scoped events (spec: "Session Attendance") only expect delegates
    // assigned to that committee. Without this check, checking in a delegate who
    // isn't on the event's roster inflates checkedInCount past expectedCount in
    // getAnalytics, producing attendance rates over 100%.
    if (event.committee_id) {
        const assignments = await assignmentModel.listByConference(conferenceId);
        const onRoster = assignments.some(
            (a) => a.delegate_id === resolvedDelegateId && a.committee_id === event.committee_id && a.status === "assigned"
        );
        if (!onRoster) throw new ApiError(403, "This delegate isn't assigned to this session's committee");
    }

    const existing = await attendanceModel.findAttendanceRecord(event.id, resolvedDelegateId);
    if (existing) return { record: existing, alreadyCheckedIn: true, delegateName: delegate.full_name };

    const record = await attendanceModel.checkIn({
        scheduleEventId: event.id, delegateId: resolvedDelegateId, checkedInByAccessId, method
    });
    return { record, alreadyCheckedIn: false, delegateName: delegate.full_name };
}

async function undoCheckIn(conferenceId, scheduleEventId, delegateId) {
    await resolveEventForConference(conferenceId, scheduleEventId);
    await attendanceModel.removeCheckIn(scheduleEventId, delegateId);
}

/**
 * Expected roster for a session (spec: "Session Attendance"): delegates
 * assigned to the event's committee if it's committee-scoped, otherwise
 * every approved delegate in the conference (general events/ceremonies).
 */
async function getRosterForEvent(conferenceId, scheduleEventId) {
    const event = await resolveEventForConference(conferenceId, scheduleEventId);

    let expected;
    if (event.committee_id) {
        const assignments = await assignmentModel.listByConference(conferenceId);
        expected = assignments.filter((a) => a.committee_id === event.committee_id && a.status === "assigned");
    } else {
        const delegates = await delegateModel.listByConference(conferenceId, { status: "approved" });
        expected = delegates.map((d) => ({ delegate_id: d.id, delegate_name: d.full_name }));
    }

    const records = await attendanceModel.listForEvent(event.id);
    const recordsByDelegate = new Map(records.map((r) => [r.delegate_id, r]));

    const roster = expected.map((row) => {
        const record = recordsByDelegate.get(row.delegate_id);
        return {
            delegateId: row.delegate_id,
            delegateName: row.delegate_name,
            checkedIn: Boolean(record),
            checkedInAt: record?.checked_in_at || null,
            method: record?.method || null
        };
    });

    return { event, roster };
}

async function getAnalytics(conferenceId) {
    const summaries = await attendanceModel.getEventSummaries(conferenceId);
    const approvedDelegates = await delegateModel.listByConference(conferenceId, { status: "approved" });
    const assignments = await assignmentModel.listByConference(conferenceId);

    const events = summaries.map((row) => {
        const expectedCount = row.committee_id
            ? assignments.filter((a) => a.committee_id === row.committee_id && a.status === "assigned").length
            : approvedDelegates.length;
        return {
            scheduleEventId: row.schedule_event_id,
            title: row.title,
            type: row.type,
            startTime: row.start_time,
            checkedInCount: Number(row.checked_in_count),
            expectedCount,
            // Clamped to 1.0: expectedCount is the *current* roster, recomputed
            // live on every call, while checkedInCount is a historical count of
            // check-ins -- a delegate checked in before being reassigned/removed
            // from the committee still counts, which can otherwise push this
            // over 100%.
            attendanceRate: expectedCount > 0 ? Math.min(1, Number((Number(row.checked_in_count) / expectedCount).toFixed(2))) : 0
        };
    });

    const totalCheckIns = events.reduce((sum, e) => sum + e.checkedInCount, 0);
    const totalExpected = events.reduce((sum, e) => sum + e.expectedCount, 0);

    return {
        events,
        overallAttendanceRate: totalExpected > 0 ? Math.min(1, Number((totalCheckIns / totalExpected).toFixed(2))) : 0
    };
}

module.exports = { getOrCreateOwnToken, checkIn, undoCheckIn, getRosterForEvent, getAnalytics };
