import { useEffect, useMemo, useState, memo } from "react";
import { apiClient, ApiError } from "../../lib/apiClient.js";
import { useApiResource } from "../../lib/useApiResource.js";
import { useAuth } from "../../lib/authStore.js";
import ExportButtons from "../../components/admin/ExportButtons.jsx";
import { Field, Select } from "../../components/admin/FormFields.jsx";
import { PageHeader, Td } from "../../components/admin/TableShell.jsx";
import { Toast, useToast } from "../../components/admin/Toast.jsx";
import {
  buildGroupLetterMaps,
  buildMatrixExportTable,
  resolveMatrixCell,
  TICK,
} from "../../lib/registrationMatrix.js";

const ALL = "All";
const GENDER_OPTIONS = [
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
];

function normalizeAuditRow(row) {
  return {
    id: row.id,
    studentName: row.student_name ?? "—",
    regNo: row.student_reg_no ?? "—",
    eventName: row.event_name ?? "—",
    action: row.action ?? "—",
    performedByEmail: row.performed_by_email ?? "Unknown",
    performedAt: row.performed_at ?? null,
  };
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="mx-auto h-4 w-4 text-[#171717] dark:text-[#21F1A8]"
      aria-hidden="true"
    >
      <path
        d="M4 10.5 8 14.5 16 5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MatrixRow = memo(function MatrixRow({
  student,
  events,
  registeredPairs,
  letterMapsByEvent,
}) {
  return (
    <tr className="hover:bg-[#21F1A8]/5 dark:hover:bg-slate-800/30">
      <Td className="sticky left-0 z-10 min-w-[220px] bg-white dark:bg-[#262626] font-semibold text-slate-900 dark:text-white">
        <div>{student.name}</div>
        <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
          {student.reg_no} · {student.class_name} · {student.team_name}
        </div>
      </Td>
      {events.map((ev) => {
        const isRegistered = registeredPairs.has(`${student.id}:${ev.id}`);
        const cell = resolveMatrixCell({
          event: ev,
          studentId: student.id,
          isRegistered,
          letterMapsByEvent,
        });
        return (
          <Td key={ev.id} className="min-w-[120px] text-center">
            {cell === TICK ? (
              <CheckIcon />
            ) : cell === "—" ? (
              <span className="text-slate-300 dark:text-slate-600">–</span>
            ) : (
              <span className="font-bold text-[#171717] dark:text-[#21F1A8]">
                {cell}
              </span>
            )}
          </Td>
        );
      })}
    </tr>
  );
});

export default function RegistrationsViewPage() {
  const [tab, setTab] = useState("report");
  const { me } = useAuth();
  const orgName = me?.madrassa?.name ?? null;
  const { data: categories } = useApiResource("/categories/");
  const { data: teams } = useApiResource("/teams/");

  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [genderFilter, setGenderFilter] = useState(ALL);
  const [teamFilter, setTeamFilter] = useState(ALL);

  const filtersReady = categoryFilter !== ALL && genderFilter !== ALL;

  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setMatrix(null);

    if (!filtersReady) {
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      category: categoryFilter,
      gender: genderFilter,
    });
    if (teamFilter !== ALL) params.set("team", teamFilter);

    apiClient
      .get(`/registrations/matrix/?${params.toString()}`)
      .then((result) => {
        if (cancelled) return;
        const events = result?.events ?? [];
        const students = result?.students ?? [];
        const registeredPairs = new Set(
          (result?.registered_pairs ?? []).map(
            ([studentId, eventId]) => `${studentId}:${eventId}`,
          ),
        );
        const groupEntries = result?.group_entries ?? [];
        const letterMapsByEvent = buildGroupLetterMaps(groupEntries);
        setMatrix({
          events,
          students,
          registeredPairs,
          groupEntries,
          letterMapsByEvent,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load the registration matrix.",
        );
        setMatrix(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [categoryFilter, genderFilter, teamFilter, filtersReady]);

  const isRegistered = (studentId, eventId) =>
    matrix?.registeredPairs.has(`${studentId}:${eventId}`) ?? false;

  const { exportColumns, exportRows } = useMemo(() => {
    if (!matrix) return { exportColumns: [], exportRows: [] };
    const { columns, rows } = buildMatrixExportTable({
      events: matrix.events,
      students: matrix.students,
      registeredPairs: matrix.registeredPairs,
      groupEntries: matrix.groupEntries,
    });
    return { exportColumns: columns, exportRows: rows };
  }, [matrix]);

  const selectedFilterNames = useMemo(() => {
    if (!filtersReady) return null;
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
  }, [
    filtersReady,
    categories,
    categoryFilter,
    genderFilter,
    teamFilter,
    teams,
  ]);

  const exportFilterLabels = useMemo(() => {
    if (!selectedFilterNames) return [];
    const { categoryName, genderLabel, teamName } = selectedFilterNames;
    return [categoryName, genderLabel, teamName];
  }, [selectedFilterNames]);

  const exportFilterSummaryParts = useMemo(() => {
    if (!selectedFilterNames) return [];
    const { categoryName, genderLabel, teamName } = selectedFilterNames;
    const parts = [
      { label: "Category", value: categoryName },
      { label: "Gender", value: genderLabel },
    ];
    if (teamFilter !== ALL) {
      parts.push({ label: "Team", value: teamName });
    }
    return parts;
  }, [selectedFilterNames, teamFilter]);

  const judgeSheetEvents = useMemo(() => {
    if (!matrix) return [];
    const categoryName = selectedFilterNames?.categoryName ?? null;
    const genderLabel = selectedFilterNames?.genderLabel ?? null;

    return matrix.events
      .map((ev) => {
        const isGroup = ev.event_type === "group";

        if (isGroup) {
          const groups = matrix.groupEntries
            .filter((g) => g.event_id === ev.id)
            .map((g) => ({
              groupName: g.group_name,
              teamName: g.team_name,
              members: (g.students ?? []).map((s) => ({
                regNo: s.reg_no,
                name: s.name,
                teamName: s.team_name,
                className: s.class_name,
              })),
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
          students: matrix.students
            .filter((s) => isRegistered(s.id, ev.id))
            .map((s) => ({
              regNo: s.reg_no,
              name: s.name,
              teamName: s.team_name,
              className: s.class_name,
            })),
        };
      })
      .filter((ev) =>
        ev.isGroup ? ev.groups.length > 0 : ev.students.length > 0,
      );
  }, [matrix, selectedFilterNames]);

  const [auditRows, setAuditRows] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  useEffect(() => {
    if (tab !== "audit" || auditLoaded) return;
    let cancelled = false;
    setAuditLoading(true);
    setAuditError(null);
    apiClient
      .get("/registrations/audit-log/")
      .then((result) => {
        if (cancelled) return;
        const list = Array.isArray(result) ? result : (result?.results ?? []);
        setAuditRows(list.map(normalizeAuditRow));
        setAuditLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setAuditError(
          err instanceof ApiError
            ? err.message
            : "Could not load the audit log.",
        );
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, auditLoaded]);

  return (
    <div>
      <PageHeader
        title="Registrations Report"
        description="Select a category and gender to view the registration matrix at a glance."
        actions={
          tab === "report" && matrix ? (
            <ExportButtons
              columns={exportColumns}
              rows={exportRows}
              filename="Registrations"
              filterLabels={exportFilterLabels}
              filterSummaryParts={exportFilterSummaryParts}
              allLabel="All_Students"
              title="Registrations Report"
              orgName={orgName}
              judgeSheetEvents={judgeSheetEvents}
            />
          ) : null
        }
      />

      <div className="mb-5 inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626] p-1">
        <button
          type="button"
          onClick={() => setTab("report")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            tab === "report"
              ? "bg-[#21F1A8] text-[#171717]"
              : "text-slate-500 dark:text-slate-400 hover:bg-[#21F1A8]/10"
          }`}
        >
          Report
        </button>
        <button
          type="button"
          onClick={() => setTab("audit")}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            tab === "audit"
              ? "bg-[#21F1A8] text-[#171717]"
              : "text-slate-500 dark:text-slate-400 hover:bg-[#21F1A8]/10"
          }`}
        >
          Audit Log
        </button>
      </div>

      {tab === "report" && (
        <>
          <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626] p-4 sm:grid-cols-4">
            <Field label="Category">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value={ALL}>Select a category…</option>
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
                <option value={ALL}>Select a gender…</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Team" hint="Optional — narrows the roster further">
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
            <p className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-[#262626]/50 px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Select both a category and a gender to load the matrix.
            </p>
          )}

          {filtersReady && error && (
            <p className="mb-3 rounded-lg border border-rose-400 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          {filtersReady && loading && (
            <p className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626] px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
              Loading matrix…
            </p>
          )}

          {filtersReady && !loading && !error && matrix && (
            <>
              <p className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {matrix.students.length} student
                {matrix.students.length === 1 ? "" : "s"} ×{" "}
                {matrix.events.length} event
                {matrix.events.length === 1 ? "" : "s"}
              </p>

              {matrix.events.length === 0 || matrix.students.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626] px-4 py-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
                  No students or events match this category/gender combination.
                </p>
              ) : (
                <div
                  role="region"
                  aria-label="Registration matrix"
                  tabIndex={0}
                  className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] focus-visible:outline-2 focus-visible:outline-[#21F1A8]"
                >
                  <table className="w-full border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr>
                        <th className="sticky left-0 top-0 z-30 min-w-[220px] border-b border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Student
                        </th>
                        {matrix.events.map((ev) => (
                          <th
                            key={ev.id}
                            className="sticky top-0 z-20 min-w-[120px] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                          >
                            {ev.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrix.students.map((s) => (
                        <MatrixRow
                          key={s.id}
                          student={s}
                          events={matrix.events}
                          registeredPairs={matrix.registeredPairs}
                          letterMapsByEvent={matrix.letterMapsByEvent}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === "audit" && (
        <>
          <p className="mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {auditLoading
              ? "Loading…"
              : `${auditRows.length} force-delete event${auditRows.length === 1 ? "" : "s"} on record`}
          </p>

          {auditError && (
            <p className="mb-3 rounded-lg border border-rose-400 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {auditError}
            </p>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Student
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Reg. No.
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Event
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Action
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Performed by
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {!auditLoading &&
                  auditRows.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-[#21F1A8]/5 dark:hover:bg-slate-800/30"
                    >
                      <Td className="font-semibold text-slate-900 dark:text-white">
                        {r.studentName}
                      </Td>
                      <Td className="font-mono text-xs">{r.regNo}</Td>
                      <Td className="text-xs">{r.eventName}</Td>
                      <Td className="text-xs">
                        <span className="rounded-full bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                          {r.action.replace("_", " ")}
                        </span>
                      </Td>
                      <Td className="text-xs">{r.performedByEmail}</Td>
                      <Td className="text-xs">
                        {r.performedAt
                          ? new Date(r.performedAt).toLocaleString()
                          : "—"}
                      </Td>
                    </tr>
                  ))}
                {!auditLoading && auditRows.length === 0 && (
                  <tr>
                    <Td
                      colSpan={6}
                      className="py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No force-deletions recorded yet.
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
