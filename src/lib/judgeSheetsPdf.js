import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_FONT_NAME, registerMalayalamPdfFont } from "./pdfFonts.js";

const MARGIN_PT = 20;
const GUTTER_PT = 14;
const INK = [23, 23, 23];
const MUTED = [110, 118, 128];
const RULE = [210, 216, 222];
const BRAND = [16, 145, 105];
const HEAD_BG = [33, 241, 168];

const SHEETS_PER_PAGE = 2;

export async function generateJudgeSheetsPDF(
  registrationsByEvent,
  judgeCount,
  { orgName, filename = "Judge-Sheets" } = {},
) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  await registerMalayalamPdfFont(doc);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const usableWidth = pageWidth - MARGIN_PT * 2;
  const columnWidth =
    (usableWidth - GUTTER_PT * (SHEETS_PER_PAGE - 1)) / SHEETS_PER_PAGE;
  const usableHeight = pageHeight - MARGIN_PT * 2;

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
    const left = MARGIN_PT + slot * (columnWidth + GUTTER_PT);
    drawJudgeSheet(doc, ev, {
      top: MARGIN_PT,
      left,
      width: columnWidth,
      height: usableHeight,
      pageWidth,
      orgName,
    });
    slot = slot === SHEETS_PER_PAGE - 1 ? 0 : slot + 1;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.75);
    doc.setLineDashPattern([4, 3], 0);
    for (let c = 1; c < SHEETS_PER_PAGE; c += 1) {
      const x = MARGIN_PT + c * columnWidth + (c - 0.5) * GUTTER_PT;
      doc.line(x, MARGIN_PT * 0.5, x, pageHeight - MARGIN_PT * 0.5);
    }
    doc.setLineDashPattern([], 0);
  }

  doc.save(`${filename}.pdf`);
}

function buildIndividualRows(students) {
  return students.map((s, idx) => [String(idx + 1), s.regNo ?? "", "", "", ""]);
}

function buildGroupRows(students) {
  const order = [];
  const groups = new Map();
  students.forEach((s) => {
    const key = s.teamName || "Unassigned";
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(s);
  });

  return order.map((teamName, idx) => {
    const members = groups.get(teamName);
    const lines = [
      teamName,
      ...members.map(
        (m) => `- ${m.name ?? "Unknown"} (Reg: ${m.regNo ?? "—"})`,
      ),
    ];
    return [String(idx + 1), lines.join("\n"), "", "", ""];
  });
}

function drawJudgeSheet(
  doc,
  ev,
  { top, left, width, height, pageWidth, orgName },
) {
  let y = top + 12;
  const centerX = left + width / 2;

  if (orgName) {
    doc.setFont(PDF_FONT_NAME, "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND);
    doc.text(orgName, centerX, y, { align: "center", maxWidth: width });
    y += 16;
  }

  const subtitle = [ev.categoryLabel, ev.genderLabel]
    .filter(Boolean)
    .join(" · ");
  if (subtitle) {
    doc.setFont(PDF_FONT_NAME, "normal");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text(subtitle, centerX, y, { align: "center", maxWidth: width });
    y += 14;
  }

  doc.setFont(PDF_FONT_NAME, "bold");
  doc.setFontSize(16);
  doc.setTextColor(...INK);
  doc.text(ev.eventName, centerX, y, { align: "center", maxWidth: width });
  y += 20;

  doc.setFont(PDF_FONT_NAME, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Judge Name / Signature:", left, y);
  y += 5;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);
  doc.line(left, y + 6, left + width, y + 6);
  y += 16;

  const isGroup = Boolean(ev.isGroup);
  const rows = isGroup
    ? buildGroupRows(ev.students)
    : buildIndividualRows(ev.students);
  const secondColumnHeader = isGroup ? "Team / Members" : "Reg No";

  const columnStyles = isGroup
    ? {
        0: { cellWidth: width * 0.08 },
        1: { cellWidth: width * 0.56 },
        2: { cellWidth: width * 0.12 },
        3: { cellWidth: width * 0.12 },
      }
    : {
        0: { cellWidth: width * 0.12 },
        1: { cellWidth: width * 0.32 },
        2: { cellWidth: width * 0.16 },
        3: { cellWidth: width * 0.16 },
      };

  autoTable(doc, {
    head: [["Sl No", secondColumnHeader, "Code", "Score", "Remarks"]],
    body: rows,
    startY: y,
    margin: { left, right: pageWidth - left - width, top, bottom: top },
    tableWidth: width,
    pageBreak: "avoid",
    theme: "grid",
    styles: {
      font: PDF_FONT_NAME,
      fontSize: 10.5,
      cellPadding: 4,
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.5,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: HEAD_BG,
      textColor: INK,
      fontStyle: "bold",
      fontSize: 11,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 10.5,
      cellPadding: 4,
    },
    columnStyles,
  });
}
