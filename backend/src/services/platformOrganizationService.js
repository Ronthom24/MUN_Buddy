const pool = require("../config/database");
const ApiError = require("../utils/ApiError");
const organizationModel = require("../models/organizationModel");

async function listOrganizations({ search, status } = {}, db = pool) {
    const clauses = ["deleted_at IS NULL"];
    const params = [];
    if (search) {
        clauses.push("name LIKE ?");
        params.push(`%${search}%`);
    }
    if (status) {
        clauses.push("status = ?");
        params.push(status);
    }

    const [rows] = await db.query(
        `SELECT o.*,
                (SELECT COUNT(*) FROM conferences c WHERE c.organization_id = o.id) AS conference_count,
                (SELECT COUNT(*) FROM organization_members m WHERE m.organization_id = o.id AND m.status = 'active') AS member_count
         FROM organizations o WHERE ${clauses.join(" AND ")} ORDER BY o.created_at DESC`,
        params
    );
    return rows;
}

async function getOrganization(id, db = pool) {
    const organization = await organizationModel.findById(id, db);
    if (!organization) throw new ApiError(404, "Organization not found");

    const stats = await organizationModel.getStats(id, db);
    const [conferences] = await db.query(
        `SELECT id, name, status, registration_status, start_date, end_date, admin_disabled
         FROM conferences WHERE organization_id = ? ORDER BY start_date DESC`,
        [id]
    );

    return { organization, stats, conferences };
}

async function setOrganizationStatus(id, status, db = pool) {
    if (!["active", "suspended"].includes(status)) {
        throw new ApiError(400, "status must be 'active' or 'suspended'");
    }
    const organization = await organizationModel.findById(id, db);
    if (!organization) throw new ApiError(404, "Organization not found");
    await organizationModel.setStatus(id, status, db);
    return organizationModel.findById(id, db);
}

async function deleteOrganization(id, db = pool) {
    const organization = await organizationModel.findById(id, db);
    if (!organization) throw new ApiError(404, "Organization not found");
    await organizationModel.softDelete(id, db);
}

module.exports = { listOrganizations, getOrganization, setOrganizationStatus, deleteOrganization };
