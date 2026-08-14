import jsPDF from "jspdf";
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

const DETAIL_COL_INDEX = 2;
const DETAIL_FONT_SIZE = 10.5;
const DETAIL_LINE_HEIGHT = DETAIL_FONT_SIZE * 1.18;
const CELL_PADDING = 4;

const HEAD_FONT_SIZE = 11;
const TABLE_HEAD_HEIGHT = HEAD_FONT_SIZE * 1.3 + CELL_PADDING * 2;

const ORG_FONT_SIZE = 13;
const ORG_LINE_HEIGHT = ORG_FONT_SIZE * 1.18;
const SUBTITLE_FONT_SIZE = 11;
const SUBTITLE_LINE_HEIGHT = SUBTITLE_FONT_SIZE * 1.18;
const EVENT_FONT_SIZE = 16;
const EVENT_LINE_HEIGHT = EVENT_FONT_SIZE * 1.18;

const JUDGE_BLOCK_H = 21;
const FIT_SAFETY_MARGIN = 6;
const YIELD_EVERY_N_ITEMS = 8;

const COL_FRACTIONS = [0.12, 0.18, 0.32, 0.16, 0.22];
const COL_LABELS = ["Sl No", "Reg No", "Student Name", "Class", "Team"];

function yieldToMainThread() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function computeColWidths(width) {
  return COL_FRACTIONS.map((f) => f * width);
}

export async function generateStageSlipsPDF(
  registrationsByEvent,
  { orgName, filename = "Stage-Sheets" } = {},
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
  const colWidths = computeColWidths(columnWidth);

  const events = (registrationsByEvent ?? []).filter(Boolean);
  const sheets = events;

  if (sheets.length === 0) {
    throw new Error("No events/students to generate stage sheets for.");
  }

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

  for (let i = 0; i < sheets.length; i += 1) {
    const ev = sheets[i];
    const headerHeight = measureHeaderHeight(doc, ev, columnWidth, orgName);
    const eventRows = buildEventRows(doc, ev, colWidths);

    const availablePerSlot =
      usableHeight - headerHeight - TABLE_HEAD_HEIGHT - FIT_SAFETY_MARGIN;

    const chunks = chunkRowsToFit(eventRows, availablePerSlot);

    chunks.forEach((chunkRows, chunkIndex) => {
      const { left } = placeSlot();
      drawGridSheet(doc, ev, chunkRows, colWidths, {
        top: MARGIN_PT,
        left,
        width: columnWidth,
        pageWidth,
        orgName,
        continuation: chunkIndex > 0,
      });
    });

    if (i > 0 && i % YIELD_EVERY_N_ITEMS === 0) {
      await yieldToMainThread();
    }
  }

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.75);
  const pageNumbers = [...gridPageNumbers];
  for (let i = 0; i < pageNumbers.length; i += 1) {
    const p = pageNumbers[i];
    doc.setPage(p);
    doc.setLineDashPattern([4, 3], 0);
    for (let c = 1; c < SHEETS_PER_PAGE; c += 1) {
      const x = MARGIN_PT + c * columnWidth + (c - 0.5) * GUTTER_PT;
      doc.line(x, MARGIN_PT * 0.5, x, pageHeight - MARGIN_PT * 0.5);
    }
    doc.setLineDashPattern([], 0);

    if (i > 0 && i % YIELD_EVERY_N_ITEMS === 0) {
      await yieldToMainThread();
    }
  }

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

function studentName(s) {
  return (
    s?.name?.trim() || s?.studentName?.trim() || s?.student_name?.trim() || "—"
  );
}

function studentRegNo(s) {
  return s?.regNo ? String(s.regNo) : "—";
}

function studentClass(s) {
  return (
    s?.className?.trim() || s?.class?.trim() || s?.class_name?.trim() || "—"
  );
}

function studentTeam(s) {
  return (
    s?.team?.name?.trim() || s?.teamName?.trim() || s?.team_name?.trim() || "—"
  );
}

function formatRegNoLine(s) {
  return s?.regNo ? `Reg: ${s.regNo}` : "Reg: —";
}

function buildSubtitle(ev) {
  const parts = [ev.categoryLabel, ev.genderLabel];
  if (isGroupEvent(ev)) parts.push("Group Event");
  return parts.filter(Boolean).join(" · ");
}

function cellLines(doc, text, colWidth, bold = false) {
  const maxWidth = Math.max(colWidth - CELL_PADDING * 2, 1);
  return measureWrap(doc, text, maxWidth, DETAIL_FONT_SIZE, bold);
}

function buildEventRows(doc, ev, colWidths) {
  if (!isGroupEvent(ev)) {
    const students = (ev.students ?? []).filter(Boolean);
    return students.map((s, idx) => {
      const cells = [
        cellLines(doc, String(idx + 1), colWidths[0]),
        cellLines(doc, studentRegNo(s), colWidths[1]),
        cellLines(doc, studentName(s), colWidths[2]),
        cellLines(doc, studentClass(s), colWidths[3]),
        cellLines(doc, studentTeam(s), colWidths[4]),
      ];
      const maxLines = Math.max(1, ...cells.map((c) => c.length));
      return {
        slNo: String(idx + 1),
        isGroup: false,
        cells,
        maxLines,
      };
    });
  }

  const groups = (ev.groups ?? []).filter(Boolean);
  return groups.map((g, idx) => {
    const groupName =
      g.groupName?.trim() || g.teamName?.trim() || "Unnamed Group";

    const groupNameLines = cellLines(
      doc,
      groupName,
      colWidths[DETAIL_COL_INDEX],
      true,
    );
    const memberLines = (g.members ?? [])
      .filter(Boolean)
      .flatMap((m) =>
        cellLines(
          doc,
          `- ${formatRegNoLine(m)} · ${studentName(m)}`,
          colWidths[DETAIL_COL_INDEX],
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
  if (r.isGroup) {
    const groupRowH = r.totalLines * DETAIL_LINE_HEIGHT + CELL_PADDING * 2;
    return Math.max(groupRowH, singleLineRowH);
  }
  const linesRowH = r.maxLines * DETAIL_LINE_HEIGHT + CELL_PADDING * 2;
  return Math.max(linesRowH, singleLineRowH);
}

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
    ev.eventName || "Untitled Event",
    width,
    EVENT_FONT_SIZE,
    true,
  );
  h += eventLines.length * EVENT_LINE_HEIGHT + 4;

  h += JUDGE_BLOCK_H;

  return h;
}

function drawTableHead(doc, left, y, colWidths, width) {
  doc.setFillColor(...HEAD_BG);
  doc.rect(left, y, width, TABLE_HEAD_HEIGHT, "F");
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);

  let x = left;
  COL_LABELS.forEach((label, i) => {
    doc.rect(x, y, colWidths[i], TABLE_HEAD_HEIGHT, "S");
    drawTextLine(
      doc,
      label,
      x + CELL_PADDING,
      y + CELL_PADDING + HEAD_FONT_SIZE * 0.85,
      {
        fontSize: HEAD_FONT_SIZE,
        bold: true,
        color: INK,
        align: "left",
      },
    );
    x += colWidths[i];
  });

  return y + TABLE_HEAD_HEIGHT;
}

function drawTableRow(doc, row, left, y, colWidths, rowHeight) {
  // Cell backgrounds + borders first.
  let x = left;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);
  colWidths.forEach((w) => {
    doc.setFillColor(...WHITE);
    doc.rect(x, y, w, rowHeight, "F");
    doc.rect(x, y, w, rowHeight, "S");
    x += w;
  });

  if (row.isGroup) {
    drawTextLine(
      doc,
      row.slNo,
      left + CELL_PADDING,
      y + CELL_PADDING + DETAIL_FONT_SIZE * 0.85,
      { fontSize: DETAIL_FONT_SIZE, bold: false, color: INK, align: "left" },
    );

    const detailX = left + colWidths[0] + colWidths[1] + CELL_PADDING;
    let textY = y + CELL_PADDING + DETAIL_FONT_SIZE * 0.85;

    row.groupNameLines.forEach((line) => {
      drawTextLine(doc, line, detailX, textY, {
        fontSize: DETAIL_FONT_SIZE,
        bold: true,
        color: INK,
        align: "left",
      });
      textY += DETAIL_LINE_HEIGHT;
    });

    row.memberLines.forEach((line) => {
      drawTextLine(doc, line, detailX, textY, {
        fontSize: DETAIL_FONT_SIZE,
        bold: false,
        color: INK,
        align: "left",
      });
      textY += DETAIL_LINE_HEIGHT;
    });
    return;
  }

  let cx = left;
  row.cells.forEach((lines, i) => {
    const textX = cx + CELL_PADDING;
    let textY = y + CELL_PADDING + DETAIL_FONT_SIZE * 0.85;
    lines.forEach((line) => {
      drawTextLine(doc, line, textX, textY, {
        fontSize: DETAIL_FONT_SIZE,
        bold: false,
        color: INK,
        align: "left",
      });
      textY += DETAIL_LINE_HEIGHT;
    });
    cx += colWidths[i];
  });
}

function drawGridSheet(
  doc,
  ev,
  chunkRows,
  colWidths,
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

  y = drawWrappedText(doc, ev.eventName || "Untitled Event", centerX, y, {
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
  doc.text("Stage Sheet", left, y);
  y += 5;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.5);
  doc.line(left, y + 6, left + width, y + 6);
  y += 16;

  y = drawTableHead(doc, left, y, colWidths, width);

  chunkRows.forEach((row) => {
    const h = rowHeightOf(row);
    drawTableRow(doc, row, left, y, colWidths, h);
    y += h;
  });
}
