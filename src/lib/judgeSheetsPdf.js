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
const INK = [23, 23, 23];
const MUTED = [110, 118, 128];
const RULE = [210, 216, 222];
const BRAND = [16, 145, 105];
const HEAD_BG = [33, 241, 168];
const WHITE = [255, 255, 255];

const SHEETS_PER_PAGE = 3;

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

function isGroupEvent(ev) {
  return (
    ev.isGroup === true ||
    ev.is_group === true ||
    ev.type === "Group" ||
    ev.eventType === "Group" ||
    ev.event_type === "group"
  );
}

function formatRegNoLine(s) {
  return s.regNo ? `Reg: ${s.regNo}` : "Reg: —";
}

function buildEventRows(doc, ev, detailMaxWidth) {
  if (!isGroupEvent(ev)) {
    const students = ev.students ?? [];
    return students.map((s, idx) => ({
      slNo: String(idx + 1),
      isGroup: false,
      detailText: formatRegNoLine(s),
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

function drawJudgeSheet(
  doc,
  ev,
  { top, left, width, height, pageWidth, orgName },
) {
  let y = top + 12;
  const centerX = left + width / 2;

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

  const subtitleParts = [ev.categoryLabel, ev.genderLabel];
  if (isGroupEvent(ev)) subtitleParts.push("Group Event");
  const subtitle = subtitleParts.filter(Boolean).join(" · ");
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
  const detailMaxWidth = detailColWidth - CELL_PADDING * 2;

  const eventRows = buildEventRows(doc, ev, detailMaxWidth);
  const rows = eventRows.map((r) => [
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
    margin: { left, right: pageWidth - left - width, top, bottom: top },
    tableWidth: width,
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
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== DETAIL_COL_INDEX) {
        return;
      }
      const meta = eventRows[data.row.index];
      if (!meta || !meta.isGroup) return;

      const needed = meta.totalLines * DETAIL_LINE_HEIGHT + CELL_PADDING * 2;
      if (needed > data.row.height) data.row.height = needed;
    },
    didDrawCell: (data) => {
      if (data.section !== "body" || data.column.index !== DETAIL_COL_INDEX) {
        return;
      }
      const meta = eventRows[data.row.index];
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
    },
  });
}
