import { useEffect, useMemo, useRef, useState } from "react";
import { useApiResource, invalidateCache } from "../../lib/useApiResource.js";
import { useDebounce } from "../../lib/useDebounce.js";
import { apiClient, ApiError } from "../../lib/apiClient.js";
import ExportButtons from "../../components/admin/ExportButtons.jsx";
import Modal from "../../components/admin/Modal.jsx";
import {
  Field,
  TextInput,
  Select,
  SegmentedControl,
  SearchInput,
} from "../../components/admin/FormFields.jsx";
import {
  PageHeader,
  AddButton,
  TableShell,
  Th,
  Td,
  RowActions,
} from "../../components/admin/TableShell.jsx";
import { getStudentWins, toMessage } from "../../lib/resultsStore.js";
import PosterGeneratorModal from "../../components/admin/PosterGeneratorModal.jsx";
import { Toast, useToast } from "../../components/admin/Toast.jsx";
import IdCardSetupModal from "../../components/admin/IdCardSetupModal.jsx";
import IdCardGenerator from "../../components/admin/IdCardGenerator.jsx";
import StudentFilterBar, {
  ALL,
} from "../../components/students/StudentFilterBar.jsx";
import BulkImportModal from "../../components/students/BulkImportModal.jsx";

function SkeletonBlock({ className = "" }) {
  return (
    <span
      className={`block animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`}
    />
  );
}

function StudentSkeletonRow(props) {
  return (
    <tr
      {...props}
      className="border-b border-slate-100 dark:border-slate-800/80 last:border-0"
    >
      <Td>
        <SkeletonBlock className="h-3.5 w-3.5 rounded" />
      </Td>

      <Td>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
          <SkeletonBlock className="h-3.5 w-28 rounded-md" />
        </div>
      </Td>

      <Td>
        <SkeletonBlock className="h-3 w-14 rounded-md" />
      </Td>

      <Td>
        <SkeletonBlock className="h-3 w-16 rounded-md" />
      </Td>

      <Td>
        <SkeletonBlock className="h-3 w-16 rounded-md" />
      </Td>

      <Td>
        <SkeletonBlock className="h-3 w-16 rounded-md" />
      </Td>

      <Td>
        <SkeletonBlock className="h-3 w-10 rounded-md" />
      </Td>

      <Td>
        <SkeletonBlock className="h-7 w-28 rounded-lg" />
      </Td>

      <Td>
        <div className="flex items-center gap-1.5">
          <SkeletonBlock className="h-1.5 w-1.5 rounded-full" />
          <SkeletonBlock className="h-1.5 w-1.5 rounded-full" />
          <SkeletonBlock className="h-1.5 w-1.5 rounded-full" />
        </div>
      </Td>
    </tr>
  );
}

function MobileSkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#262626]"
    >
      <div className="flex items-start gap-3">
        <SkeletonBlock className="h-4 w-4 shrink-0 rounded" />
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3.5 w-32 rounded-md" />
          <SkeletonBlock className="h-3 w-20 rounded-md" />
        </div>
        <SkeletonBlock className="h-3 w-3 rounded-full" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <SkeletonBlock className="h-3 w-full rounded-md" />
        <SkeletonBlock className="h-3 w-full rounded-md" />
        <SkeletonBlock className="h-3 w-full rounded-md" />
      </div>
      <SkeletonBlock className="mt-3 h-8 w-full rounded-lg" />
    </div>
  );
}

function MobileStudentCard({
  student: s,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onGeneratePoster,
  isGeneratingPoster,
  canGeneratePoster,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-shadow dark:border-slate-800 dark:bg-[#262626]">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          aria-label={`Select ${s.name}`}
          checked={selected}
          onChange={onToggleSelect}
          className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#21F1A8] focus:ring-[#21F1A8]"
        />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-800 bg-[#21F1A8]/10">
          <span className="text-sm font-semibold text-[#21F1A8]">
            {s.name.charAt(0)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 dark:text-white">
            {s.name}
          </p>
          <p className="truncate font-mono text-xs text-slate-400 dark:text-slate-500">
            {s.reg_no}
          </p>
        </div>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-x-2 gap-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
        <div>
          <dt className="text-slate-400 dark:text-slate-500">Class</dt>
          <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
            {s.class_name || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400 dark:text-slate-500">Team</dt>
          <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
            {s.team?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400 dark:text-slate-500">Category</dt>
          <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
            {s.category?.name ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400 dark:text-slate-500">Gender</dt>
          <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">
            {s.gender}
          </dd>
        </div>
      </dl>

      {canGeneratePoster && (
        <button
          onClick={onGeneratePoster}
          disabled={isGeneratingPoster}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-[#171717] transition-all duration-200 hover:border-[#21F1A8] hover:text-[#21F1A8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-[#21F1A8] dark:focus-visible:ring-offset-[#262626]"
        >
          {isGeneratingPoster ? "Checking…" : "Generate poster"}
        </button>
      )}
    </div>
  );
}

const genderChoices = ["Boys", "Girls"];

function toGenderLabel(value) {
  if (!value) return genderChoices[0];
  const match = genderChoices.find(
    (opt) => opt.toLowerCase() === String(value).toLowerCase(),
  );
  return match ?? genderChoices[0];
}

function StudentsEmptyState({ onBulkImport, onAddManually }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-16 text-center dark:border-slate-800 dark:bg-[#171717] sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#21F1A8]/10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-8 w-8 text-[#0f9c74] dark:text-[#21F1A8]"
          aria-hidden="true"
        >
          <path
            d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 19c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M17 8v5M19.5 10.5h-5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="max-w-sm space-y-1.5">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Let&rsquo;s add your first students!
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Import your Madrassa&rsquo;s roster via CSV or add students manually
          to get started.
        </p>
      </div>

      <div className="flex w-full flex-col items-center gap-2.5 sm:w-auto sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onBulkImport}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#21F1A8] px-5 py-2.5 text-sm font-semibold text-[#171717] shadow-sm transition-all duration-200 hover:bg-[#1de09a] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 active:scale-[0.98] dark:focus-visible:ring-offset-[#171717] sm:w-auto"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M10 3v9m0 0-3-3m3 3 3-3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 14v1.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Bulk Import CSV
        </button>
        <button
          type="button"
          onClick={onAddManually}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-[#21F1A8] hover:text-[#0f9c74] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 active:scale-[0.98] dark:border-slate-700 dark:bg-transparent dark:text-slate-200 dark:hover:text-[#21F1A8] dark:focus-visible:ring-offset-[#171717] sm:w-auto"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M10 4.5v11M4.5 10h11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Add Student Manually
        </button>
      </div>
    </div>
  );
}

const emptyForm = {
  name: "",
  reg_no: "",
  class_name: "",
  team_id: "",
  category_id: "",
  gender: genderChoices[0],
};

export default function StudentsPage() {
  const [filters, setFilters] = useState({
    team: ALL,
    category: ALL,
    gender: ALL,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const {
    data: allStudents,
    loading,
    mutating,
    error,
    create,
    update,
    remove,
    refresh: refreshStudents,
  } = useApiResource("/students/", { search: debouncedSearch });

  const students = useMemo(() => {
    return allStudents.filter((s) => {
      if (filters.team !== ALL && String(s.team?.id) !== String(filters.team))
        return false;
      if (
        filters.category !== ALL &&
        String(s.category?.id) !== String(filters.category)
      )
        return false;
      if (
        filters.gender !== ALL &&
        String(s.gender).toLowerCase() !== filters.gender.toLowerCase()
      )
        return false;
      return true;
    });
  }, [allStudents, filters]);

  const hasLoadedOnceRef = useRef(false);
  useEffect(() => {
    if (!loading) hasLoadedOnceRef.current = true;
  }, [loading]);
  const isInitialLoad = loading && !hasLoadedOnceRef.current;
  const isBackgroundRefresh = loading && hasLoadedOnceRef.current;
  const isSearching = debouncedSearch.trim().length > 0;
  const isTrulyEmpty =
    !isInitialLoad && !isSearching && allStudents.length === 0;

  const { data: teams, loading: teamsLoading } = useApiResource("/teams/");
  const { data: categories, loading: categoriesLoading } =
    useApiResource("/categories/");
  const { data: placements } = useApiResource("/results/placements/");

  const studentIdsWithPlacements = useMemo(() => {
    const ids = new Set();
    (placements ?? []).forEach((p) => {
      const studentId = p.student?.id ?? p.student_id;
      if (studentId != null) ids.add(studentId);
      (p.group_entry?.students ?? []).forEach((member) => {
        if (member?.id != null) ids.add(member.id);
      });
    });
    return ids;
  }, [placements]);

  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [posterStudent, setPosterStudent] = useState(null);
  const [generatingPosterId, setGeneratingPosterId] = useState(null);
  const { toast, showToast, dismiss } = useToast();
  const [selectedIds, setSelectedIds] = useState([]);
  const [idCardSetupOpen, setIdCardSetupOpen] = useState(false);
  const [idCardJob, setIdCardJob] = useState(null);
  const [madrassaProfile, setMadrassaProfile] = useState({
    name: "",
    slug: "",
  });

  useEffect(() => {
    apiClient
      .get("/auth/me/")
      .then((me) => {
        setMadrassaProfile({
          name: me?.madrassa?.name ?? "",
          slug: me?.madrassa?.slug ?? "",
        });
      })
      .catch(() => {});
  }, []);

  const toggleStudentSelected = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const filtersActive =
    filters.team !== ALL || filters.category !== ALL || filters.gender !== ALL;

  const handleGenerateIdCards = ({
    students: cardStudents,
    layout,
    includeQr,
  }) => {
    setIdCardJob({ students: cardStudents, layout, includeQr });
    setIdCardSetupOpen(false);
  };

  const handleGeneratePoster = async (student) => {
    if (generatingPosterId != null) return;
    setGeneratingPosterId(student.id);
    try {
      const wins = await getStudentWins(student.id);
      if (wins.length === 0) {
        showToast("Posters are only generated for place winners.");
        return;
      }
      setPosterStudent({ student, wins });
    } catch (err) {
      showToast(
        err instanceof ApiError
          ? toMessage(err)
          : "Couldn't check this student's placements. Please try again.",
      );
    } finally {
      setGeneratingPosterId(null);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      team_id: teams[0]?.id ?? "",
      category_id: categories[0]?.id ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      reg_no: student.reg_no ?? "",
      class_name: student.class_name ?? "",
      team_id: student.team?.id ?? "",
      category_id: student.category?.id ?? "",
      gender: toGenderLabel(student.gender),
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
    } catch {
      showToast("Could not delete this student. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const payload = {
      name: form.name,
      class_name: form.class_name,
      team_id: form.team_id || null,
      category_id: form.category_id || null,
      gender: form.gender,
    };

    try {
      if (editingId) {
        await update(editingId, payload);
      } else {
        await create(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(
        err.message || "Could not save this student. Please try again.",
      );
    }
  };

  const handleBulkImported = (successCount, totalCount) => {
    invalidateCache("/students/?page_size=500");
    showToast(`Imported ${successCount} of ${totalCount} students.`, "success");
    refreshStudents(true);
  };

  const handleBulkImportedAllFailed = () => {
    showToast("No rows could be imported — see the report for details.");
  };

  const exportColumns = [
    { key: "reg_no", label: "Reg No." },
    { key: "name", label: "Name" },
    { key: "team", label: "Team" },
    { key: "category", label: "Category" },
    { key: "gender", label: "Gender" },
  ];
  const exportRows = students.map((s) => ({
    ...s,
    team: s.team?.name ?? "",
    category: s.category?.name ?? "",
  }));

  const noResultsMessage = isSearching
    ? `No students match "${debouncedSearch.trim()}".`
    : "No students match these filters.";

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage every student's profile, team, and category placement."
        actions={
          <>
            <ExportButtons
              columns={exportColumns}
              rows={exportRows}
              filename="Students"
              filterLabels={[
                categories.find((c) => String(c.id) === String(filters.category))
                  ?.name,
                teams.find((t) => String(t.id) === String(filters.team))?.name,
                filters.gender !== ALL ? filters.gender : null,
              ]}
              allLabel="All_Students"
            />
            <button
              onClick={() => setIdCardSetupOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] px-3 py-2 text-xs font-semibold text-[#171717] dark:text-[#21F1A8] transition hover:border-[#21F1A8] hover:text-[#21F1A8]"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M5 7V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3M5 15h10v3a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-3Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="3" y="7" width="14" height="6.5" rx="1.2" />
                <circle
                  cx="14.2"
                  cy="9.6"
                  r="0.6"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              Print ID Cards
            </button>
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] px-3 py-2 text-xs font-semibold text-[#171717] dark:text-[#21F1A8] transition hover:border-[#21F1A8] hover:text-[#21F1A8]"
            >
              Bulk upload
            </button>
            <AddButton onClick={openAdd} label="Add student" />
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {isTrulyEmpty ? (
        <StudentsEmptyState
          onBulkImport={() => setBulkOpen(true)}
          onAddManually={openAdd}
        />
      ) : (
        <>
          <div className="mb-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name or reg. no…"
              aria-label="Search students"
              className="sm:max-w-xs"
            />
          </div>

          <StudentFilterBar
            filters={filters}
            onChange={(field, value) =>
              setFilters((f) => ({ ...f, [field]: value }))
            }
            teams={teams}
            categories={categories}
            genderChoices={genderChoices}
          />

          {isBackgroundRefresh && (
            <p
              role="status"
              aria-live="polite"
              className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
            >
              <span
                className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-[#21F1A8] border-t-transparent"
                aria-hidden="true"
              />
              Refreshing…
            </p>
          )}

          {isInitialLoad && (
            <p role="status" aria-live="polite" className="sr-only">
              Loading students…
            </p>
          )}

          <TableShell label="Students table" className="hidden sm:block">
            <thead>
              <tr>
                <Th>
                  <input
                    type="checkbox"
                    aria-label="Select all students"
                    checked={
                      students.length > 0 &&
                      selectedIds.length === students.length
                    }
                    ref={(el) => {
                      if (el)
                        el.indeterminate =
                          selectedIds.length > 0 &&
                          selectedIds.length < students.length;
                    }}
                    onChange={(e) =>
                      setSelectedIds(
                        e.target.checked ? students.map((s) => s.id) : [],
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#21F1A8] focus:ring-[#21F1A8]"
                  />
                </Th>
                <Th>Student</Th>
                <Th>Reg No.</Th>
                <Th>Class</Th>
                <Th>Team</Th>
                <Th>Category</Th>
                <Th>Gender</Th>
                <Th>Poster</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody
              className={
                isBackgroundRefresh
                  ? "opacity-60 transition-opacity"
                  : "transition-opacity"
              }
            >
              {isInitialLoad &&
                Array.from({ length: 6 }).map((_, i) => (
                  <StudentSkeletonRow
                    key={`skeleton-${i}`}
                    aria-hidden="true"
                  />
                ))}
              {!isInitialLoad &&
                students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <Td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${s.name}`}
                        checked={selectedIds.includes(s.id)}
                        onChange={() => toggleStudentSelected(s.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#21F1A8] focus:ring-[#21F1A8]"
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-800 bg-[#21F1A8]/10">
                          <span className="text-xs font-semibold text-[#21F1A8]">
                            {s.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {s.name}
                        </span>
                      </div>
                    </Td>
                    <Td className="font-mono text-xs">{s.reg_no}</Td>
                    <Td className="text-xs">{s.class_name || "—"}</Td>
                    <Td className="text-xs">{s.team?.name ?? "—"}</Td>
                    <Td className="text-xs">{s.category?.name ?? "—"}</Td>
                    <Td className="text-xs">{s.gender}</Td>
                    <Td>
                      {studentIdsWithPlacements.has(s.id) ? (
                        <button
                          onClick={() => handleGeneratePoster(s)}
                          disabled={generatingPosterId != null}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 text-xs font-semibold text-[#171717] dark:text-[#21F1A8] transition hover:border-[#21F1A8] hover:text-[#21F1A8] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {generatingPosterId === s.id
                            ? "Checking…"
                            : "Generate poster"}
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 dark:text-slate-600">
                          Not available
                        </span>
                      )}
                    </Td>
                    <Td>
                      <RowActions
                        onEdit={() => openEdit(s)}
                        onDelete={() => handleDelete(s.id)}
                      />
                    </Td>
                  </tr>
                ))}
              {!isInitialLoad && students.length === 0 && (
                <tr>
                  <Td
                    colSpan={9}
                    className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    {noResultsMessage}
                  </Td>
                </tr>
              )}
            </tbody>
          </TableShell>

          <div
            className={
              isBackgroundRefresh
                ? "flex flex-col gap-3 opacity-60 transition-opacity sm:hidden"
                : "flex flex-col gap-3 transition-opacity sm:hidden"
            }
          >
            {isInitialLoad &&
              Array.from({ length: 6 }).map((_, i) => (
                <MobileSkeletonCard key={`mobile-skeleton-${i}`} />
              ))}

            {!isInitialLoad &&
              students.map((s) => (
                <MobileStudentCard
                  key={s.id}
                  student={s}
                  selected={selectedIds.includes(s.id)}
                  onToggleSelect={() => toggleStudentSelected(s.id)}
                  onEdit={() => openEdit(s)}
                  onDelete={() => handleDelete(s.id)}
                  onGeneratePoster={() => handleGeneratePoster(s)}
                  isGeneratingPoster={generatingPosterId != null}
                  canGeneratePoster={studentIdsWithPlacements.has(s.id)}
                />
              ))}

            {!isInitialLoad && students.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-[#171717] dark:text-slate-400">
                {noResultsMessage}
              </p>
            )}
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit student" : "Add student"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
              {formError}
            </div>
          )}
          <Field label="Full name">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field
            label="Registration number"
            hint={
              editingId
                ? "Auto-generated — cannot be changed."
                : "Auto-generated on save — this preview updates after creation."
            }
          >
            <TextInput
              readOnly
              disabled
              value={editingId ? form.reg_no : "Assigned automatically"}
              className="cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            />
          </Field>
          <Field label="Class" hint="e.g. 5th Standard, 10th Grade">
            <TextInput
              value={form.class_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, class_name: e.target.value }))
              }
              placeholder="e.g. 5th Standard"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Team">
              <Select
                disabled={teamsLoading}
                value={form.team_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, team_id: e.target.value }))
                }
              >
                <option value="" disabled>
                  {teamsLoading ? "Loading…" : "Select a team"}
                </option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category">
              <Select
                disabled={categoriesLoading}
                value={form.category_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category_id: e.target.value }))
                }
              >
                <option value="" disabled>
                  {categoriesLoading ? "Loading…" : "Select a category"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Gender">
            <SegmentedControl
              options={genderChoices}
              value={form.gender}
              onChange={(val) => setForm((f) => ({ ...f, gender: val }))}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#21F1A8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutating}
              className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold shadow-sm text-[#171717] hover:bg-[#1de09a] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutating
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Add student"}
            </button>
          </div>
        </form>
      </Modal>

      <BulkImportModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        teams={teams}
        categories={categories}
        onImported={handleBulkImported}
        onImportedAllFailed={handleBulkImportedAllFailed}
      />

      {posterStudent && (
        <PosterGeneratorModal
          key={posterStudent.student.id}
          open={!!posterStudent}
          onClose={() => setPosterStudent(null)}
          student={posterStudent.student}
          winningEvents={posterStudent.wins}
          madrassaName={madrassaProfile.name || "Madrassa Milad"}
        />
      )}

      <IdCardSetupModal
        open={idCardSetupOpen}
        onClose={() => setIdCardSetupOpen(false)}
        onGenerate={handleGenerateIdCards}
        allStudents={allStudents}
        filteredStudents={students}
        filtersActive={filtersActive}
        selectedIds={selectedIds}
      />

      {idCardJob && (
        <IdCardGenerator
          students={idCardJob.students}
          layout={idCardJob.layout}
          includeQr={idCardJob.includeQr}
          madrassaName={madrassaProfile.name}
          tenantSlug={madrassaProfile.slug}
          onClose={() => setIdCardJob(null)}
        />
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
