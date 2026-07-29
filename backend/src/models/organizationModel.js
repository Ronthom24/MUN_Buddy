const pool = require("../config/database");

async function create({ name, slug, description, contactEmail, website }, db = pool) {
    const [rows] = await db.execute(
        `INSERT INTO organizations (name, slug, description, contact_email, website) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [name, slug, description || null, contactEmail || null, website || null]
    );
    return rows[0].id;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
}

async function findBySlug(slug, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizations WHERE slug = $1 AND deleted_at IS NULL`, [slug]);
    return rows[0] || null;
}

async function slugExists(slug, db = pool) {
    const [rows] = await db.execute(`SELECT id FROM organizations WHERE slug = $1`, [slug]);
    return rows.length > 0;
}

async function listByMemberProfile(profileId, db = pool) {
    const [rows] = await db.query(
        `SELECT o.*, om.org_role AS member_role, om.status AS member_status
         FROM organization_members om
         INNER JOIN organizations o ON o.id = om.organization_id
         WHERE om.profile_id = $1 AND o.deleted_at IS NULL AND om.status = 'active'
         ORDER BY o.created_at ASC`,
        [profileId]
    );
    return rows;
}

const UPDATABLE_FIELDS = {
    name: "name",
    description: "description",
    contactEmail: "contact_email",
    website: "website",
    logoPath: "logo_path",
    bannerPath: "banner_path",
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
    await db.execute(`UPDATE organizations SET ${setClauses.join(", ")} WHERE id = $${i}`, params);
    return findById(id, db);
}

async function softDelete(id, db = pool) {
    await db.execute(`UPDATE organizations SET deleted_at = now(), status = 'suspended' WHERE id = $1`, [id]);
}

/** Suspend/reactivate without soft-deleting -- distinct from softDelete above. */
async function setStatus(id, status, db = pool) {
    await db.execute(`UPDATE organizations SET status = $1 WHERE id = $2`, [status, id]);
}

async function getStats(organizationId, db = pool) {
    const [[conferenceCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_conferences,
            COUNT(*) FILTER (WHERE status = 'draft') AS draft_conferences,
            COUNT(*) FILTER (WHERE status = 'published') AS published_conferences,
            COUNT(*) FILTER (WHERE status = 'archived') AS archived_conferences
         FROM conferences WHERE organization_id = $1`,
        [organizationId]
    );
    const [[delegateCounts]] = await db.query(
        `SELECT COUNT(*) AS total_delegates
         FROM delegates d
         INNER JOIN conferences c ON c.id = d.conference_id
         WHERE c.organization_id = $1`,
        [organizationId]
    );
    const [[memberCounts]] = await db.query(
        `SELECT COUNT(*) AS total_members FROM organization_members WHERE organization_id = $1 AND status = 'active'`,
        [organizationId]
    );

    return {
        totalConferences: Number(conferenceCounts.total_conferences) || 0,
        draftConferences: Number(conferenceCounts.draft_conferences) || 0,
        publishedConferences: Number(conferenceCounts.published_conferences) || 0,
        archivedConferences: Number(conferenceCounts.archived_conferences) || 0,
        totalDelegates: Number(delegateCounts.total_delegates) || 0,
        totalMembers: Number(memberCounts.total_members) || 0
    };
}

async function listPublic({ search } = {}, db = pool) {
    const clauses = ["status = 'active'", "is_publicly_listed = TRUE", "deleted_at IS NULL"];
    const params = [];
    if (search) {
        clauses.push(`name ILIKE $1`);
        params.push(`%${search}%`);
    }

    const [rows] = await db.query(
        `SELECT o.*,
                (SELECT COUNT(*) FROM conferences c WHERE c.organization_id = o.id AND c.status = 'published') AS conference_count,
                (SELECT COUNT(*) FROM conferences c WHERE c.organization_id = o.id AND c.status = 'published'
                    AND c.start_date >= CURRENT_DATE) AS upcoming_conference_count
         FROM organizations o WHERE ${clauses.join(" AND ")} ORDER BY o.name ASC`,
        params
    );
    return rows;
}

async function findPublicBySlug(slug, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organizations WHERE slug = $1 AND status = 'active' AND is_publicly_listed = TRUE AND deleted_at IS NULL`,
        [slug]
    );
    return rows[0] || null;
}

module.exports = {
    create, findById, findBySlug, slugExists, listByMemberProfile, update, softDelete, setStatus, getStats,
    listPublic, findPublicBySlug
};
