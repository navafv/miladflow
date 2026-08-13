import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { apiClient, ApiError } from "../../lib/apiClient.js";
import { useApiResource } from "../../lib/useApiResource.js";
import { useAuth } from "../../lib/authStore.js";
import { Field, Select } from "../../components/admin/FormFields.jsx";
import { PageHeader } from "../../components/admin/TableShell.jsx";
import {
  buildFilterSummary,
  buildExportTableNode,
  exportTableToPdf,
} from "../../components/admin/ExportButtons.jsx";
import { buildExportFilename } from "../../lib/exportFilename.js";
import { ensureMalayalamFontFace } from "../../lib/pdfFonts.js";
import { generateJudgeSheetsPDF } from "../../lib/judgeSheetsPdf.js";

// Shared helper: drives the exact same PDF pipeline used by ExportButtons
// (letterhead, pagination, Malayalam font handling) so every card here stays
// pixel-identical to exports triggered elsewhere in the app, with zero
// duplicated PDF logic.
async function downloadTablePdf({
  columns,
  rows,
  filename,
  filterLabels = [],
  allLabel = "All",
  title,
  filterSummary,
  orgName,
}) {
  await ensureMalayalamFontFace();
  const dynamicFilename = buildExportFilename({
    baseName: filename,
    filters: filterLabels,
    allLabel,
  });
  const built = buildExportTableNode({ columns, rows });
  await exportTableToPdf(
    built,
    { orgName, title, filterSummary },
    dynamicFilename,
  );
}

function downloadTableExcel({
  columns,
  rows,
  filename,
  filterLabels = [],
  allLabel = "All",
}) {
  const dynamicFilename = buildExportFilename({
    baseName: filename,
    filters: filterLabels,
    allLabel,
  });
  const data = rows.map((row) =>
    Object.fromEntries(columns.map((c) => [c.label, row[c.key]])),
  );
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${dynamicFilename}.xlsx`);
}

const ALL = "All";
const GENDER_OPTIONS = [
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
];

// ---------------------------------------------------------------------------
// Shared card shell — glassmorphism panel that every report card sits inside.
// ---------------------------------------------------------------------------
function ReportCard({ icon, title, description, children }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all hover:shadow-2xl hover:shadow-[#21F1A8]/10 dark:border-white/10 dark:bg-[#262626]/60">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#21F1A8]/20 blur-3xl"
      />
      <div className="relative">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#21F1A8]/30 bg-[#21F1A8]/10 text-[#21F1A8]">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function CardDivider() {
  return (
    <div className="my-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700" />
  );
}

function InlineSpinner() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActionButton({ onClick, disabled, loading, children, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "bg-[#21F1A8] text-[#171717] hover:bg-[#1cd694]"
          : "border border-slate-200 bg-white/80 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#171717]/60 dark:text-slate-200 dark:hover:bg-slate-800"
      }`}
    >
      {loading ? <InlineSpinner /> : null}
      {children}
    </button>
  );
}

// Icon set (kept inline / dependency-free, matching the rest of the admin UI)
const ICONS = {
  matrix: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 8h14M3 13h14M8 3v14M13 3v14" />
    </svg>
  ),
  judge: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <path
        d="M10 2.5 3 5.5v4c0 4.5 3 7 7 8 4-1 7-3.5 7-8v-4L10 2.5Z"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 10 9 11.5l3.5-3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  results: (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <path
        d="M10 2.5 12 7l5 .7-3.6 3.5.9 4.9L10 13.8 5.7 16.1l.9-4.9L3 7.7 8 7l2-4.5Z"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// Card 1 — Registration Matrix
// ---------------------------------------------------------------------------
function RegistrationMatrixCard({ categories, teams, orgName }) {
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [genderFilter, setGenderFilter] = useState(ALL);
  const [teamFilter, setTeamFilter] = useState(ALL);
  const [loadingKind, setLoadingKind] = useState(null); // "pdf" | "excel" | null
  const [error, setError] = useState(null);

  const filtersReady = categoryFilter !== ALL && genderFilter !== ALL;

  const filterLabels = useMemo(() => {
    const categoryName =
      categories.find((c) => String(c.id) === String(categoryFilter))?.name ??
      categoryFilter;
    const genderLabel =
      GENDER_OPTIONS.find((g) => g.value === genderFilter)?.label ??
      genderFilter;
    const teamName =
      teamFilter !== ALL
        ? (teams.find((t) => String(t.id) === String(teamFilter))?.name ??
          teamFilter)
        : null;
    return { categoryName, genderLabel, teamName };
  }, [categories, categoryFilter, genderFilter, teamFilter, teams]);

  async function fetchMatrixRows() {
    const params = new URLSearchParams({
      category: categoryFilter,
      gender: genderFilter,
    });
    if (teamFilter !== ALL) params.set("team", teamFilter);

    const result = await apiClient.get(
      `/registrations/matrix/?${params.toString()}`,
    );
    const events = result?.events ?? [];
    const students = result?.students ?? [];
    const registeredPairs = new Set(
      (result?.registered_pairs ?? []).map(
        ([studentId, eventId]) => `${studentId}:${eventId}`,
      ),
    );

    const columns = [
      { key: "studentName", label: "Student Name" },
      { key: "regNo", label: "Reg. No." },
      { key: "team", label: "Team" },
      ...events.map((ev) => ({ key: `event_${ev.id}`, label: ev.name })),
    ];
    const rows = students.map((s) => {
      const row = { studentName: s.name, regNo: s.reg_no, team: s.team_name };
      events.forEach((ev) => {
        row[`event_${ev.id}`] = registeredPairs.has(`${s.id}:${ev.id}`)
          ? "✓"
          : "—";
      });
      return row;
    });
    return { columns, rows };
  }

  const filterSummaryParts = [
    { label: "Category", value: filterLabels.categoryName },
    { label: "Gender", value: filterLabels.genderLabel },
    filterLabels.teamName
      ? { label: "Team", value: filterLabels.teamName }
      : null,
  ].filter(Boolean);

  const handleExport = async (kind) => {
    setError(null);
    setLoadingKind(kind);
    try {
      const { columns, rows } = await fetchMatrixRows();
      if (rows.length === 0) {
        setError("No registrations match that filter combination.");
        return;
      }

      const filenameLabels = [
        filterLabels.categoryName,
        filterLabels.genderLabel,
        filterLabels.teamName,
      ];

      if (kind === "excel") {
        downloadTableExcel({
          columns,
          rows,
          filename: "Registrations",
          filterLabels: filenameLabels,
          allLabel: "All_Students",
        });
      } else {
        await downloadTablePdf({
          columns,
          rows,
          filename: "Registrations",
          filterLabels: filenameLabels,
          allLabel: "All_Students",
          title: "Registrations Report",
          filterSummary: buildFilterSummary(filterSummaryParts),
          orgName,
        });
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : (err?.message ?? "Could not generate this export."),
      );
    } finally {
      setLoadingKind(null);
    }
  };

  return (
    <ReportCard
      icon={ICONS.matrix}
      title="Registration Matrix"
      description="Full student × event roster, filtered however you like."
    >
      <div className="grid grid-cols-1 gap-2.5">
        <Field label="Category">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value={ALL}>All / Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gender">
          <Select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value={ALL}>All / Select…</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Team">
          <Select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value={ALL}>All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {!filtersReady && (
        <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Pick a category and gender to enable exports.
        </p>
      )}
      {error && (
        <p className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      <CardDivider />

      <div className="flex gap-2">
        <ActionButton
          onClick={() => handleExport("pdf")}
          disabled={!filtersReady}
          loading={loadingKind === "pdf"}
          primary
        >
          Download PDF
        </ActionButton>
        <ActionButton
          onClick={() => handleExport("excel")}
          disabled={!filtersReady}
          loading={loadingKind === "excel"}
        >
          Download Excel
        </ActionButton>
      </div>
    </ReportCard>
  );
}

// ---------------------------------------------------------------------------
// Card 2 — Judge Scoring Sheets
// ---------------------------------------------------------------------------
function JudgeSheetsCard({ categories, orgName }) {
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [genderFilter, setGenderFilter] = useState(ALL);
  const [judgeCount, setJudgeCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filtersReady = categoryFilter !== ALL && genderFilter !== ALL;

  async function fetchJudgeSheetEvents() {
    const params = new URLSearchParams({
      category: categoryFilter,
      gender: genderFilter,
    });
    const result = await apiClient.get(
      `/registrations/matrix/?${params.toString()}`,
    );
    const events = result?.events ?? [];
    const students = result?.students ?? [];
    const groupEntries = result?.group_entries ?? [];
    const registeredPairs = new Set(
      (result?.registered_pairs ?? []).map(
        ([studentId, eventId]) => `${studentId}:${eventId}`,
      ),
    );

    const categoryName =
      categories.find((c) => String(c.id) === String(categoryFilter))?.name ??
      categoryFilter;
    const genderLabel =
      GENDER_OPTIONS.find((g) => g.value === genderFilter)?.label ?? null;

    return events
      .map((ev) => {
        const isGroup = ev.event_type === "group";
        if (isGroup) {
          const groups = groupEntries
            .filter((g) => g.event_id === ev.id)
            .map((g) => ({
              groupName: g.group_name,
              teamName: g.team_name,
              members: (g.students ?? []).map((s) => ({ regNo: s.reg_no })),
            }))
            .filter((g) => g.members.length > 0);
          return {
            eventName: ev.name,
            categoryLabel: categoryName,
            genderLabel,
            isGroup: true,
            groups,
          };
        }
        return {
          eventName: ev.name,
          categoryLabel: categoryName,
          genderLabel,
          isGroup: false,
          students: students
            .filter((s) => registeredPairs.has(`${s.id}:${ev.id}`))
            .map((s) => ({ regNo: s.reg_no })),
        };
      })
      .filter((ev) =>
        ev.isGroup ? ev.groups.length > 0 : ev.students.length > 0,
      );
  }

  const handleGenerate = async () => {
    setError(null);
    setLoading(true);
    try {
      const judgeSheetEvents = await fetchJudgeSheetEvents();
      if (judgeSheetEvents.length === 0) {
        setError("No registered students/groups found for this selection.");
        return;
      }
      await ensureMalayalamFontFace();
      await generateJudgeSheetsPDF(judgeSheetEvents, judgeCount, {
        orgName,
        filename: "Judge-Sheets",
      });
    } catch (err) {
      setError(err?.message ?? "Could not generate judge sheets.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ReportCard
      icon={ICONS.judge}
      title="Judge Scoring Sheets"
      description="Printable scoring sheets, one column per judge."
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field label="Category">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value={ALL}>All / Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Gender">
          <Select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value={ALL}>All / Select…</option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="mt-2.5">
        <Field label="Number of Judges" hint="Adds one score column per judge">
          <Select
            value={judgeCount}
            onChange={(e) => setJudgeCount(Number(e.target.value))}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} judge{n === 1 ? "" : "s"}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {!filtersReady && (
        <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Pick a category and gender to enable this export.
        </p>
      )}
      {error && (
        <p className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      <CardDivider />

      <ActionButton
        onClick={handleGenerate}
        disabled={!filtersReady}
        loading={loading}
        primary
      >
        Generate Judge Sheets (PDF)
      </ActionButton>
    </ReportCard>
  );
}

// ---------------------------------------------------------------------------
// Card 3 — Results & Placements
// ---------------------------------------------------------------------------
function ResultsCard({ categories, events, orgName }) {
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [allResults, setAllResults] = useState(true);
  const [loadingKind, setLoadingKind] = useState(null);
  const [error, setError] = useState(null);

  const categoryName =
    categories.find((c) => String(c.id) === String(categoryFilter))?.name ??
    categoryFilter;

  async function fetchResultRows() {
    const [placementsRaw, leaderboardRaw] = await Promise.all([
      apiClient.get("/results/placements/"),
      apiClient.get("/results/leaderboard/"),
    ]);
    const placements = Array.isArray(placementsRaw)
      ? placementsRaw
      : (placementsRaw?.results ?? []);
    const leaderboard = Array.isArray(leaderboardRaw)
      ? leaderboardRaw
      : (leaderboardRaw?.results ?? []);

    const eventsById = new Map(events.map((ev) => [ev.id, ev]));

    const scopedPlacements = placements.filter((p) => {
      if (allResults || categoryFilter === ALL) return true;
      const ev = eventsById.get(p.event?.id ?? p.event_id);
      const evCategoryId = ev?.category?.id ?? ev?.category_id;
      return String(evCategoryId) === String(categoryFilter);
    });

    const columns = [
      { key: "eventName", label: "Event" },
      { key: "place", label: "Place" },
      { key: "winner", label: "Winner" },
      { key: "team", label: "Team" },
    ];
    const rows = scopedPlacements
      .map((p) => {
        const ev = eventsById.get(p.event?.id ?? p.event_id);
        const winner =
          p.student?.name ?? p.group_entry?.display_name ?? p.team?.name ?? "—";
        const team = p.team?.name ?? p.student?.team?.name ?? "—";
        return {
          eventName: ev?.name ?? p.event?.name ?? "—",
          place: p.place,
          winner,
          team,
        };
      })
      .sort(
        (a, b) => a.place - b.place || a.eventName.localeCompare(b.eventName),
      );

    const standingsColumns = [
      { key: "team", label: "Team" },
      { key: "points", label: "Total Points" },
    ];
    const standingsRows = leaderboard
      .map((entry) => ({
        team: entry.team?.name ?? entry.team_name ?? "—",
        points: entry.total_points ?? entry.points ?? 0,
      }))
      .sort((a, b) => b.points - a.points);

    return { columns, rows, standingsColumns, standingsRows };
  }

  const handleExport = async (kind) => {
    setError(null);
    setLoadingKind(kind);
    try {
      const { columns, rows, standingsColumns, standingsRows } =
        await fetchResultRows();
      if (rows.length === 0) {
        setError("No results recorded for this selection yet.");
        return;
      }

      const filterLabels = allResults ? [] : [categoryName];
      const filterSummary = allResults
        ? "All categories"
        : buildFilterSummary([{ label: "Category", value: categoryName }]);

      if (kind === "excel") {
        const dynamicFilename = buildExportFilename({
          baseName: "Results",
          filters: filterLabels,
          allLabel: "All_Results",
        });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(
            rows.map((r) =>
              Object.fromEntries(columns.map((c) => [c.label, r[c.key]])),
            ),
          ),
          "Placements",
        );
        if (standingsRows.length > 0) {
          XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.json_to_sheet(
              standingsRows.map((r) =>
                Object.fromEntries(
                  standingsColumns.map((c) => [c.label, r[c.key]]),
                ),
              ),
            ),
            "Team Standings",
          );
        }
        XLSX.writeFile(workbook, `${dynamicFilename}.xlsx`);
      } else {
        await downloadTablePdf({
          columns,
          rows,
          filename: "Results",
          filterLabels,
          allLabel: "All_Results",
          title: "Results & Placements",
          filterSummary,
          orgName,
        });
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : (err?.message ?? "Could not generate this export."),
      );
    } finally {
      setLoadingKind(null);
    }
  };

  return (
    <ReportCard
      icon={ICONS.results}
      title="Results & Placements"
      description="Final placements per event, plus team standings."
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Field
          label="Category"
          hint={allResults ? "Ignored while All Results is on" : undefined}
        >
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={allResults}
          >
            <option value={ALL}>All / Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-[#171717]/50">
          <span className="font-medium text-slate-700 dark:text-slate-200">
            All Results
          </span>
          <span
            onClick={() => setAllResults((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              allResults ? "bg-[#21F1A8]" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                allResults ? "left-5" : "left-0.5"
              }`}
            />
          </span>
        </label>
      </div>

      {!allResults && categoryFilter === ALL && (
        <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          Pick a category, or switch on All Results.
        </p>
      )}
      {error && (
        <p className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}

      <CardDivider />

      <div className="flex gap-2">
        <ActionButton
          onClick={() => handleExport("pdf")}
          disabled={!allResults && categoryFilter === ALL}
          loading={loadingKind === "pdf"}
          primary
        >
          Export Results (PDF)
        </ActionButton>
        <ActionButton
          onClick={() => handleExport("excel")}
          disabled={!allResults && categoryFilter === ALL}
          loading={loadingKind === "excel"}
        >
          Export Results (Excel)
        </ActionButton>
      </div>
    </ReportCard>
  );
}

export default function ReportsPage() {
  const { me } = useAuth();
  const orgName = me?.madrassa?.name ?? null;

  const { data: categories, loading: categoriesLoading } =
    useApiResource("/categories/");
  const { data: teams, loading: teamsLoading } = useApiResource("/teams/");
  const { data: events, loading: eventsLoading } = useApiResource("/events/");

  const loadingFoundationData =
    categoriesLoading || teamsLoading || eventsLoading;

  return (
    <div>
      <PageHeader
        title="Reports & Exports"
        description="Every PDF and Excel export for the festival, in one place."
      />

      {loadingFoundationData ? (
        <p className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626] px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          Loading filters…
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          <RegistrationMatrixCard
            categories={categories}
            teams={teams}
            orgName={orgName}
          />
          <JudgeSheetsCard categories={categories} orgName={orgName} />
          <ResultsCard
            categories={categories}
            events={events}
            orgName={orgName}
          />
        </div>
      )}
    </div>
  );
}
