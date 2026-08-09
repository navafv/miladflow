import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { toCanvas } from "html-to-image";
import {
  MALAYALAM_FONT_FAMILY,
  ensureMalayalamFontFace,
} from "../../lib/pdfFonts.js";

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
const PDF_TABLE_WIDTH_PX = 980;
const PIXEL_RATIO = 2;
const FOOTER_SPACE_PT = 26;

const INK = [23, 23, 23];
const MUTED = [110, 118, 128];
const RULE = [210, 216, 222];

function formatGeneratedAt(date) {
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function drawLetterhead(doc, { orgName, title, subtitle }, generatedAt) {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = PDF_MARGIN_PT;

  if (orgName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...INK);
    doc.text(orgName, PDF_MARGIN_PT, y + 12);
    y += 20;
  }

  if (title) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(title, PDF_MARGIN_PT, y + 10);
    y += 16;
  }

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(subtitle, PDF_MARGIN_PT, y + 9);
    y += 14;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    `Generated on ${formatGeneratedAt(generatedAt)}`,
    pageWidth - PDF_MARGIN_PT,
    PDF_MARGIN_PT + 12,
    { align: "right" },
  );

  y += 8;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(1);
  doc.line(PDF_MARGIN_PT, y, pageWidth - PDF_MARGIN_PT, y);
  y += 12;

  return y;
}

function drawFooter(doc, orgName, pageIndex, totalPages) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const ruleY = pageHeight - PDF_MARGIN_PT - 12;

  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.75);
  doc.line(PDF_MARGIN_PT, ruleY, pageWidth - PDF_MARGIN_PT, ruleY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  if (orgName) {
    doc.text(orgName, PDF_MARGIN_PT, ruleY + 12);
  }
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
  table.style.fontSize = "13px";
  table.style.lineHeight = "1.45";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    th.style.textAlign = "left";
    th.style.padding = "9px 12px";
    th.style.background = "#21F1A8";
    th.style.color = "#171717";
    th.style.fontWeight = "700";
    th.style.fontSize = "13px";
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
      td.style.padding = "8px 12px";
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
  { orgName, title, subtitle },
  filename,
) {
  document.body.appendChild(container);
  try {
    container.offsetHeight;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const tableRect = table.getBoundingClientRect();
    const theadHeightPx = theadEl.getBoundingClientRect().height * PIXEL_RATIO;
    const rowBoundsPx = rowEls.map((tr) => {
      const rect = tr.getBoundingClientRect();
      return {
        top: (rect.top - tableRect.top) * PIXEL_RATIO,
        bottom: (rect.bottom - tableRect.top) * PIXEL_RATIO,
      };
    });

    const canvas = await toCanvas(table, {
      pixelRatio: PIXEL_RATIO,
      backgroundColor: "#ffffff",
      width: tableRect.width,
      height: tableRect.height,
      skipFonts: true,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error(
        "The export table rendered with zero size — nothing to capture.",
      );
    }

    const generatedAt = new Date();
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const usableWidthPt = pageWidth - PDF_MARGIN_PT * 2;
    const scale = usableWidthPt / canvas.width;

    const contentTopPt = drawLetterhead(
      doc,
      { orgName, title, subtitle },
      generatedAt,
    );
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
          doc.setFont("helvetica", "bold");
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
      drawFooter(doc, orgName, i, totalPages);
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
  title,
  subtitle,
  orgName,
}) {
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  const handleExcel = () => {
    const data = rows.map((row) =>
      Object.fromEntries(
        columns.map((c) => [c.label, sanitizeCell(row[c.key])]),
      ),
    );
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const handlePdf = async () => {
    setPdfError(null);
    setPdfExporting(true);
    try {
      await ensureMalayalamFontFace();
      const built = buildExportTableNode({ columns, rows });
      await exportTableToPdf(
        built,
        { orgName, title: title ?? filename.replace(/-/g, " "), subtitle },
        filename,
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
      </div>
      {pdfError && (
        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {pdfError}
        </p>
      )}
    </div>
  );
}
