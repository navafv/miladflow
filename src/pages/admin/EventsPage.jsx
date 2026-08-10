import { useState } from "react";
import { useApiResource } from "../../lib/useApiResource.js";
import { useDebounce } from "../../lib/useDebounce.js";
import { ApiError } from "../../lib/apiClient.js";
import ExportButtons from "../../components/admin/ExportButtons.jsx";
import Modal from "../../components/admin/Modal.jsx";
import {
  Field,
  TextInput,
  NumberInput,
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
import { Toast, useToast } from "../../components/admin/Toast.jsx";

const genderOptions = ["Boys", "Girls", "Both"];
const eventTypes = ["Individual", "Group"];

function toGenderLabel(value) {
  if (!value) return genderOptions[0];
  const match = genderOptions.find(
    (opt) => opt.toLowerCase() === String(value).toLowerCase(),
  );
  return match ?? genderOptions[0];
}

const ALL = "All";
const genderFilterOptions = [
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
];
const eventTypeFilterOptions = [
  { value: "individual", label: "Individual" },
  { value: "group", label: "Group" },
];
const stageFilterOptions = [
  { value: "true", label: "Stage" },
  { value: "false", label: "Off-stage" },
];
const defaultFilters = {
  category: ALL,
  gender: ALL,
  event_type: ALL,
  is_stage: ALL,
};

const emptyForm = {
  name: "",
  category_id: "",
  gender: genderOptions[0],
  event_type: eventTypes[0],
  max_group_size: "",
  is_stage: true,
  first_points: 5,
  second_points: 3,
  third_points: 1,
  venue_id: "",
};

export default function EventsPage() {
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const apiParams = { search: debouncedSearch };
  if (filters.category !== ALL) apiParams.category = filters.category;
  if (filters.gender !== ALL) apiParams.gender = filters.gender;
  if (filters.event_type !== ALL) apiParams.event_type = filters.event_type;
  if (filters.is_stage !== ALL) apiParams.is_stage = filters.is_stage;

  const {
    data: events,
    loading,
    mutating,
    error,
    create,
    update,
    remove,
  } = useApiResource("/events/", apiParams);
  const { data: categories, loading: categoriesLoading } =
    useApiResource("/categories/");
  const { data: venues, loading: venuesLoading } = useApiResource("/venues/");

  const filtersActive = Object.entries(filters).some(
    ([, value]) => value !== ALL,
  );
  const clearFilters = () => setFilters(defaultFilters);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const { toast, showToast, dismiss } = useToast();

  const editingEvent = editingId
    ? events.find((ev) => ev.id === editingId)
    : null;
  const isLocked = !!editingEvent?.is_locked;

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category_id: categories[0]?.id ?? "",
      venue_id: venues[0]?.id ?? "",
    });
    setFormError("");
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditingId(ev.id);
    setForm({
      name: ev.name,
      category_id: ev.category?.id ?? "",
      gender: toGenderLabel(ev.gender),
      event_type: ev.event_type === "group" ? "Group" : "Individual",
      max_group_size: ev.max_group_size ?? "",
      is_stage: ev.is_stage,
      first_points: ev.first_points,
      second_points: ev.second_points,
      third_points: ev.third_points,
      venue_id: ev.venue?.id ?? "",
    });
    setFormError("");
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
    } catch {
      showToast("Could not delete this event. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (!form.category_id) {
      setFormError("Please choose a category.");
      return;
    }
    if (form.event_type === "Group" && !form.max_group_size) {
      setFormError("Max participants per team is required for group events.");
      return;
    }

    const payload = {
      name: form.name,
      category_id: form.category_id,
      gender: form.gender,
      event_type: form.event_type,
      max_group_size:
        form.event_type === "Group"
          ? Number(form.max_group_size) || null
          : null,
      is_stage: form.is_stage,
      first_points: Number(form.first_points),
      second_points: Number(form.second_points),
      third_points: Number(form.third_points),
      venue_id: form.venue_id || null,
    };

    try {
      if (editingId) {
        await update(editingId, payload);
      } else {
        await create(payload);
      }
      setModalOpen(false);
    } catch (err) {
      const detail = err instanceof ApiError ? err.data?.error?.detail : null;
      if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        const nextFieldErrors = {};
        Object.entries(detail).forEach(([field, value]) => {
          nextFieldErrors[field] = Array.isArray(value)
            ? value[0]
            : String(value);
        });
        setFieldErrors(nextFieldErrors);
      }
      setFormError(
        err.message || "Could not save this event. Please try again.",
      );
    }
  };

  const exportColumns = [
    { key: "name", label: "Event" },
    { key: "category", label: "Category" },
    { key: "gender", label: "Gender" },
    { key: "event_type", label: "Type" },
    { key: "venue", label: "Venue" },
  ];
  const exportRows = events.map((ev) => ({
    ...ev,
    category: ev.category?.name ?? "",
    venue: ev.venue?.name ?? "",
  }));

  const isSearching = debouncedSearch.trim().length > 0;
  const noResultsMessage = isSearching
    ? `No events match "${debouncedSearch.trim()}".`
    : filtersActive
      ? "No events match these filters."
      : "No events yet.";

  return (
    <div>
      <PageHeader
        title="Events"
        description="Define every competition, its eligibility, and how points are awarded."
        actions={
          <>
            <ExportButtons
              columns={exportColumns}
              rows={exportRows}
              filename="Events"
              filterLabels={[
                categories.find((c) => String(c.id) === String(filters.category))
                  ?.name,
                filters.gender !== ALL ? filters.gender : null,
                eventTypeFilterOptions.find(
                  (o) => o.value === filters.event_type,
                )?.label,
                stageFilterOptions.find((o) => o.value === filters.is_stage)
                  ?.label,
              ]}
              allLabel="All_Events"
            />
            <AddButton onClick={openAdd} label="Add event" />
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="mb-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] p-4">
        <Field label="Search">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by event name…"
            aria-label="Search events"
            className="mb-3 sm:max-w-xs"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Category">
            <Select
              value={filters.category}
              disabled={categoriesLoading}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value }))
              }
            >
              <option value={ALL}>All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Gender">
            <Select
              value={filters.gender}
              onChange={(e) =>
                setFilters((f) => ({ ...f, gender: e.target.value }))
              }
            >
              <option value={ALL}>Any</option>
              {genderFilterOptions.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Event type">
            <Select
              value={filters.event_type}
              onChange={(e) =>
                setFilters((f) => ({ ...f, event_type: e.target.value }))
              }
            >
              <option value={ALL}>All types</option>
              {eventTypeFilterOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stage / Off-stage">
            <Select
              value={filters.is_stage}
              onChange={(e) =>
                setFilters((f) => ({ ...f, is_stage: e.target.value }))
              }
            >
              <option value={ALL}>All</option>
              {stageFilterOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {filtersActive && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-[#21F1A8] dark:text-slate-400 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <TableShell>
        <thead>
          <tr>
            <Th>Event</Th>
            <Th>Category</Th>
            <Th>Gender</Th>
            <Th>Type</Th>
            <Th>Venue</Th>
            <Th>Stage</Th>
            <Th>1st / 2nd / 3rd</Th>
            <Th>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <Td
                colSpan={8}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                Loading events…
              </Td>
            </tr>
          )}
          {!loading &&
            events.map((ev) => (
              <tr
                key={ev.id}
                className="hover:bg-[#21F1A8]/5 dark:hover:bg-slate-800/30"
              >
                <Td className="font-semibold text-slate-900 dark:text-white">
                  {ev.name}
                  {ev.is_locked && (
                    <span className="ml-2 rounded-full bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Locked
                    </span>
                  )}
                </Td>
                <Td className="text-xs">{ev.category?.name}</Td>
                <Td className="text-xs">{ev.gender}</Td>
                <Td className="text-xs">
                  {ev.event_type}
                  {ev.event_type?.toLowerCase() === "group" && ev.max_group_size
                    ? ` (max ${ev.max_group_size})`
                    : ""}
                </Td>
                <Td className="text-xs">{ev.venue?.name ?? "—"}</Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      ev.is_stage
                        ? "bg-[#21F1A8]/10 text-[#21F1A8]"
                        : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {ev.is_stage ? "Stage" : "Off-stage"}
                  </span>
                </Td>
                <Td className="font-mono text-xs">
                  {ev.first_points} / {ev.second_points} / {ev.third_points}
                </Td>
                <Td>
                  <RowActions
                    onEdit={() => openEdit(ev)}
                    onDelete={() => handleDelete(ev.id)}
                  />
                </Td>
              </tr>
            ))}
          {!loading && events.length === 0 && (
            <tr>
              <Td
                colSpan={8}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                {noResultsMessage}
              </Td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit event" : "Add event"}
        wide
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              {formError}
            </div>
          )}

          {isLocked && (
            <div className="rounded-lg border border-amber-400 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              This event already has registrations or placements, so Type,
              Gender, and Stage / Off-stage are locked to prevent breaking
              existing entries.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event name" hint="e.g. Quran Recitation (Tarteel)">
              <TextInput
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </Field>
            <Field
              label="Category"
              hint="Fetched from your Categories list, including General"
            >
              <Select
                required
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
            <Field label="Gender">
              <SegmentedControl
                options={genderOptions}
                value={form.gender}
                onChange={(val) =>
                  !isLocked && setForm((f) => ({ ...f, gender: val }))
                }
              />
              {fieldErrors.gender && (
                <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {fieldErrors.gender}
                </p>
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event type">
              <SegmentedControl
                options={eventTypes}
                value={form.event_type}
                onChange={(val) =>
                  !isLocked && setForm((f) => ({ ...f, event_type: val }))
                }
              />
              {fieldErrors.event_type && (
                <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {fieldErrors.event_type}
                </p>
              )}
            </Field>
            {form.event_type === "Group" && (
              <Field
                label="Max participants per team"
                hint="Maximum students allowed in one team's entry"
              >
                <NumberInput
                  min={1}
                  required
                  value={form.max_group_size}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, max_group_size: e.target.value }))
                  }
                />
              </Field>
            )}
            <Field label="Venue">
              <Select
                disabled={venuesLoading}
                value={form.venue_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, venue_id: e.target.value }))
                }
              >
                <option value="">
                  {venuesLoading ? "Loading…" : "No venue assigned"}
                </option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Stage / Off-stage">
              <SegmentedControl
                options={["Stage", "Off-stage"]}
                value={form.is_stage ? "Stage" : "Off-stage"}
                onChange={(val) =>
                  !isLocked &&
                  setForm((f) => ({ ...f, is_stage: val === "Stage" }))
                }
              />
              {fieldErrors.is_stage && (
                <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {fieldErrors.is_stage}
                </p>
              )}
            </Field>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Default placing points
            </p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="1st place">
                <NumberInput
                  min={0}
                  value={form.first_points}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      first_points: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="2nd place">
                <NumberInput
                  min={0}
                  value={form.second_points}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      second_points: e.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="3rd place">
                <NumberInput
                  min={0}
                  value={form.third_points}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      third_points: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutating}
              className="rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold text-[#171717] shadow-sm transition-colors hover:bg-[#1de09a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutating ? "Saving…" : editingId ? "Save changes" : "Add event"}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
