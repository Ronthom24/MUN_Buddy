const pool = require("../config/database");
const ApiError = require("../utils/ApiError");
const conferenceModel = require("../models/conferenceModel");

async function listConferences({ search, organizationId, status } = {}, db = pool) {
    const clauses = ["c.deleted_at IS NULL"];
    const params = [];
    if (search) {
        clauses.push("(c.name LIKE ? OR c.acronym LIKE ?)");
        const like = `%${search}%`;
        params.push(like, like);
    }
    if (organizationId) {
        clauses.push("c.organization_id = ?");
        params.push(organizationId);
    }
    if (status) {
        clauses.push("c.status = ?");
        params.push(status);
    }

    const [rows] = await db.query(
        `SELECT c.id, c.name, c.acronym, c.status, c.registration_status, c.admin_disabled,
                c.start_date, c.end_date, c.organization_id, o.name AS organization_name,
                (SELECT COUNT(*) FROM delegates d WHERE d.conference_id = c.id) AS delegate_count
         FROM conferences c
         INNER JOIN organizations o ON o.id = c.organization_id
         WHERE ${clauses.join(" AND ")}
         ORDER BY c.created_at DESC`,
        params
    );
    return rows;
}

async function getConference(id, db = pool) {
    const conference = await conferenceModel.findById(id, db);
    if (!conference) throw new ApiError(404, "Conference not found");
    return conference;
}

async function setArchived(id, db = pool) {
    const conference = await conferenceModel.findById(id, db);
    if (!conference) throw new ApiError(404, "Conference not found");
    await db.execute(`UPDATE conferences SET status = 'archived' WHERE id = ?`, [id]);
    return conferenceModel.findById(id, db);
}

async function setDisabled(id, disabled, db = pool) {
    const conference = await conferenceModel.findById(id, db);
    if (!conference) throw new ApiError(404, "Conference not found");
    await db.execute(`UPDATE conferences SET admin_disabled = ? WHERE id = ?`, [disabled ? 1 : 0, id]);
    return conferenceModel.findById(id, db);
}

module.exports = { listConferences, getConference, setArchived, setDisabled };
