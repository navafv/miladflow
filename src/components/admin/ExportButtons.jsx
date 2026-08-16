import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  PDF_FONT_NAME,
  ensureMalayalamFontFace,
  ensureArabicFontFace,
  registerMalayalamPdfFont,
} from "../../lib/pdfFonts.js";
import {
  containsMalayalam,
  containsArabic,
  measureWrap,
  drawWrappedText,
  drawTextLine,
  drawVerticalHeaderText,
} from "../../lib/richText.js";
import { generateJudgeSheetsPDF } from "../../lib/judgeSheetsPdf.js";
import { generateStageSlipsPDF } from "../../lib/stageSlipsPdf.js";
import { buildExportFilename } from "../../lib/exportFilename.js";
import { Toast, useToast } from "./Toast.jsx";

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-4 w-4"
    >
      <path
        d="M10 2.5v10m0 0-3.5-3.5M10 12.5 13.5 9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 14v1.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DANGEROUS_PREFIX = /^[=+\-@\t\r]/;

function sanitizeCell(value) {
  const str = String(value ?? "");
  return DANGEROUS_PREFIX.test(str) ? `'${str}` : str;
}

const PDF_MARGIN_PT = 28;
const FOOTER_SPACE_PT = 26;
const TABLE_FONT_SIZE = 9.5;
const CELL_PADDING = 6;
const VERTICAL_HEADER_MAX_HEIGHT_PT = 110;

const INK = [23, 23, 23];
const MUTED = [110, 118, 128];
const RULE = [210, 216, 222];
const BRAND = [16, 145, 105];
const WHITE = [255, 255, 255];

function formatGeneratedDate(date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildFilterSummary(filterParts = []) {
  return (filterParts ?? [])
    .filter(Boolean)
    .map((part) => {
      if (typeof part === "string") return part.trim();
      const { label, value } = part;
      if (value === null || value === undefined || value === "") return "";
      return label ? `${label}: ${value}` : String(value);
    })
    .filter((part) => part.length > 0)
    .join("   |   ");
}

function drawLetterhead(doc, { orgName, title, filterSummary }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let y = PDF_MARGIN_PT;

  if (orgName) {
    y = drawWrappedText(doc, orgName, centerX, y + 14, {
      fontSize: 18,
      bold: true,
      color: BRAND,
      align: "center",
      maxWidth: pageWidth - PDF_MARGIN_PT * 2,
    });
    y += 8;
  }

  if (title) {
    y = drawWrappedText(doc, title, centerX, y + 11, {
      fontSize: 15,
      bold: true,
      color: INK,
      align: "center",
      maxWidth: pageWidth - PDF_MARGIN_PT * 2,
    });
    y += 8;
  }

  if (filterSummary) {
    y = drawWrappedText(doc, filterSummary, centerX, y + 10, {
      fontSize: 11,
      bold: false,
      color: MUTED,
      align: "center",
      maxWidth: pageWidth - PDF_MARGIN_PT * 2,
    });
    y += 7;
  }

  y += 6;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(1);
  doc.line(PDF_MARGIN_PT, y, pageWidth - PDF_MARGIN_PT, y);
  y += 14;

  return y;
}

function drawFooter(doc, generatedAt, pageIndex, totalPages) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ruleY = pageHeight - PDF_MARGIN_PT - 12;

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.75);
  doc.line(PDF_MARGIN_PT, ruleY, pageWidth - PDF_MARGIN_PT, ruleY);

  doc.setFont(PDF_FONT_NAME, "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `Generated on: ${formatGeneratedDate(generatedAt)}`,
    PDF_MARGIN_PT,
    ruleY + 12,
  );
  doc.text(
    `Page ${pageIndex + 1} of ${totalPages}`,
    pageWidth - PDF_MARGIN_PT,
    ruleY + 12,
    { align: "right" },
  );
}

function drawCheckMark(doc, cell) {
  const box = Math.max(8, Math.min(cell.width, cell.height) * 0.62);
  const scale = box / 20;
  const originX = cell.x + cell.width / 2 - box / 2;
  const originY = cell.y + cell.height / 2 - box / 2;

  const p1 = [originX + 4 * scale, originY + 10.5 * scale];
  const p2 = [originX + 8 * scale, originY + 14.5 * scale];
  const p3 = [originX + 16 * scale, originY + 5.5 * scale];

  doc.setLineDashPattern([], 0);
  doc.setDrawColor(...BRAND);
  doc.setLineWidth(Math.max(1.2, box * 0.09));
  doc.setLineCap("round");
  doc.setLineJoin("round");
  doc.line(p1[0], p1[1], p2[0], p2[1]);
  doc.line(p2[0], p2[1], p3[0], p3[1]);
}

export function buildExportTableNode({ columns, rows }) {
  return { columns, rows };
}

export async function exportTableToPdf(
  { columns, rows },
  { orgName, title, filterSummary },
  filename,
) {
  const generatedAt = new Date();
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  await registerMalayalamPdfFont(doc);

  const contentTopPt = drawLetterhead(doc, { orgName, title, filterSummary });

  const head = [columns.map((col) => col.label)];
  const body = rows.map((row) =>
    columns.map((col) => sanitizeCell(row[col.key])),
  );

  autoTable(doc, {
    head,
    body,
    startY: contentTopPt,
    margin: {
      left: PDF_MARGIN_PT,
      right: PDF_MARGIN_PT,
      top: PDF_MARGIN_PT + 16,
      bottom: PDF_MARGIN_PT + FOOTER_SPACE_PT,
    },
    theme: "grid",
    styles: {
      font: PDF_FONT_NAME,
      fontSize: TABLE_FONT_SIZE,
      cellPadding: CELL_PADDING,
      textColor: INK,
      lineColor: RULE,
      lineWidth: 0.5,
      overflow: "linebreak",
      valign: "top",
      fillColor: WHITE,
    },
    headStyles: {
      fillColor: WHITE,
      textColor: INK,
      fontStyle: "bold",
      fontSize: TABLE_FONT_SIZE,
      cellPadding: CELL_PADDING,
      halign: "center",
      valign: "middle",
    },
    didParseCell: (data) => {
      const isHead = data.section === "head";
      const col = columns[data.column.index];

      if (isHead && col?.vertical) {
        data.cell.text = [];
        const needed =
          VERTICAL_HEADER_MAX_HEIGHT_PT +
          data.cell.padding("top") +
          data.cell.padding("bottom");
        if (needed > data.row.height) data.row.height = needed;
        return;
      }

      if (!isHead && String(data.cell.raw ?? "").trim() === "✓") {
        data.cell.text = [];
        data.cell._tick = true;
        return;
      }

      const raw = data.cell.raw;
      if (
        typeof raw !== "string" ||
        !(containsMalayalam(raw) || containsArabic(raw))
      )
        return;

      data.cell.text = [];
      data.cell._milad = { text: raw };

      const innerWidth =
        data.cell.width -
        data.cell.padding("left") -
        data.cell.padding("right");
      const bold = isHead;
      const lines = measureWrap(doc, raw, innerWidth, TABLE_FONT_SIZE, bold);
      const lineHeight = TABLE_FONT_SIZE * 1.18;
      const needed =
        lines.length * lineHeight +
        data.cell.padding("top") +
        data.cell.padding("bottom");
      if (needed > data.row.height) data.row.height = needed;
    },
    didDrawCell: (data) => {
      const isHead = data.section === "head";
      const col = columns[data.column.index];
      const { cell } = data;

      if (isHead && col?.vertical) {
        drawVerticalHeaderText(
          doc,
          col.label,
          cell.x,
          cell.y,
          cell.width,
          cell.height,
          {
            fontSize: TABLE_FONT_SIZE,
            bold: true,
            color: INK,
            bgColor: WHITE,
            maxRun: VERTICAL_HEADER_MAX_HEIGHT_PT,
          },
        );
        return;
      }

      if (cell._tick) {
        drawCheckMark(doc, cell);
        return;
      }

      const meta = cell._milad;
      if (!meta) return;

      const align = isHead ? "center" : "left";
      const padLeft = cell.padding("left");
      const padTop = cell.padding("top");
      const innerWidth = cell.width - padLeft - cell.padding("right");
      const textX = isHead ? cell.x + cell.width / 2 : cell.x + padLeft;
      const textY = cell.y + padTop + TABLE_FONT_SIZE * 0.85;

      drawWrappedText(doc, meta.text, textX, textY, {
        fontSize: TABLE_FONT_SIZE,
        bold: isHead,
        color: INK,
        align,
        maxWidth: innerWidth,
        lineHeight: TABLE_FONT_SIZE * 1.18,
        bgColor: WHITE,
      });
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1 && title) {
        drawTextLine(doc, title, PDF_MARGIN_PT, PDF_MARGIN_PT + 8, {
          fontSize: 10.5,
          bold: true,
          color: MUTED,
          align: "left",
        });
      }
    },
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 0; i < totalPages; i += 1) {
    doc.setPage(i + 1);
    drawFooter(doc, generatedAt, i, totalPages);
  }

  doc.save(`${filename}.pdf`);
}

export default function ExportButtons({
  columns,
  rows,
  filename = "export",
  filterLabels = [],
  filterSummaryParts,
  allLabel = "All",
  title,
  subtitle,
  orgName,
  judgeSheetEvents = [],
}) {
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfError, setPdfError] = useState(null);
  const [judgeModalOpen, setJudgeModalOpen] = useState(false);
  const [judgeCount, setJudgeCount] = useState(2);
  const [judgeGenerating, setJudgeGenerating] = useState(false);
  const [judgeError, setJudgeError] = useState(null);
  const [slipsGenerating, setSlipsGenerating] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  const handleGenerateJudgeSheets = async () => {
    setJudgeError(null);
    setJudgeGenerating(true);
    try {
      await ensureMalayalamFontFace();
      await generateJudgeSheetsPDF(judgeSheetEvents, judgeCount, {
        orgName,
        filename: `${filename}-Judge-Sheets`,
      });
      setJudgeModalOpen(false);
    } catch (err) {
      console.error("Judge sheet PDF generation failed:", err);
      const message = err?.message ?? "Could not generate judge sheets.";
      setJudgeError(message);
      showToast("Failed to generate PDF. Please try again.", "error");
    } finally {
      setJudgeGenerating(false);
    }
  };

  const handleGenerateStageSlips = async () => {
    setSlipsGenerating(true);
    try {
      await ensureMalayalamFontFace();
      await generateStageSlipsPDF(judgeSheetEvents, {
        orgName,
        filename: `${filename}-Stage-Slips`,
      });
      showToast("Stage slips generated successfully.", "success");
    } catch (err) {
      console.error("Stage slip PDF generation failed:", err);
      showToast(
        err?.message ?? "Failed to generate PDF. Please try again.",
        "error",
      );
    } finally {
      setSlipsGenerating(false);
    }
  };

  const buildFilename = () =>
    buildExportFilename({
      baseName: filename,
      filters: filterLabels,
      allLabel,
    });

  const resolveFilterSummary = () =>
    filterSummaryParts?.length
      ? buildFilterSummary(filterSummaryParts)
      : (subtitle ?? "");

  const handleExcel = () => {
    const dynamicFilename = buildFilename();
    const data = rows.map((row) =>
      Object.fromEntries(
        columns.map((c) => [c.label, sanitizeCell(row[c.key])]),
      ),
    );
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${dynamicFilename}.xlsx`);
  };

  const handlePdf = async () => {
    setPdfError(null);
    setPdfExporting(true);
    try {
      const dynamicFilename = buildFilename();
      await Promise.all([ensureMalayalamFontFace(), ensureArabicFontFace()]);
      const built = buildExportTableNode({ columns, rows });
      await exportTableToPdf(
        built,
        {
          orgName,
          title: title ?? filename.replace(/-/g, " "),
          filterSummary: resolveFilterSummary(),
        },
        dynamicFilename,
      );
    } catch (err) {
      console.error("PDF export failed:", err);
      const message =
        err?.message ?? "Could not generate the PDF. Please try again.";
      setPdfError(message);
      showToast("Failed to generate PDF. Please try again.", "error");
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Toast toast={toast} onDismiss={dismiss} />
      <div className="flex items-center gap-2">
        <button
          onClick={handleExcel}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-[#171717] dark:border-slate-700 dark:bg-[#262626] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-[#21F1A8]"
        >
          <DownloadIcon />
          Export Excel
        </button>
        <button
          onClick={handlePdf}
          disabled={pdfExporting}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#262626] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-[#21F1A8]"
        >
          <DownloadIcon />
          {pdfExporting ? "Generating…" : "Export PDF"}
        </button>
        {judgeSheetEvents.length > 0 && (
          <button
            onClick={() => setJudgeModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-[#171717] dark:border-slate-700 dark:bg-[#262626] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-[#21F1A8]"
          >
            <DownloadIcon />
            Judge Sheets
          </button>
        )}
        {judgeSheetEvents.length > 0 && (
          <button
            onClick={handleGenerateStageSlips}
            disabled={slipsGenerating}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-[#262626] dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-[#21F1A8]"
          >
            <DownloadIcon />
            {slipsGenerating ? "Generating Slips..." : "Stage Slip"}
          </button>
        )}
      </div>
      {pdfError && (
        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {pdfError}
        </p>
      )}

      {judgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/80 dark:bg-[#262626]/80 backdrop-blur-xl p-5 shadow-2xl">
            <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
              Generate Judge Sheets
            </h3>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              How many judges per event?
            </p>

            <div className="mb-4 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setJudgeCount(n)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    judgeCount === n
                      ? "border-[#21F1A8] bg-[#21F1A8] text-[#171717]"
                      : "border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-[#171717]/40 text-slate-700 dark:text-slate-200 hover:bg-[#21F1A8]/10"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {judgeError && (
              <p className="mb-3 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {judgeError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setJudgeModalOpen(false)}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateJudgeSheets}
                disabled={judgeGenerating}
                className="rounded-lg bg-[#21F1A8] px-4 py-2 text-xs font-bold text-[#171717] shadow-sm transition-colors hover:bg-[#1cd694] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {judgeGenerating ? "Generating…" : "Generate PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
