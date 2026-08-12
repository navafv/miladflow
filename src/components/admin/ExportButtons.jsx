import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { toCanvas } from "html-to-image";
import {
  MALAYALAM_FONT_FAMILY,
  PDF_FONT_NAME,
  ensureMalayalamFontFace,
  registerMalayalamPdfFont,
} from "../../lib/pdfFonts.js";
import { generateJudgeSheetsPDF } from "../../lib/judgeSheetsPdf.js";
import { buildExportFilename } from "../../lib/exportFilename.js";

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
// Widened slightly to give the now-larger table font more breathing room
// per column before wrapping — the whole table is scaled down to fit the
// PDF page width anyway, so this only affects how much horizontal space
// each column gets to lay out in before that scale-down happens.
const PDF_TABLE_WIDTH_PX = 1100;
const PIXEL_RATIO = 2;
const FOOTER_SPACE_PT = 26;

const INK = [23, 23, 23];
const MUTED = [110, 118, 128];
const RULE = [210, 216, 222];
const BRAND = [16, 145, 105];

/** "10 Aug 2026" — used in the footer timestamp. */
function formatGeneratedDate(date) {
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Joins active filter values into a single "Category: Kiddies  |  Gender:
 * Boys  |  Event: Quran Recitation" line. Accepts either:
 *  - { label, value } objects (preferred — renders "Label: Value"), or
 *  - plain strings (rendered as-is, for callers that already have a
 *    formatted summary).
 * Falsy entries and objects with an empty value are dropped automatically.
 */
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

/**
 * Premium letterhead:
 *   Madrassa Name         (large, bold, centered, brand color)
 *   Document Title         (medium, bold, centered)
 *   Active filter summary  (small, muted, centered) — only if present
 *   ── rule ──
 * Every piece of text goes through the registered Noto Sans Malayalam font
 * (see registerMalayalamPdfFont), so Malayalam org names, titles, or filter
 * values render correctly instead of as blank boxes.
 */
function drawLetterhead(doc, { orgName, title, filterSummary }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let y = PDF_MARGIN_PT;

  if (orgName) {
    doc.setFont(PDF_FONT_NAME, "bold");
    doc.setFontSize(18);
    doc.setTextColor(...BRAND);
    doc.text(orgName, centerX, y + 14, { align: "center" });
    y += 22;
  }

  if (title) {
    doc.setFont(PDF_FONT_NAME, "bold");
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(title, centerX, y + 11, { align: "center" });
    y += 19;
  }

  if (filterSummary) {
    doc.setFont(PDF_FONT_NAME, "normal");
    doc.setFontSize(11);
    doc.setTextColor(...MUTED);
    doc.text(filterSummary, centerX, y + 10, { align: "center" });
    y += 17;
  }

  y += 6;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(1);
  doc.line(PDF_MARGIN_PT, y, pageWidth - PDF_MARGIN_PT, y);
  y += 14;

  return y;
}

/**
 * Professional footer: "Generated on: 10 Aug 2026" on the left, "Page 1 of
 * 3" on the right, above a thin rule. Drawn once per page after all pages
 * exist so the total page count is known.
 */
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

function buildExportTableNode({ columns, rows }) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.zIndex = "-1";
  container.style.pointerEvents = "none";
  container.style.width = `${PDF_TABLE_WIDTH_PX}px`;
  container.style.background = "#ffffff";
  container.style.fontFamily = `"${MALAYALAM_FONT_FAMILY}", sans-serif`;
  container.style.color = "#171717";

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.style.fontSize = "15px";
  table.style.lineHeight = "1.5";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    th.style.textAlign = "left";
    th.style.padding = "12px 14px";
    th.style.background = "#21F1A8";
    th.style.color = "#171717";
    th.style.fontWeight = "700";
    th.style.fontSize = "15px";
    th.style.border = "1px solid #171717";
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rowEls = rows.map((row, idx) => {
    const tr = document.createElement("tr");
    tr.style.background = idx % 2 === 0 ? "#ffffff" : "#f4f6f8";
    columns.forEach((col) => {
      const td = document.createElement("td");
      td.textContent = sanitizeCell(row[col.key]);
      td.style.padding = "11px 14px";
      td.style.border = "1px solid #cbd5e1";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
    return tr;
  });
  table.appendChild(tbody);
  container.appendChild(table);

  return { container, table, theadEl: thead, rowEls };
}

async function exportTableToPdf(
  { container, table, theadEl, rowEls },
  { orgName, title, filterSummary },
  filename,
) {
  document.body.appendChild(container);
  try {
    container.offsetHeight;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const tableRect = table.getBoundingClientRect();
    const theadHeightPxMeasured =
      theadEl.getBoundingClientRect().height * PIXEL_RATIO;
    const rowBoundsPxMeasured = rowEls.map((tr) => {
      const rect = tr.getBoundingClientRect();
      return {
        top: (rect.top - tableRect.top) * PIXEL_RATIO,
        bottom: (rect.bottom - tableRect.top) * PIXEL_RATIO,
      };
    });

    // IMPORTANT: do NOT pass skipFonts here. The row boundaries above were
    // measured from the live DOM, which is rendered with the real
    // registered Malayalam font (see ensureMalayalamFontFace()). If the
    // captured canvas is rasterized with a *different* fallback font
    // (skipFonts: true forces html-to-image to substitute one), each
    // row's actual painted height differs slightly from what we measured.
    // That per-row drift accumulates over a long roster, and by the final
    // page the measured/painted boundaries no longer agree — which is what
    // was silently cropping the last few students off the bottom of the
    // last page. Rendering with the same font that was measured keeps the
    // canvas pixel rows aligned with rowBoundsPx.
    const canvas = await toCanvas(table, {
      pixelRatio: PIXEL_RATIO,
      backgroundColor: "#ffffff",
      width: tableRect.width,
      height: tableRect.height,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(
        "The export table rendered with zero size — nothing to capture.",
      );
    }

    // Defensive rescale: even with matching fonts, browsers can still
    // sub-pixel round differently between getBoundingClientRect() and the
    // rasterized canvas. Rather than trust PIXEL_RATIO blindly, rescale
    // our DOM-measured boundaries onto the canvas's *actual* pixel height
    // so row slices always stay inside the real captured image — this
    // guarantees we never compute a page whose last row falls past the
    // bottom edge of `canvas`.
    const verticalCorrection =
      tableRect.height > 0
        ? canvas.height / (tableRect.height * PIXEL_RATIO)
        : 1;
    const theadHeightPx = theadHeightPxMeasured * verticalCorrection;
    const rowBoundsPx = rowBoundsPxMeasured.map(({ top, bottom }) => ({
      top: top * verticalCorrection,
      bottom: Math.min(bottom * verticalCorrection, canvas.height),
    }));

    const generatedAt = new Date();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    await registerMalayalamPdfFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidthPt = pageWidth - PDF_MARGIN_PT * 2;
    const scale = usableWidthPt / canvas.width;

    const contentTopPt = drawLetterhead(doc, { orgName, title, filterSummary });
    const page1UsableHeightPt =
      pageHeight - PDF_MARGIN_PT - FOOTER_SPACE_PT - contentTopPt;
    const laterPageUsableHeightPt =
      pageHeight - PDF_MARGIN_PT * 2 - FOOTER_SPACE_PT;

    const theadHeightPtAtScale = theadHeightPx * scale;
    const page1BodyPxAvailable =
      (page1UsableHeightPt - theadHeightPtAtScale) / scale;
    const laterPageBodyPxAvailable =
      (laterPageUsableHeightPt - theadHeightPtAtScale) / scale;

    if (page1BodyPxAvailable <= 0 || laterPageBodyPxAvailable <= 0) {
      throw new Error(
        "The page is too small to fit even the table header — try a smaller font or fewer columns.",
      );
    }

    const pages = [];
    let pageStart = 0;
    let pageHeightPx = 0;
    for (let i = 0; i < rowBoundsPx.length; i += 1) {
      const rowHeight = rowBoundsPx[i].bottom - rowBoundsPx[i].top;
      const limit =
        pages.length === 0 ? page1BodyPxAvailable : laterPageBodyPxAvailable;
      if (pageHeightPx > 0 && pageHeightPx + rowHeight > limit) {
        pages.push({ startIdx: pageStart, endIdx: i - 1 });
        pageStart = i;
        pageHeightPx = 0;
      }
      pageHeightPx += rowHeight;
    }
    if (rowBoundsPx.length === 0 || pageStart < rowBoundsPx.length) {
      pages.push({ startIdx: pageStart, endIdx: rowBoundsPx.length - 1 });
    }

    pages.forEach(({ startIdx, endIdx }, pageIndex) => {
      const bodyTopPx = rowBoundsPx[startIdx]?.top ?? theadHeightPx;
      const bodyBottomPx = rowBoundsPx[endIdx]?.bottom ?? theadHeightPx;
      const bodyHeightPx = Math.max(0, bodyBottomPx - bodyTopPx);
      const pageCanvasHeightPx = theadHeightPx + bodyHeightPx;

      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageCanvasHeightPx;
      const ctx = pageCanvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

      ctx.drawImage(
        canvas,
        0,
        0,
        canvas.width,
        theadHeightPx,
        0,
        0,
        canvas.width,
        theadHeightPx,
      );
      if (bodyHeightPx > 0) {
        ctx.drawImage(
          canvas,
          0,
          bodyTopPx,
          canvas.width,
          bodyHeightPx,
          0,
          theadHeightPx,
          canvas.width,
          bodyHeightPx,
        );
      }

      if (pageIndex > 0) {
        doc.addPage();
        if (title) {
          doc.setFont(PDF_FONT_NAME, "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(...MUTED);
          doc.text(title, PDF_MARGIN_PT, PDF_MARGIN_PT + 8);
        }
      }

      const imageY = pageIndex === 0 ? contentTopPt : PDF_MARGIN_PT + 16;
      doc.addImage(
        pageCanvas.toDataURL("image/png"),
        "PNG",
        PDF_MARGIN_PT,
        imageY,
        usableWidthPt,
        pageCanvasHeightPx * scale,
      );
    });

    const totalPages = pages.length;
    for (let i = 0; i < totalPages; i += 1) {
      doc.setPage(i + 1);
      drawFooter(doc, generatedAt, i, totalPages);
    }

    doc.save(`${filename}.pdf`);
  } finally {
    container.remove();
  }
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
      setJudgeError(err?.message ?? "Could not generate judge sheets.");
    } finally {
      setJudgeGenerating(false);
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
      await ensureMalayalamFontFace();
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
      setPdfError(
        err?.message ?? "Could not generate the PDF. Please try again.",
      );
    } finally {
      setPdfExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
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
