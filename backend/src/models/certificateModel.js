const pool = require("../config/database");

async function create(
    { certificateNumber, conferenceId, delegateId, templateId, awardId, certificateType, issuedByAccessId },
    db = pool
) {
    const [result] = await db.execute(
        `INSERT INTO certificates (certificate_number, conference_id, delegate_id, template_id, award_id, certificate_type, issued_by_organizer_access_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [certificateNumber, conferenceId, delegateId, templateId, awardId || null, certificateType || "participation", issuedByAccessId || null]
    );
    return findById(result.insertId, db);
}

async function findById(id, db = pool) {
    const [rows] = await db.query(
        `SELECT cert.*, d.full_name AS delegate_name, d.email AS delegate_email, ct.name AS template_name
         FROM certificates cert
         INNER JOIN delegates d ON d.id = cert.delegate_id
         INNER JOIN certificate_templates ct ON ct.id = cert.template_id
         WHERE cert.id = ?`,
        [id]
    );
    return rows[0] || null;
}

async function findByNumber(certificateNumber, db = pool) {
    const [rows] = await db.query(
        `SELECT cert.*, d.full_name AS delegate_name, c.name AS conference_name
         FROM certificates cert
         INNER JOIN delegates d ON d.id = cert.delegate_id
         INNER JOIN conferences c ON c.id = cert.conference_id
         WHERE cert.certificate_number = ?`,
        [certificateNumber]
    );
    return rows[0] || null;
}

/**
 * Full join needed to render a PDF on demand: certificate + template +
 * conference + delegate + (optional) award, since nothing is stored as a
 * file (spec 19.17 -- the structured record is the permanent source of
 * truth, the PDF is a pure function of it).
 */
async function findRenderContext(id, db = pool) {
    const [rows] = await db.query(
        `SELECT
            cert.*,
            d.full_name AS delegate_full_name,
            c.name AS conference_name, c.start_date AS conference_start_date, c.end_date AS conference_end_date,
            ct.title AS template_title, ct.body_text AS template_body_text, ct.accent_color AS template_accent_color,
            ct.signatory_name AS template_signatory_name, ct.signatory_title AS template_signatory_title,
            a.category AS award_category,
            aw_committee.name AS award_committee_name, aw_portfolio.name AS award_portfolio_name
         FROM certificates cert
         INNER JOIN delegates d ON d.id = cert.delegate_id
         INNER JOIN conferences c ON c.id = cert.conference_id
         INNER JOIN certificate_templates ct ON ct.id = cert.template_id
         LEFT JOIN awards a ON a.id = cert.award_id
         LEFT JOIN committees aw_committee ON aw_committee.id = a.committee_id
         LEFT JOIN portfolios aw_portfolio ON aw_portfolio.id = a.portfolio_id
         WHERE cert.id = ?`,
        [id]
    );
    return rows[0] || null;
}

async function listByConference(conferenceId, db = pool) {
    const [rows] = await db.query(
        `SELECT cert.*, d.full_name AS delegate_name, d.email AS delegate_email, ct.name AS template_name
         FROM certificates cert
         INNER JOIN delegates d ON d.id = cert.delegate_id
         INNER JOIN certificate_templates ct ON ct.id = cert.template_id
         WHERE cert.conference_id = ?
         ORDER BY cert.issued_at DESC`,
        [conferenceId]
    );
    return rows;
}

async function listByDelegate(delegateId, db = pool) {
    const [rows] = await db.query(
        `SELECT cert.*, ct.name AS template_name, ct.title AS template_title
         FROM certificates cert
         INNER JOIN certificate_templates ct ON ct.id = cert.template_id
         WHERE cert.delegate_id = ?
         ORDER BY cert.issued_at DESC`,
        [delegateId]
    );
    return rows;
}

async function recordDownload(id, db = pool) {
    await db.execute(
        `UPDATE certificates SET download_count = download_count + 1, last_downloaded_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
    );
}

async function getStatsForConference(conferenceId, db = pool) {
    const [[row]] = await db.query(
        `SELECT COUNT(*) AS total_certificates, SUM(download_count > 0) AS downloaded_count, SUM(download_count) AS total_downloads
         FROM certificates WHERE conference_id = ?`,
        [conferenceId]
    );
    return {
        totalCertificates: Number(row.total_certificates) || 0,
        downloadedCount: Number(row.downloaded_count) || 0,
        totalDownloads: Number(row.total_downloads) || 0
    };
}

module.exports = {
    create, findById, findByNumber, findRenderContext, listByConference, listByDelegate, recordDownload,
    getStatsForConference
};
