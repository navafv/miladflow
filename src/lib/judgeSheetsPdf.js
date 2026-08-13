import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_FONT_NAME, registerMalayalamPdfFont } from "./pdfFonts.js";
import {
  ensureMalayalamFontFace,
  measureWrap,
  drawTextLine,
  drawWrappedText,
} from "./richText.js";

const MARGIN_PT = 20;
const GUTTER_PT = 14;
const SHEETS_PER_PAGE = 3;

const INK = [23, 23, 23];
const MUTED = [110, 118, 128];
const RULE = [210, 216, 222];
const BRAND = [16, 145, 105];
const HEAD_BG = [33, 241, 168];
const WHITE = [255, 255, 255];

const DETAIL_COL_INDEX = 1;
const DETAIL_FONT_SIZE = 10.5;
const DETAIL_LINE_HEIGHT = DETAIL_FONT_SIZE * 1.18;
const CELL_PADDING = 4;

const ORG_FONT_SIZE = 13;
const ORG_LINE_HEIGHT = ORG_FONT_SIZE * 1.18;
const SUBTITLE_FONT_SIZE = 11;
const SUBTITLE_LINE_HEIGHT = SUBTITLE_FONT_SIZE * 1.18;
const EVENT_FONT_SIZE = 16;
const EVENT_LINE_HEIGHT = EVENT_FONT_SIZE * 1.18;

const JUDGE_BLOCK_H = 21;
const TABLE_HEAD_HEIGHT_APPROX = 11 * 1.3 + CELL_PADDING * 2;
const FIT_SAFETY_MARGIN = 6;

export async function generateJudgeSheetsPDF(
  registrationsByEvent,
  judgeCount,
  { orgName, filename = "Judge-Sheets" } = {},
) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  await registerMalayalamPdfFont(doc);
  await ensureMalayalamFontFace();

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

  // Slot cursor: 0..SHEETS_PER_PAGE-1. jsPDF already gives us page 1 for
  // free, so we must NOT call doc.addPage() before the very first slot is
  // drawn — we only add a page once we've wrapped past the last column.
  let slot = 0;
  let needsNewPage = false;
  const gridPageNumbers = new Set();

  const placeSlot = () => {
    if (needsNewPage) {
      doc.addPage();
      needsNewPage = false;
    }
    const pageNum = doc.internal.getNumberOfPages();
    gridPageNumbers.add(pageNum);
    const left = MARGIN_PT + slot * (columnWidth + GUTTER_PT);

    if (slot === SHEETS_PER_PAGE - 1) {
      slot = 0;
      needsNewPage = true;
    } else {
      slot += 1;
    }

    return { left, pageNum };
  };

  sheets.forEach((ev) => {
    const detailMaxWidth = columnWidth * 0.32 - CELL_PADDING * 2;
    const headerHeight = measureHeaderHeight(doc, ev, columnWidth, orgName);
    const eventRows = buildEventRows(doc, ev, detailMaxWidth);

    const availablePerSlot =
      usableHeight -
      headerHeight -
      TABLE_HEAD_HEIGHT_APPROX -
      FIT_SAFETY_MARGIN;

    const chunks = chunkRowsToFit(eventRows, availablePerSlot);

    chunks.forEach((chunkRows, chunkIndex) => {
      const { left } = placeSlot();
      drawGridSheet(doc, ev, chunkRows, {
        top: MARGIN_PT,
        left,
        width: columnWidth,
        height: usableHeight,
        pageWidth,
        orgName,
        continuation: chunkIndex > 0,
      });
    });
  });

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.75);
  gridPageNumbers.forEach((p) => {
    doc.setPage(p);
    doc.setLineDashPattern([4, 3], 0);
    for (let c = 1; c < SHEETS_PER_PAGE; c += 1) {
      const x = MARGIN_PT + c * columnWidth + (c - 0.5) * GUTTER_PT;
      doc.line(x, MARGIN_PT * 0.5, x, pageHeight - MARGIN_PT * 0.5);
    }
    doc.setLineDashPattern([], 0);
  });

  doc.save(`${filename}.pdf`);
}

function isGroupEvent(ev) {
  return (
    ev.isGroup === true ||
    ev.is_group === true ||
    ev.type === "Group" ||
    ev.eventType === "Group" ||
    ev.event_type === "group"
  );
}

function formatRegNo(s) {
  return s.regNo ? s.regNo : "—";
}

function formatRegNoLine(s) {
  return s.regNo ? `Reg: ${s.regNo}` : "Reg: —";
}

function buildSubtitle(ev) {
  const parts = [ev.categoryLabel, ev.genderLabel];
  if (isGroupEvent(ev)) parts.push("Group Event");
  return parts.filter(Boolean).join(" · ");
}

function buildEventRows(doc, ev, detailMaxWidth) {
  if (!isGroupEvent(ev)) {
    const students = ev.students ?? [];
    return students.map((s, idx) => ({
      slNo: String(idx + 1),
      isGroup: false,
      detailText: formatRegNo(s),
    }));
  }

  const groups = ev.groups ?? [];
  return groups.map((g, idx) => {
    const groupName =
      g.groupName?.trim() || g.teamName?.trim() || "Unnamed Group";

    const groupNameLines = measureWrap(
      doc,
      groupName,
      detailMaxWidth,
      DETAIL_FONT_SIZE,
      true,
    );
    const memberLines = (g.members ?? []).flatMap((m) =>
      measureWrap(
        doc,
        `- ${formatRegNoLine(m)}`,
        detailMaxWidth,
        DETAIL_FONT_SIZE,
        false,
      ),
    );

    return {
      slNo: String(idx + 1),
      isGroup: true,
      groupNameLines,
      memberLines,
      totalLines: groupNameLines.length + memberLines.length,
    };
  });
}

function rowHeightOf(r) {
  const singleLineRowH = DETAIL_FONT_SIZE * 1.3 + CELL_PADDING * 2;
  if (!r.isGroup) return singleLineRowH;
  const groupRowH = r.totalLines * DETAIL_LINE_HEIGHT + CELL_PADDING * 2;
  return Math.max(groupRowH, singleLineRowH);
}

/**
 * Splits an event's rows into chunks, each of which fits within
 * `availableHeight` (the vertical space left in a single slot after the
 * header + table head). Row order / slNo is preserved across chunks so a
 * split event still reads as one continuous roster.
 */
function chunkRowsToFit(eventRows, availableHeight) {
  if (eventRows.length === 0) return [[]];

  const chunks = [];
  let current = [];
  let currentHeight = 0;

  eventRows.forEach((row) => {
    const h = rowHeightOf(row);
    if (current.length > 0 && currentHeight + h > availableHeight) {
      chunks.push(current);
      current = [];
      currentHeight = 0;
    }
    current.push(row);
    currentHeight += h;
  });

  if (current.length > 0) chunks.push(current);
  return chunks;
}

function measureHeaderHeight(doc, ev, width, orgName) {
  let h = 0;

  if (orgName) {
    const lines = measureWrap(doc, orgName, width, ORG_FONT_SIZE, true);
    h += lines.length * ORG_LINE_HEIGHT + 4;
  }

  const subtitle = buildSubtitle(ev);
  if (subtitle) {
    const lines = measureWrap(doc, subtitle, width, SUBTITLE_FONT_SIZE, false);
    h += lines.length * SUBTITLE_LINE_HEIGHT + 4;
  }

  const eventLines = measureWrap(
    doc,
    ev.eventName,
    width,
    EVENT_FONT_SIZE,
    true,
  );
  h += eventLines.length * EVENT_LINE_HEIGHT + 4;

  h += JUDGE_BLOCK_H;

  return h;
}

function didDrawGroupCell(doc, data, chunkRows) {
  if (data.section !== "body" || data.column.index !== DETAIL_COL_INDEX) return;
  const meta = chunkRows[data.row.index];
  if (!meta || !meta.isGroup) return;

  const { cell } = data;

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

  meta.groupNameLines.forEach((line) => {
    drawTextLine(doc, line, textX, textY, {
      fontSize: DETAIL_FONT_SIZE,
      bold: true,
      color: INK,
      align: "left",
    });
    textY += DETAIL_LINE_HEIGHT;
  });

  meta.memberLines.forEach((line) => {
    drawTextLine(doc, line, textX, textY, {
      fontSize: DETAIL_FONT_SIZE,
      bold: false,
      color: INK,
      align: "left",
    });
    textY += DETAIL_LINE_HEIGHT;
  });
}

function didParseGroupRowHeight(data, chunkRows) {
  if (data.section !== "body" || data.column.index !== DETAIL_COL_INDEX) return;
  const meta = chunkRows[data.row.index];
  if (!meta || !meta.isGroup) return;

  const needed = meta.totalLines * DETAIL_LINE_HEIGHT + CELL_PADDING * 2;
  if (needed > data.row.height) data.row.height = needed;
}

function drawGridSheet(
  doc,
  ev,
  chunkRows,
  { top, left, width, pageWidth, orgName, continuation = false },
) {
  let y = top + 12;
  const centerX = left + width / 2;

  if (continuation) {
    doc.setFont(PDF_FONT_NAME, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("(continued)", left + width, top + 9, { align: "right" });
  }

  if (orgName) {
    y = drawWrappedText(doc, orgName, centerX, y, {
      fontSize: ORG_FONT_SIZE,
      bold: true,
      color: BRAND,
      align: "center",
      maxWidth: width,
      lineHeight: ORG_LINE_HEIGHT,
    });
    y += 4;
  }

  const subtitle = buildSubtitle(ev);
  if (subtitle) {
    y = drawWrappedText(doc, subtitle, centerX, y, {
      fontSize: SUBTITLE_FONT_SIZE,
      bold: false,
      color: MUTED,
      align: "center",
      maxWidth: width,
      lineHeight: SUBTITLE_LINE_HEIGHT,
    });
    y += 4;
  }

  y = drawWrappedText(doc, ev.eventName, centerX, y, {
    fontSize: EVENT_FONT_SIZE,
    bold: true,
    color: INK,
    align: "center",
    maxWidth: width,
    lineHeight: EVENT_LINE_HEIGHT,
  });
  y += 4;

  doc.setFont(PDF_FONT_NAME, "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  doc.text("Judge Name / Signature:", left, y);
  y += 5;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);
  doc.line(left, y + 6, left + width, y + 6);
  y += 16;

  const detailColWidth = width * 0.32;

  const rows = chunkRows.map((r) => [
    r.slNo,
    r.isGroup ? "" : r.detailText,
    "",
    "",
    "",
  ]);

  autoTable(doc, {
    head: [["Sl No", "Student / Team", "Code", "Score", "Remarks"]],
    body: rows,
    startY: y,
    // Pin the table to this column's slot only — never let it stretch
    // across the page.
    margin: { left, right: pageWidth - left - width, top, bottom: top },
    tableWidth: width,
    // Chunks are pre-sized to fit the slot, so autoTable should never need
    // to break this table onto a new page itself.
    pageBreak: "avoid",
    theme: "grid",
    styles: {
      font: PDF_FONT_NAME,
      fontSize: DETAIL_FONT_SIZE,
      cellPadding: CELL_PADDING,
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
      cellPadding: CELL_PADDING,
    },
    bodyStyles: {
      fontSize: DETAIL_FONT_SIZE,
      cellPadding: CELL_PADDING,
    },
    columnStyles: {
      0: { cellWidth: width * 0.12 },
      1: { cellWidth: detailColWidth },
      2: { cellWidth: width * 0.16 },
      3: { cellWidth: width * 0.16 },
    },
    didParseCell: (data) => didParseGroupRowHeight(data, chunkRows),
    didDrawCell: (data) => didDrawGroupCell(doc, data, chunkRows),
  });
}
