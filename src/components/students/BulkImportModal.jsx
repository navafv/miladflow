import { useState } from "react";
import * as XLSX from "xlsx";
import { apiClient, ApiError } from "../../lib/apiClient.js";
import Modal from "../admin/Modal.jsx";
import Dropzone from "../admin/Dropzone.jsx";
import { Th, Td } from "../admin/TableShell.jsx";

function normalizeHeader(h) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
}

function normalizeGender(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (v.startsWith("b")) return "boys";
  if (v.startsWith("g")) return "girls";
  return null;
}

function findByName(list, name) {
  const target = String(name ?? "")
    .trim()
    .toLowerCase();
  if (!target) return null;
  return (
    list.find(
      (item) =>
        String(item.name ?? "")
          .trim()
          .toLowerCase() === target,
    ) ?? null
  );
}

async function parseBulkFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

export default function BulkImportModal({
  open,
  onClose,
  teams,
  categories,
  onImported,
  onImportedAllFailed,
}) {
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkReport, setBulkReport] = useState(null);
  const [bulkReportError, setBulkReportError] = useState("");

  const resetState = () => {
    setBulkFile(null);
    setBulkReport(null);
    setBulkReportError("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadBulkTemplate = () => {
    const headers = ["Name", "Class Name", "Team", "Category", "Gender"];
    const sampleTeam = teams?.[0]?.name ?? "Al-Ansar";
    const sampleCategory = categories?.[0]?.name ?? "Senior";
    const sampleRows = [
      ["Ahmed Rasheed", "8", sampleTeam, sampleCategory, "Boys"],
      ["Fathima Nizam", "7", sampleTeam, sampleCategory, "Girls"],
    ];

    const templateSheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    templateSheet["!cols"] = [
      { wch: 22 },
      { wch: 12 },
      { wch: 20 },
      { wch: 16 },
      { wch: 10 },
    ];

    const referenceRows = [
      ["Valid team names", "Valid category names", "Valid gender values"],
      ...Array.from({
        length: Math.max(teams?.length ?? 0, categories?.length ?? 0, 2),
      }).map((_, i) => [
        teams?.[i]?.name ?? "",
        categories?.[i]?.name ?? "",
        i === 0 ? "Boys" : i === 1 ? "Girls" : "",
      ]),
    ];
    const referenceSheet = XLSX.utils.aoa_to_sheet(referenceRows);
    referenceSheet["!cols"] = [{ wch: 22 }, { wch: 18 }, { wch: 16 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, templateSheet, "Students");
    XLSX.utils.book_append_sheet(
      workbook,
      referenceSheet,
      "Valid values (reference)",
    );

    XLSX.writeFile(workbook, "student-bulk-upload-template.xlsx");
  };

  const handleBulkImport = async () => {
    if (!bulkFile) return;
    setBulkImporting(true);
    setBulkReportError("");
    setBulkReport(null);

    try {
      const rawRows = await parseBulkFile(bulkFile);
      const prepared = rawRows.map((raw, index) => {
        const entries = Object.entries(raw).reduce((acc, [key, value]) => {
          acc[normalizeHeader(key)] = value;
          return acc;
        }, {});

        const name = String(entries.name ?? "").trim();
        const className = String(
          entries.classname ?? entries.class ?? "",
        ).trim();
        const teamName = entries.team;
        const categoryName = entries.category;
        const gender = normalizeGender(entries.gender);
        const team = findByName(teams, teamName);
        const category = findByName(categories, categoryName);

        const localErrors = {};
        if (!name) localErrors.name = ["Name is required."];
        if (!team) localErrors.team = [`Unknown team "${teamName ?? ""}".`];
        if (!category)
          localErrors.category = [`Unknown category "${categoryName ?? ""}".`];
        if (!gender)
          localErrors.gender = [
            `Gender must be Boys or Girls, got "${entries.gender ?? ""}".`,
          ];

        const input = {
          name,
          class_name: className,
          team: teamName,
          category: categoryName,
          gender: entries.gender,
        };

        if (Object.keys(localErrors).length > 0) {
          return {
            index,
            input,
            ok: false,
            localFailure: { index, input, success: false, errors: localErrors },
          };
        }

        return {
          index,
          input,
          ok: true,
          payload: {
            name,
            class_name: className,
            team: team.id,
            category: category.id,
            gender,
          },
        };
      });

      const sendable = prepared.filter((r) => r.ok);
      const localFailures = prepared
        .filter((r) => !r.ok)
        .map((r) => r.localFailure);

      let serverResults = [];
      if (sendable.length > 0) {
        const response = await apiClient.post("/students/bulk-import/", {
          rows: sendable.map((r) => r.payload),
        });
        serverResults = (response?.results ?? []).map((r, i) => ({
          ...r,
          index: sendable[i]?.index ?? r.index,
        }));
      }

      const combined = [...serverResults, ...localFailures].sort(
        (a, b) => a.index - b.index,
      );
      setBulkReport({ results: combined });

      const successCount = combined.filter((r) => r.success).length;
      if (successCount > 0) {
        onImported?.(successCount, combined.length);
      } else {
        onImportedAllFailed?.();
      }
    } catch (err) {
      setBulkReportError(
        err instanceof ApiError
          ? err.message
          : "Could not import this file. Please check its format and try again.",
      );
    } finally {
      setBulkImporting(false);
      setBulkFile(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Bulk upload students"
      wide={!!bulkReport}
    >
      <div className="space-y-4">
        {!bulkReport && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload an Excel or CSV file with columns: Name, Class Name,
              Team, Category, Gender. Team and Category values must match
              existing names exactly (e.g. "Team Al-Ansar", "Senior").
            </p>
            <button
              type="button"
              onClick={downloadBulkTemplate}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#21F1A8]/40 bg-[#21F1A8]/10 px-4 py-2.5 text-sm font-semibold text-[#171717] transition hover:bg-[#21F1A8]/20 dark:border-[#21F1A8]/30 dark:text-white dark:hover:bg-[#21F1A8]/15"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-4 w-4 flex-shrink-0"
              >
                <path
                  d="M12 4v11m0 0-4-4m4 4 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Download Excel template
            </button>
            <Dropzone onFiles={setBulkFile} />
            {bulkReportError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                {bulkReportError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#21F1A8] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!bulkFile || bulkImporting}
                onClick={handleBulkImport}
                className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold shadow-sm text-[#171717] transition hover:bg-[#1de09a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {bulkImporting ? "Importing…" : "Import students"}
              </button>
            </div>
          </>
        )}

        {bulkReport && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {bulkReport.results.filter((r) => r.success).length} of{" "}
              {bulkReport.results.length} rows imported successfully.
            </p>
            <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white dark:bg-[#262626]">
                  <tr>
                    <Th>Row</Th>
                    <Th>Name</Th>
                    <Th>Status</Th>
                    <Th>Details</Th>
                  </tr>
                </thead>
                <tbody>
                  {bulkReport.results.map((r) => (
                    <tr
                      key={r.index}
                      className={
                        r.success ? "" : "bg-red-50/60 dark:bg-red-950/20"
                      }
                    >
                      <Td>{r.index + 1}</Td>
                      <Td>{r.input?.name || "—"}</Td>
                      <Td>
                        {r.success ? (
                          <span className="font-semibold text-[#21F1A8]">
                            Imported
                          </span>
                        ) : (
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            Failed
                          </span>
                        )}
                      </Td>
                      <Td className="text-slate-500 dark:text-slate-400">
                        {r.success
                          ? `Reg No. ${r.reg_no ?? "—"}`
                          : Object.entries(r.errors ?? {})
                              .map(
                                ([field, msgs]) =>
                                  `${field}: ${Array.isArray(msgs) ? msgs.join(" ") : msgs}`,
                              )
                              .join("; ") || "Unknown error"}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBulkReport(null)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#21F1A8] transition-colors"
              >
                Import another file
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold shadow-sm text-[#171717] hover:bg-[#1de09a] transition-colors"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
