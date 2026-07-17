const pool = require("../config/database");

async function create({ name, slug, description, contactEmail, website }, db = pool) {
    const [result] = await db.execute(
        `INSERT INTO organizations (name, slug, description, contact_email, website) VALUES (?, ?, ?, ?, ?)`,
        [name, slug, description || null, contactEmail || null, website || null]
    );
    return result.insertId;
}

async function findById(id, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizations WHERE id = ? AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
}

async function findBySlug(slug, db = pool) {
    const [rows] = await db.execute(`SELECT * FROM organizations WHERE slug = ? AND deleted_at IS NULL`, [slug]);
    return rows[0] || null;
}

async function slugExists(slug, db = pool) {
    const [rows] = await db.execute(`SELECT id FROM organizations WHERE slug = ?`, [slug]);
    return rows.length > 0;
}

async function listByMemberEmail(email, db = pool) {
    const [rows] = await db.query(
        `SELECT o.*, om.org_role AS member_role, om.status AS member_status
         FROM organization_members om
         INNER JOIN organizations o ON o.id = om.organization_id
         WHERE om.email = ? AND o.deleted_at IS NULL AND om.status = 'active'
         ORDER BY o.created_at ASC`,
        [email]
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

    for (const [key, column] of Object.entries(UPDATABLE_FIELDS)) {
        if (data[key] !== undefined) {
            setClauses.push(`${column} = ?`);
            params.push(data[key]);
        }
    }

    if (setClauses.length === 0) return findById(id, db);

    params.push(id);
    await db.execute(`UPDATE organizations SET ${setClauses.join(", ")} WHERE id = ?`, params);
    return findById(id, db);
}

async function softDelete(id, db = pool) {
    await db.execute(`UPDATE organizations SET deleted_at = NOW(), status = 'suspended' WHERE id = ?`, [id]);
}

/** Suspend/reactivate without soft-deleting -- distinct from softDelete above. */
async function setStatus(id, status, db = pool) {
    await db.execute(`UPDATE organizations SET status = ? WHERE id = ?`, [status, id]);
}

async function getStats(organizationId, db = pool) {
    const [[conferenceCounts]] = await db.query(
        `SELECT
            COUNT(*) AS total_conferences,
            SUM(status = 'draft') AS draft_conferences,
            SUM(status = 'published') AS published_conferences,
            SUM(status = 'archived') AS archived_conferences
         FROM conferences WHERE organization_id = ?`,
        [organizationId]
    );
    const [[delegateCounts]] = await db.query(
        `SELECT COUNT(*) AS total_delegates
         FROM delegates d
         INNER JOIN conferences c ON c.id = d.conference_id
         WHERE c.organization_id = ?`,
        [organizationId]
    );
    const [[memberCounts]] = await db.query(
        `SELECT COUNT(*) AS total_members FROM organization_members WHERE organization_id = ? AND status = 'active'`,
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
        clauses.push("name LIKE ?");
        params.push(`%${search}%`);
    }

    const [rows] = await db.query(
        `SELECT o.*,
                (SELECT COUNT(*) FROM conferences c WHERE c.organization_id = o.id AND c.status = 'published') AS conference_count,
                (SELECT COUNT(*) FROM conferences c WHERE c.organization_id = o.id AND c.status = 'published'
                    AND c.start_date >= CURDATE()) AS upcoming_conference_count
         FROM organizations o WHERE ${clauses.join(" AND ")} ORDER BY o.name ASC`,
        params
    );
    return rows;
}

async function findPublicBySlug(slug, db = pool) {
    const [rows] = await db.execute(
        `SELECT * FROM organizations WHERE slug = ? AND status = 'active' AND is_publicly_listed = TRUE AND deleted_at IS NULL`,
        [slug]
    );
    return rows[0] || null;
}

module.exports = {
    create, findById, findBySlug, slugExists, listByMemberEmail, update, softDelete, setStatus, getStats,
    listPublic, findPublicBySlug
};
