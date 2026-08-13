import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDF_FONT_NAME, registerMalayalamPdfFont } from "./pdfFonts.js";
import {
  ensureMalayalamFontFace,
  measureWrap,
  drawTextLine,
  drawWrappedText,
} from "./richText.js";

const MARGIN_PT = 28;
const SHEET_GAP = 22;
const FOOTER_RESERVE = 26;
const HEADER_TOP_PAD = 10;

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
const MIN_ROWS_TO_KEEP_TOGETHER = 4;

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

  const contentLeft = MARGIN_PT;
  const contentWidth = pageWidth - MARGIN_PT * 2;
  const contentBottom = pageHeight - MARGIN_PT;

  const sheets = [];
  registrationsByEvent.forEach((ev) => {
    for (let j = 0; j < judgeCount; j += 1) sheets.push(ev);
  });

  if (sheets.length === 0) {
    throw new Error("No events/students to generate judge sheets for.");
  }

  let cursorY = MARGIN_PT;

  sheets.forEach((ev) => {
    const headerHeight = measureHeaderHeight(doc, ev, contentWidth, orgName);
    const minRowsHeight =
      TABLE_HEAD_HEIGHT_APPROX +
      MIN_ROWS_TO_KEEP_TOGETHER * (DETAIL_LINE_HEIGHT + CELL_PADDING * 2);
    const gap = cursorY > MARGIN_PT ? SHEET_GAP : 0;
    const spaceNeededToStart = gap + headerHeight + minRowsHeight;

    if (cursorY + spaceNeededToStart > contentBottom) {
      doc.addPage();
      cursorY = MARGIN_PT;
    } else if (gap > 0) {
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.75);
      doc.setLineDashPattern([4, 3], 0);
      doc.line(
        contentLeft,
        cursorY + gap / 2,
        contentLeft + contentWidth,
        cursorY + gap / 2,
      );
      doc.setLineDashPattern([], 0);
      cursorY += gap;
    }

    const tableStartY = drawHeaderBlock(doc, ev, {
      top: cursorY,
      left: contentLeft,
      width: contentWidth,
      orgName,
    });

    const detailColWidth = contentWidth * 0.32;
    const detailMaxWidth = detailColWidth - CELL_PADDING * 2;
    const eventRows = buildEventRows(doc, ev, detailMaxWidth);
    const rows = eventRows.map((r) => [
      r.slNo,
      r.isGroup ? "" : r.detailText,
      "",
      "",
      "",
    ]);

    const eventPageAbsoluteNumbers = [];
    let pagesSpannedByEvent = 1;

    autoTable(doc, {
      head: [["Sl No", "Student / Team", "Code", "Score", "Remarks"]],
      body: rows,
      startY: tableStartY,
      margin: {
        left: contentLeft,
        right: pageWidth - contentLeft - contentWidth,
        top: MARGIN_PT + headerHeight,
        bottom: MARGIN_PT + FOOTER_RESERVE,
      },
      tableWidth: contentWidth,
      pageBreak: "auto",
      showHead: "everyPage",
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
        0: { cellWidth: contentWidth * 0.12 },
        1: { cellWidth: detailColWidth },
        2: { cellWidth: contentWidth * 0.16 },
        3: { cellWidth: contentWidth * 0.16 },
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
      didDrawPage: (data) => {
        eventPageAbsoluteNumbers.push(doc.internal.getNumberOfPages());
        pagesSpannedByEvent = data.pageNumber;

        if (data.pageNumber > 1) {
          drawHeaderBlock(doc, ev, {
            top: MARGIN_PT,
            left: contentLeft,
            width: contentWidth,
            orgName,
            continuation: true,
          });
        }
      },
    });

    if (pagesSpannedByEvent > 1) {
      eventPageAbsoluteNumbers.forEach((absPage, idx) => {
        doc.setPage(absPage);
        doc.setFont(PDF_FONT_NAME, "normal");
        doc.setFontSize(9);
        doc.setTextColor(...MUTED);
        doc.text(
          `Page ${idx + 1} of ${pagesSpannedByEvent}`,
          pageWidth - MARGIN_PT,
          pageHeight - 12,
          { align: "right" },
        );
      });
      doc.setPage(
        eventPageAbsoluteNumbers[eventPageAbsoluteNumbers.length - 1],
      );
    }

    cursorY = doc.lastAutoTable.finalY;
  });

  doc.save(`${filename}.pdf`);
}

function buildSubtitle(ev) {
  const parts = [ev.categoryLabel, ev.genderLabel];
  if (isGroupEvent(ev)) parts.push("Group Event");
  return parts.filter(Boolean).join(" · ");
}

function measureHeaderHeight(doc, ev, width, orgName) {
  let h = HEADER_TOP_PAD;

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

function drawHeaderBlock(
  doc,
  ev,
  { top, left, width, orgName, continuation = false },
) {
  let y = top + HEADER_TOP_PAD;
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

  return y;
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
