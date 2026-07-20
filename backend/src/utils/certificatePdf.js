const PDFDocument = require("pdfkit");

function resolveFields(text, fields) {
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => (fields[key] !== undefined && fields[key] !== null ? String(fields[key]) : ""));
}

function formatDate(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function buildDynamicFields({ certificate, template, conference, delegate, award }) {
    const conferenceDates = conference.start_date && conference.end_date
        ? `${formatDate(conference.start_date)} - ${formatDate(conference.end_date)}`
        : "";

    return {
        delegateName: delegate.full_name,
        conferenceName: conference.name,
        committee: award?.committee_name || "",
        portfolio: award?.portfolio_name || "",
        awardCategory: award?.category || "",
        conferenceDates,
        certificateNumber: certificate.certificate_number,
        issueDate: formatDate(certificate.issued_at)
    };
}

/**
 * Renders a single certificate as a landscape PDF and pipes it to `stream`
 * (an Express response works directly). One deliberately fixed, elegant
 * layout for V1 -- organizers customize text/colors via the template
 * record (spec 19.8), not a freeform drag-and-drop designer.
 */
function renderCertificatePdf({ certificate, template, conference, delegate, award }, stream) {
    const fields = buildDynamicFields({ certificate, template, conference, delegate, award });
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
    doc.pipe(stream);

    const { width, height } = doc.page;
    const accent = template.accent_color || "#1f2937";

    doc.rect(0, 0, width, height).fill("#fdfdfb");
    doc.lineWidth(3).strokeColor(accent).rect(28, 28, width - 56, height - 56).stroke();
    doc.lineWidth(0.75).strokeColor(accent).rect(38, 38, width - 76, height - 76).stroke();

    // Everything below shifts down uniformly when a logo is present, so it
    // never overlaps the fixed footer regardless of which elements exist.
    let y = 70;
    if (template.logo_buffer) {
        const logoSize = 52;
        doc.image(template.logo_buffer, width / 2 - logoSize / 2, y, { fit: [logoSize, logoSize], align: "center" });
        y += logoSize + 14;
    }

    doc.fillColor("#6b7280").font("Helvetica").fontSize(11)
        .text(conference.name.toUpperCase(), 0, y, { align: "center", width });
    y += 35;

    doc.fillColor(accent).font("Times-Bold").fontSize(34)
        .text(template.title, 0, y, { align: "center", width });
    y += 60;

    doc.fillColor("#374151").font("Helvetica").fontSize(13)
        .text("This is to certify that", 0, y, { align: "center", width });
    y += 30;

    doc.fillColor("#111827").font("Times-Bold").fontSize(30)
        .text(fields.delegateName, 0, y, { align: "center", width });
    y += 45;

    doc.moveTo(width / 2 - 140, y).lineTo(width / 2 + 140, y).lineWidth(1).strokeColor(accent).stroke();
    y += 25;

    const bodyText = resolveFields(template.body_text, fields);
    doc.fillColor("#374151").font("Helvetica").fontSize(13)
        .text(bodyText, 120, y, { align: "center", width: width - 240, lineGap: 4 });

    const footerY = height - 130;
    const footerWidth = 260;
    doc.fillColor("#6b7280").font("Helvetica").fontSize(9);
    const certNoLine = `Certificate No. ${fields.certificateNumber}`;
    const certNoHeight = doc.heightOfString(certNoLine, { width: footerWidth });
    doc.text(certNoLine, 60, footerY, { width: footerWidth });
    doc.text(`Issued ${fields.issueDate}`, 60, footerY + certNoHeight + 4, { width: footerWidth });

    if (template.signatory_name) {
        const sigX = width - 280;
        doc.moveTo(sigX, footerY + 20).lineTo(sigX + 220, footerY + 20).lineWidth(0.75).strokeColor("#9ca3af").stroke();
        doc.fillColor("#111827").font("Helvetica-Bold").fontSize(11)
            .text(template.signatory_name, sigX, footerY + 26, { width: 220, align: "center" });
        if (template.signatory_title) {
            doc.fillColor("#6b7280").font("Helvetica").fontSize(9)
                .text(template.signatory_title, sigX, footerY + 41, { width: 220, align: "center" });
        }
    }

    doc.fillColor("#9ca3af").font("Helvetica").fontSize(8)
        .text("Issued via MUN Buddy", 0, height - 45, { align: "center", width });

    doc.end();
}

module.exports = { renderCertificatePdf, resolveFields, buildDynamicFields };
