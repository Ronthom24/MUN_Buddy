const pool = require("../config/database");

async function create(data, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO conferences
            (organizer_id, organization_id, name, acronym, short_name, institution, location, website, description,
             start_date, end_date, registration_deadline, max_delegates, conference_code,
             status, registration_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            data.organizerId,
            data.organizationId,
            data.name,
            data.acronym || null,
            data.shortName || null,
            data.institution || null,
            data.location || null,
            data.website || null,
            data.description || null,
            data.startDate,
            data.endDate,
            data.registrationDeadline,
            data.maxDelegates || null,
            data.conferenceCode,
            data.status || "draft",
            data.registrationStatus || "closed"
        ]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM conferences WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function listByOrganizer(organizerId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM conferences WHERE organizer_id = ? ORDER BY created_at DESC`,
        [organizerId]
    );
    return rows;
}

async function listByAccessEmail(email, db = pool) {
    const [rows] = await db.query(
        `SELECT c.*, oa.role AS access_role, oa.committee_id AS access_committee_id, FALSE AS via_organization
         FROM organizer_access oa
         INNER JOIN conferences c ON c.id = oa.conference_id
         WHERE oa.email = ?

         UNION

         SELECT c.*, 'owner' AS access_role, NULL AS access_committee_id, TRUE AS via_organization
         FROM organization_members om
         INNER JOIN conferences c ON c.organization_id = om.organization_id
         WHERE om.email = ? AND om.status = 'active' AND om.org_role IN ('owner', 'admin')
           AND c.id NOT IN (SELECT conference_id FROM organizer_access WHERE email = ?)

         ORDER BY created_at DESC`,
        [email, email, email]
    );
    return rows;
}

async function listByOrganization(organizationId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM conferences WHERE organization_id = ? ORDER BY created_at DESC`,
        [organizationId]
    );
    return rows;
}

async function remove(id, db = pool) {
    await db.execute(`DELETE FROM conferences WHERE id = ?`, [id]);
}

async function listOpenForRegistration(db = pool) {
    const [rows] = await db.execute(
        `SELECT id, name, acronym, start_date, end_date FROM conferences
         WHERE registration_status = 'open' ORDER BY start_date ASC`
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    name: "name", acronym: "acronym", shortName: "short_name", institution: "institution",
    location: "location", website: "website", description: "description",
    startDate: "start_date", endDate: "end_date", registrationDeadline: "registration_deadline",
    maxDelegates: "max_delegates", status: "status", registrationStatus: "registration_status"
};

async function update(id, data, db = pool) {
    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE conferences SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function getStats(conferenceId, db = pool) {
    const [[delegateCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_delegates,
            SUM(status = 'pending') AS pending_delegates,
            SUM(status = 'approved') AS approved_delegates,
            SUM(status = 'rejected') AS rejected_delegates
         FROM delegates WHERE conference_id = ?`,
        [conferenceId]
    );
    const [[committeeCounts]] = await db.query(
        `SELECT COUNT(*) AS total_committees FROM committees WHERE conference_id = ?`,
        [conferenceId]
    );
    const [[assignmentCounts]] = await db.query(
        `SELECT SUM(a.status = 'assigned') AS assigned_delegates, SUM(a.published = 1) AS published_assignments
         FROM assignments a
         INNER JOIN delegates d ON d.id = a.delegate_id
         WHERE d.conference_id = ?`,
        [conferenceId]
    );

    return {
        totalDelegates: Number(delegateCounts.total_delegates) || 0,
        pendingDelegates: Number(delegateCounts.pending_delegates) || 0,
        approvedDelegates: Number(delegateCounts.approved_delegates) || 0,
        rejectedDelegates: Number(delegateCounts.rejected_delegates) || 0,
        totalCommittees: Number(committeeCounts.total_committees) || 0,
        assignedDelegates: Number(assignmentCounts.assigned_delegates) || 0,
        publishedAssignments: Number(assignmentCounts.published_assignments) || 0
    };
}

async function getAnalytics(conferenceId, db = pool) {
    const [[approval]] = await db.query(
        `SELECT
            COUNT(*) AS total_delegates,
            SUM(status = 'approved') AS approved_delegates
         FROM delegates WHERE conference_id = ?`,
        [conferenceId]
    );

    const [committeeDemand] = await db.query(
        `SELECT c.id AS committee_id, c.name AS committee_name, COUNT(*) AS preference_count
         FROM delegate_committee_preferences dcp
         INNER JOIN delegates d ON d.id = dcp.delegate_id
         INNER JOIN committees c ON c.id = dcp.committee_id
         WHERE d.conference_id = ?
         GROUP BY c.id, c.name
         ORDER BY preference_count DESC`,
        [conferenceId]
    );

    const [registrationsByDay] = await db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM delegates WHERE conference_id = ?
         GROUP BY DATE(created_at)
         ORDER BY day ASC`,
        [conferenceId]
    );

    const total = Number(approval.total_delegates) || 0;
    const approved = Number(approval.approved_delegates) || 0;

    return {
        approvalRate: total > 0 ? Number((approved / total).toFixed(2)) : 0,
        totalDelegates: total,
        approvedDelegates: approved,
        committeeDemand: committeeDemand.map((row) => ({
            committeeId: row.committee_id,
            committeeName: row.committee_name,
            preferenceCount: Number(row.preference_count)
        })),
        registrationsByDay: registrationsByDay.map((row) => ({
            day: row.day,
            count: Number(row.count)
        }))
    };
}

module.exports = {
    create, findById, listByOrganizer, listByAccessEmail, listByOrganization, listOpenForRegistration, update, remove,
    getStats, getAnalytics
};
