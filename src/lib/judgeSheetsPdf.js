import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_FONT_NAME, registerMalayalamPdfFont } from "./pdfFonts.js";

const MARGIN_PT = 28;
const INK = [23, 23, 23];
const MUTED = [110, 118, 128];
const RULE = [210, 216, 222];
const BRAND = [16, 145, 105];
const HEAD_BG = [33, 241, 168];

/**
 * registrationsByEvent shape:
 * [
 *   {
 *     eventName: string,
 *     categoryLabel?: string,
 *     genderLabel?: string,
 *     students: [{ regNo: string }, ...],
 *   },
 *   ...
 * ]
 *
 * Produces judgeCount identical blank scoring sheets per event, 2 sheets
 * per A4 page (top/bottom half) separated by a dashed cut-line.
 */
export async function generateJudgeSheetsPDF(
  registrationsByEvent,
  judgeCount,
  { orgName, filename = "Judge-Sheets" } = {},
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  await registerMalayalamPdfFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - MARGIN_PT * 2;
  const halfHeight = (pageHeight - MARGIN_PT * 2) / 2;

  const sheets = [];
  registrationsByEvent.forEach((ev) => {
    for (let j = 0; j < judgeCount; j += 1) sheets.push(ev);
  });

  if (sheets.length === 0) {
    throw new Error("No events/students to generate judge sheets for.");
  }

  let slot = 0;
  let firstPage = true;

  sheets.forEach((ev) => {
    if (slot === 0) {
      if (!firstPage) doc.addPage();
      firstPage = false;
    }
    const top = MARGIN_PT + slot * halfHeight;
    drawJudgeSheet(doc, ev, {
      top,
      left: MARGIN_PT,
      width: usableWidth,
      pageWidth,
      orgName,
    });
    slot = slot === 0 ? 1 : 0;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.75);
    doc.setLineDashPattern([4, 3], 0);
    doc.line(MARGIN_PT, pageHeight / 2, pageWidth - MARGIN_PT, pageHeight / 2);
    doc.setLineDashPattern([], 0);
  }

  doc.save(`${filename}.pdf`);
}

function drawJudgeSheet(doc, ev, { top, left, width, pageWidth, orgName }) {
  let y = top + 12;
  const centerX = left + width / 2;

  if (orgName) {
    doc.setFont(PDF_FONT_NAME, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND);
    doc.text(orgName, centerX, y, { align: "center" });
    y += 15;
  }

  const subtitle = [ev.categoryLabel, ev.genderLabel]
    .filter(Boolean)
    .join(" · ");
  if (subtitle) {
    doc.setFont(PDF_FONT_NAME, "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(subtitle, centerX, y, { align: "center" });
    y += 12;
  }

  doc.setFont(PDF_FONT_NAME, "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(...INK);
  doc.text(ev.eventName, centerX, y, { align: "center" });
  y += 16;

  doc.setFont(PDF_FONT_NAME, "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text("Judge Name / Signature: ____________________________", left, y);
  y += 8;

  const rows = ev.students.map((s, idx) => [
    String(idx + 1),
    s.regNo ?? "",
    "",
    "",
    "",
  ]);

  autoTable(doc, {
    head: [
      ["Sl No", "Register Number", "Code Letter", "Score / Grade", "Remarks"],
    ],
    body: rows,
    startY: y,
    margin: { left, right: pageWidth - left - width },
    tableWidth: width,
    theme: "grid",
    styles: {
      font: PDF_FONT_NAME,
      fontSize: 8.5,
      cellPadding: 3,
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.5,
    },
    headStyles: { fillColor: HEAD_BG, textColor: INK, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: width * 0.28 },
      2: { cellWidth: width * 0.16 },
      3: { cellWidth: width * 0.16 },
    },
  });
}
