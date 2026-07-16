const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

/**
 * Shared tabular exporter for spec 17.13 (PDF/Excel/CSV). Every report type
 * reduces to { title, columns: [{key,label}], rows: [{...}] } and picks one
 * of these three renderers -- no per-report-type formatting code needed.
 */

function toCsv({ columns, rows }) {
    const escape = (value) => {
        const str = value === null || value === undefined ? "" : String(value);
        return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const header = columns.map((c) => escape(c.label)).join(",");
    const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
    return [header, ...lines].join("\n");
}

async function toExcel({ title, columns, rows }) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title.slice(0, 31) || "Report");
    sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: Math.max(c.label.length + 4, 16) }));
    sheet.getRow(1).font = { bold: true };
    rows.forEach((row) => sheet.addRow(row));
    return workbook.xlsx.writeBuffer();
}

function toPdf({ title, columns, rows }, stream) {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
    doc.pipe(stream);

    doc.fontSize(16).font("Helvetica-Bold").text(title, { align: "left" });
    doc.fontSize(9).font("Helvetica").fillColor("#666").text(new Date().toLocaleString(), { align: "left" });
    doc.moveDown(0.75);

    const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / columns.length;
    const startX = doc.page.margins.left;

    function drawRow(values, { bold = false, y }) {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(bold ? "#000" : "#333");
        values.forEach((value, i) => {
            doc.text(value === null || value === undefined ? "" : String(value), startX + i * colWidth, y, {
                width: colWidth - 6, ellipsis: true
            });
        });
    }

    let y = doc.y;
    drawRow(columns.map((c) => c.label), { bold: true, y });
    y += 16;
    doc.moveTo(startX, y - 4).lineTo(doc.page.width - doc.page.margins.right, y - 4).strokeColor("#ccc").stroke();

    for (const row of rows) {
        if (y > doc.page.height - doc.page.margins.bottom - 20) {
            doc.addPage();
            y = doc.page.margins.top;
        }
        drawRow(columns.map((c) => row[c.key]), { y });
        y += 16;
    }

    if (rows.length === 0) {
        doc.font("Helvetica").fontSize(9).fillColor("#999").text("No data for this report.", startX, y);
    }

    doc.end();
}

module.exports = { toCsv, toExcel, toPdf };
