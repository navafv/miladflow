import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_FONT_NAME, registerMalayalamPdfFont } from "./pdfFonts.js";

const MARGIN_PT = 20;
const GUTTER_PT = 14; // space around each dashed cut-line
const INK = [23, 23, 23];
const MUTED = [110, 118, 128];
const RULE = [210, 216, 222];
const BRAND = [16, 145, 105];
const HEAD_BG = [33, 241, 168];
const WHITE = [255, 255, 255];

const SHEETS_PER_PAGE = 2; // left / right — was 3, but 3-wide left no room
// for the larger, more readable type below (each sheet would only get
// ~258pt of width for a 5-column table). 2-per-page gives each sheet
// ~394pt, enough for 10.5pt body text with proper padding to fit without
// column overlap or heavy line-wrapping.

const DETAIL_COL_INDEX = 1; // "Student / Team" column — the one that gets
// the multi-line treatment for group events.
const DETAIL_FONT_SIZE = 10.5;
const DETAIL_LINE_HEIGHT = DETAIL_FONT_SIZE * 1.18;

/**
 * registrationsByEvent shape:
 * [
 *   {
 *     eventName: string,
 *     categoryLabel?: string,
 *     genderLabel?: string,
 *     isGroup?: boolean,          // true => collapse rows by team
 *     students: [
 *       {
 *         regNo: string,
 *         name?: string,
 *         teamId?: string|number, // used to group students for Group events
 *         teamName?: string,
 *       },
 *       ...
 *     ],
 *   },
 *   ...
 * ]
 *
 * Produces judgeCount identical blank scoring sheets per event, 2 sheets
 * per A4 landscape page (left/right) separated by a dashed cut-line.
 *
 * For Individual events, every student gets their own scoring row.
 * For Group events, students are grouped by team (teamId, falling back to
 * teamName) and combined into a single scoring row per team, listing the
 * team name followed by each member on its own line — a judge scores the
 * performance once, not once per student.
 */
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

  // Dashed vertical cut-lines between columns, on every page
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

/**
 * Detects whether an event should be scored per-team rather than
 * per-student. Accepts a couple of different shapes so this keeps working
 * regardless of how the caller's data source spells "group event".
 */
function isGroupEvent(ev) {
  return (
    ev.isGroup === true ||
    ev.is_group === true ||
    ev.type === "Group" ||
    ev.eventType === "Group" ||
    ev.event_type === "group"
  );
}

function formatStudentLine(s) {
  return s.regNo ? `(Reg: ${s.regNo})` : name;
}

/**
 * Builds the scoring rows for one event.
 *
 * Individual events: one row per student.
 * Group events: students are grouped by team (teamId, falling back to
 * teamName, falling back to an "Unassigned" bucket) and merged into a
 * single row per team.
 *
 * Returns an array of row descriptors — not raw autoTable cell arrays —
 * so the caller can also access the structured team/member data needed to
 * render the bold team-name treatment in the Details column.
 */
function buildEventRows(ev) {
  if (!isGroupEvent(ev)) {
    return ev.students.map((s, idx) => ({
      slNo: String(idx + 1),
      isGroup: false,
      detailText: formatStudentLine(s),
    }));
  }

  const groups = new Map();
  ev.students.forEach((s) => {
    const key = s.teamId ?? s.teamName ?? "__unassigned__";
    if (!groups.has(key)) {
      groups.set(key, {
        teamName: s.teamName?.trim() || "Unassigned Team",
        members: [],
      });
    }
    groups.get(key).members.push(s);
  });

  return Array.from(groups.values()).map((g, idx) => {
    const memberLines = g.members.map((m) => `- ${formatStudentLine(m)}`);
    return {
      slNo: String(idx + 1),
      isGroup: true,
      teamName: g.teamName,
      memberLines,
      // Plain-text fallback used for autoTable's own line-count/height
      // calculation (and as a safety net if the custom draw is skipped
      // for any reason) — keeps the multi-line cell sizing correct.
      detailText: [g.teamName, ...memberLines].join("\n"),
    };
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

  const subtitleParts = [ev.categoryLabel, ev.genderLabel];
  if (isGroupEvent(ev)) subtitleParts.push("Group Event");
  const subtitle = subtitleParts.filter(Boolean).join(" · ");
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

  // `eventRows` holds the structured data (team name + member lines);
  // `rows` is the plain autoTable body built from it. Row index lines up
  // 1:1 between the two, which is what the didDrawCell hook below relies
  // on to find the right metadata for a given rendered row.
  const eventRows = buildEventRows(ev);
  const rows = eventRows.map((r) => [r.slNo, r.detailText, "", "", ""]);

  autoTable(doc, {
    head: [["Sl No", "Student / Team", "Code", "Score", "Remarks"]],
    body: rows,
    startY: y,
    // The 2-sheets-per-page grid is laid out manually above (slot / left /
    // doc.addPage()). Without an explicit bottom margin, autoTable's own
    // default page-break logic can decide a long roster needs a page of
    // its own and call doc.addPage() internally — which desyncs the
    // manual column bookkeeping and silently drops rows from a sheet.
    // Pinning the margin to this sheet's own box and disabling autoTable's
    // pagination keeps every event's full roster inside its own column.
    margin: { left, right: pageWidth - left - width, top, bottom: top },
    tableWidth: width,
    pageBreak: "avoid",
    theme: "grid",
    styles: {
      font: PDF_FONT_NAME,
      fontSize: DETAIL_FONT_SIZE,
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
      fontSize: DETAIL_FONT_SIZE,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: width * 0.12 },
      1: { cellWidth: width * 0.32 },
      2: { cellWidth: width * 0.16 },
      3: { cellWidth: width * 0.16 },
      // remarks column takes the remaining width automatically
    },
    // For group rows, repaint the Details cell so the team name renders
    // bold with each member listed underneath. Row height/pagination was
    // already computed correctly by autoTable from `detailText` (same
    // line count), so this purely cosmetic pass doesn't disturb the
    // sheets-per-page layout math.
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== DETAIL_COL_INDEX) {
        return;
      }
      const meta = eventRows[data.row.index];
      if (!meta || !meta.isGroup) return;

      const { cell } = data;

      // Cover the plain text autoTable already drew, then restroke the
      // cell border (the fill can touch the edges).
      doc.setFillColor(...WHITE);
      doc.rect(
        cell.x + 0.3,
        cell.y + 0.3,
        cell.width - 0.6,
        cell.height - 0.6,
        "F",
      );
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.5);
      doc.rect(cell.x, cell.y, cell.width, cell.height, "S");

      const padLeft = cell.padding("left");
      const padTop = cell.padding("top");
      let textY = cell.y + padTop + DETAIL_FONT_SIZE * 0.85;
      const textX = cell.x + padLeft;
      const maxWidth = cell.width - padLeft - cell.padding("right");

      doc.setFont(PDF_FONT_NAME, "bold");
      doc.setFontSize(DETAIL_FONT_SIZE);
      doc.setTextColor(...INK);
      doc.text(meta.teamName, textX, textY, { maxWidth });
      textY += DETAIL_LINE_HEIGHT;

      doc.setFont(PDF_FONT_NAME, "normal");
      doc.setTextColor(...INK);
      meta.memberLines.forEach((line) => {
        doc.text(line, textX, textY, { maxWidth });
        textY += DETAIL_LINE_HEIGHT;
      });
    },
  });
}
