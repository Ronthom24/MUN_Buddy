const pool = require("../config/database");

async function create(data, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO conferences
            (created_by, organization_id, name, acronym, short_name, institution, location, website, description,
             start_date, end_date, registration_deadline, max_delegates, conference_code,
             status, registration_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
        [
            data.createdBy,
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
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM conferences WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
}

/** Every conference this profile can access: a direct organizer_access grant, or via organization ownership/admin. */
async function listByAccessProfile(profileId, db = pool) {
    const [rows] = await db.query(
        `SELECT c.*, oa.role AS access_role, oa.committee_id AS access_committee_id, FALSE AS via_organization
         FROM organizer_access oa
         INNER JOIN conferences c ON c.id = oa.conference_id
         WHERE oa.profile_id = $1 AND oa.status = 'active' AND c.deleted_at IS NULL

         UNION

         SELECT c.*, 'owner' AS access_role, NULL AS access_committee_id, TRUE AS via_organization
         FROM organization_members om
         INNER JOIN conferences c ON c.organization_id = om.organization_id
         WHERE om.profile_id = $1 AND om.status = 'active' AND om.org_role IN ('owner', 'admin')
           AND c.deleted_at IS NULL
           AND c.id NOT IN (SELECT conference_id FROM organizer_access WHERE profile_id = $1 AND status = 'active')

         ORDER BY created_at DESC`,
        [profileId]
    );
    return rows;
}

async function listByOrganization(organizationId, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM conferences WHERE organization_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
        [organizationId]
    );
    return rows;
}

async function remove(id, db = pool) {
    await db.execute(`UPDATE conferences SET deleted_at = now() WHERE id = $1`, [id]);
}

async function restore(id, db = pool) {
    await db.execute(`UPDATE conferences SET deleted_at = NULL WHERE id = $1`, [id]);
    return findById(id, db);
}

async function listTrashedByOrganization(organizationId, db = pool) {
    const [rows] = await db.query(
        `SELECT * FROM conferences WHERE organization_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
        [organizationId]
    );
    return rows;
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
    maxDelegates: "max_delegates", status: "status", registrationStatus: "registration_status",
    isPubliclyListed: "is_publicly_listed"
};

async function update(id, data, db = pool) {
    const setClauses = [];
    const params = [];
    let i = 1;

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = $${i++}`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE conferences SET ${setClauses.join(", ")} WHERE id = $${i}`, params);
    return findById(id, db);
}

async function updatePaymentConfig(id, { paymentRequired, currency }, db = pool) {
    const setClauses = [];
    const params = [];
    let i = 1;

    if (paymentRequired !== undefined) {
        setClauses.push(`payment_required = $${i++}`);
        params.push(Boolean(paymentRequired));
    }
    if (currency !== undefined) {
        setClauses.push(`currency = $${i++}`);
        params.push(currency);
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE conferences SET ${setClauses.join(", ")} WHERE id = $${i}`, params);
    return findById(id, db);
}

async function publishResults(id, db = pool) {
    await db.execute(`UPDATE conferences SET results_published = TRUE, results_published_at = now() WHERE id = $1`, [id]);
    return findById(id, db);
}

async function getStats(conferenceId, db = pool) {
    const [[delegateCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_delegates,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_delegates,
            COUNT(*) FILTER (WHERE status = 'approved') AS approved_delegates,
            COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_delegates
         FROM delegates WHERE conference_id = $1`,
        [conferenceId]
    );
    const [[committeeCounts]] = await db.query(
        `SELECT COUNT(*) AS total_committees FROM committees WHERE conference_id = $1`,
        [conferenceId]
    );
    const [[assignmentCounts]] = await db.query(
        `SELECT COUNT(*) FILTER (WHERE a.status = 'assigned') AS assigned_delegates,
                COUNT(*) FILTER (WHERE a.published = TRUE) AS published_assignments
         FROM assignments a
         INNER JOIN delegates d ON d.id = a.delegate_id
         WHERE d.conference_id = $1`,
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
            COUNT(*) FILTER (WHERE status = 'approved') AS approved_delegates
         FROM delegates WHERE conference_id = $1`,
        [conferenceId]
    );

    const [committeeDemand] = await db.query(
        `SELECT c.id AS committee_id, c.name AS committee_name, COUNT(*) AS preference_count
         FROM delegate_committee_preferences dcp
         INNER JOIN delegates d ON d.id = dcp.delegate_id
         INNER JOIN committees c ON c.id = dcp.committee_id
         WHERE d.conference_id = $1
         GROUP BY c.id, c.name
         ORDER BY preference_count DESC`,
        [conferenceId]
    );

    const [registrationsByDay] = await db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM delegates WHERE conference_id = $1
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

async function listPublic({ search, country, month, registrationStatus, organizationSlug } = {}, db = pool) {
    const clauses = ["c.status = 'published'", "c.deleted_at IS NULL", "c.is_publicly_listed = TRUE", "o.is_publicly_listed = TRUE"];
    const params = [];
    let i = 1;

    if (search) {
        clauses.push(`(c.name ILIKE $${i} OR c.acronym ILIKE $${i} OR o.name ILIKE $${i})`);
        params.push(`%${search}%`);
        i++;
    }
    if (country) {
        clauses.push(`c.location ILIKE $${i++}`);
        params.push(`%${country}%`);
    }
    if (month) {
        clauses.push(`EXTRACT(MONTH FROM c.start_date) = $${i++}`);
        params.push(month);
    }
    if (registrationStatus) {
        clauses.push(`c.registration_status = $${i++}`);
        params.push(registrationStatus);
    }
    if (organizationSlug) {
        clauses.push(`o.slug = $${i++}`);
        params.push(organizationSlug);
    }

    const [rows] = await db.query(
        `SELECT c.*, o.name AS organization_name, o.slug AS organization_slug, o.logo_path AS organization_logo_path,
                (SELECT COUNT(*) FROM committees WHERE conference_id = c.id) AS committee_count
         FROM conferences c
         INNER JOIN organizations o ON o.id = c.organization_id
         WHERE ${clauses.join(" AND ")}
         ORDER BY c.start_date ASC`,
        params
    );
    return rows;
}

async function findPublicBySlug(slug, db = pool) {
    const [rows] = await db.query(
        `SELECT c.*, o.name AS organization_name, o.slug AS organization_slug, o.logo_path AS organization_logo_path
         FROM conferences c
         INNER JOIN organizations o ON o.id = c.organization_id
         WHERE c.slug = $1 AND c.status = 'published' AND c.deleted_at IS NULL
           AND c.is_publicly_listed = TRUE AND o.is_publicly_listed = TRUE`,
        [slug]
    );
    return rows[0] || null;
}

module.exports = {
    create, findById, listByAccessProfile, listByOrganization, listOpenForRegistration, update, remove,
    updatePaymentConfig, publishResults, getStats, getAnalytics, listPublic, findPublicBySlug,
    restore, listTrashedByOrganization
};
