import { useState } from "react";
import { useApiResource } from "../../lib/useApiResource.js";
import { apiClient, ApiError } from "../../lib/apiClient.js";
import ExportButtons from "../../components/admin/ExportButtons.jsx";
import Modal from "../../components/admin/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import {
  Field,
  TextInput,
  Select,
  SegmentedControl,
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

const emptyForm = {
  source: "competition",
  event_id: "",
  name: "",
  venue_id: "",
  scheduled_date: "",
  scheduled_time_of_day: "",
  round_label: "",
};

function toIsoDatetime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const d = new Date(`${dateValue}T${timeValue}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toDateAndTimeValues(isoValue) {
  if (!isoValue) return { date: "", time: "" };
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function formatScheduledTime(isoValue) {
  if (!isoValue) return "—";
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ALL = "All";
const STATUS_OPTIONS = ["upcoming", "ongoing", "paused", "completed"];
const ALLOWED_TRANSITIONS = {
  upcoming: ["ongoing"],
  ongoing: ["paused", "completed"],
  paused: ["ongoing"],
  completed: [],
};

function canTransition(status, target) {
  return (ALLOWED_TRANSITIONS[status] ?? []).includes(target);
}

function ControlButton({ label, onClick, disabled, tone }) {
  const tones = {
    start: "border-[#21F1A8] text-[#21F1A8] hover:bg-[#21F1A8]/10",
    pause:
      "border-amber-400 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10",
    end: "border-rose-400 dark:border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10",
    reopen: "border-[#21F1A8] text-[#21F1A8] hover:bg-[#21F1A8]/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-30 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}

export default function AdminSchedulePage() {
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [eventFilter, setEventFilter] = useState(ALL);

  const {
    data: scheduleItems,
    loading,
    mutating,
    error,
    setError,
    refresh,
    create,
    update,
    remove,
    invalidate,
  } = useApiResource("/schedule/", {
    status: statusFilter === ALL ? undefined : statusFilter,
    event: eventFilter === ALL ? undefined : eventFilter,
  });

  const { data: events, loading: eventsLoading } = useApiResource("/events/");
  const { data: venues, loading: venuesLoading } = useApiResource("/venues/");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [transitioningId, setTransitioningId] = useState(null);
  const { toast, showToast, dismiss } = useToast();

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      event_id: events[0]?.id ?? "",
      venue_id: venues[0]?.id ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (item) => {
    const isCompetition = !!item.event;
    const { date, time } = toDateAndTimeValues(item.scheduled_time);
    setEditingId(item.id);
    setForm({
      source: isCompetition ? "competition" : "custom",
      event_id: item.event?.id ?? events[0]?.id ?? "",
      name: isCompetition ? "" : (item.name ?? ""),
      venue_id: item.venue?.id ?? "",
      scheduled_date: date,
      scheduled_time_of_day: time,
      round_label: item.round_label ?? "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await remove(id);
    } catch {
      showToast("Could not delete this schedule item. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const scheduledTimeIso = toIsoDatetime(
      form.scheduled_date,
      form.scheduled_time_of_day,
    );

    const payload =
      form.source === "competition"
        ? {
            event_id: form.event_id || null,
            name: "",
            venue_id: form.venue_id || null,
            scheduled_time: scheduledTimeIso,
            round_label: form.round_label,
          }
        : {
            event_id: null,
            name: form.name,
            venue_id: form.venue_id || null,
            scheduled_time: scheduledTimeIso,
            round_label: form.round_label,
          };

    if (form.source === "competition" && !payload.event_id) {
      setFormError("Please choose a competition event.");
      return;
    }
    if (form.source === "custom" && !form.name.trim()) {
      setFormError("Please enter a name for this custom item.");
      return;
    }
    if (!scheduledTimeIso) {
      setFormError("Please choose a date and time.");
      return;
    }

    try {
      if (editingId) {
        await update(editingId, payload);
      } else {
        await create(payload);
      }
      setModalOpen(false);
    } catch (err) {
      setFormError(
        err.message || "Could not save this schedule item. Please try again.",
      );
    }
  };

  const handleTransition = async (item, target) => {
    if (!canTransition(item.status, target)) return;
    setTransitioningId(item.id);
    setError(null);
    try {
      await apiClient.post(`/schedule/${item.id}/transition/`, {
        status: target,
      });
      invalidate();
      await refresh();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not update this item\u2019s status.";
      showToast(message);
    } finally {
      setTransitioningId(null);
    }
  };

  const handleReopen = async (item) => {
    if (item.status !== "completed") return;
    setTransitioningId(item.id);
    setError(null);
    try {
      await apiClient.post(`/schedule/${item.id}/reopen/`);
      invalidate();
      await refresh();
      showToast("Item reopened and set back to ongoing.", "success");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not reopen this item.";
      showToast(message);
    } finally {
      setTransitioningId(null);
    }
  };

  const exportColumns = [
    { key: "time", label: "Time" },
    { key: "name", label: "Item" },
    { key: "venue", label: "Venue / Stage" },
    { key: "round_label", label: "Round" },
    { key: "status", label: "Status" },
  ];
  const exportRows = scheduleItems.map((item) => ({
    ...item,
    time: formatScheduledTime(item.scheduled_time),
    name: item.event?.name ?? item.name,
    venue: item.venue?.name ?? "",
  }));

  return (
    <div>
      <PageHeader
        title="Live Schedule"
        description="This timeline drives the public festival page — status changes go out instantly."
        actions={
          <>
            <ExportButtons
              columns={exportColumns}
              rows={exportRows}
              filename="festival-schedule"
            />
            <AddButton onClick={openAdd} label="Add schedule item" />
          </>
        }
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626] p-4 sm:grid-cols-2 sm:max-w-md">
        <Field label="Status">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value={ALL}>All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Event">
          <Select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value={ALL}>All events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      <TableShell>
        <thead>
          <tr>
            <Th>Time</Th>
            <Th>Item</Th>
            <Th>Round</Th>
            <Th>Venue / Stage</Th>
            <Th>Source</Th>
            <Th>Status</Th>
            <Th>Live controls</Th>
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
                Loading schedule…
              </Td>
            </tr>
          )}
          {!loading &&
            scheduleItems.map((item) => {
              const isCompetition = !!item.event;
              const busy = mutating || transitioningId === item.id;
              return (
                <tr
                  key={item.id}
                  className="hover:bg-[#21F1A8]/5 dark:hover:bg-slate-800/30"
                >
                  <Td className="font-mono text-xs font-semibold text-[#21F1A8]">
                    {formatScheduledTime(item.scheduled_time)}
                  </Td>
                  <Td className="font-semibold text-slate-900 dark:text-white">
                    {item.event?.name ?? item.name}
                  </Td>
                  <Td className="text-xs">{item.round_label || "—"}</Td>
                  <Td className="text-xs">{item.venue?.name ?? "—"}</Td>
                  <Td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isCompetition
                          ? "bg-[#21F1A8]/10 text-[#21F1A8]"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {isCompetition ? "Competition event" : "Custom event"}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={item.status} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <ControlButton
                        label={item.status === "paused" ? "Resume" : "Start"}
                        tone="start"
                        disabled={
                          busy || !canTransition(item.status, "ongoing")
                        }
                        onClick={() => handleTransition(item, "ongoing")}
                      />
                      <ControlButton
                        label="Pause"
                        tone="pause"
                        disabled={busy || !canTransition(item.status, "paused")}
                        onClick={() => handleTransition(item, "paused")}
                      />
                      <ControlButton
                        label="Complete"
                        tone="end"
                        disabled={
                          busy || !canTransition(item.status, "completed")
                        }
                        onClick={() => handleTransition(item, "completed")}
                      />
                      {item.status === "completed" && (
                        <ControlButton
                          label="Reopen"
                          tone="reopen"
                          disabled={busy}
                          onClick={() => handleReopen(item)}
                        />
                      )}
                    </div>
                  </Td>
                  <Td>
                    <RowActions
                      onEdit={() => openEdit(item)}
                      onDelete={() => handleDelete(item.id)}
                    />
                  </Td>
                </tr>
              );
            })}
          {!loading && scheduleItems.length === 0 && (
            <tr>
              <Td
                colSpan={8}
                className="py-8 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                No schedule items match these filters.
              </Td>
            </tr>
          )}
        </tbody>
      </TableShell>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit schedule item" : "Add schedule item"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              {formError}
            </div>
          )}

          <Field label="Item type">
            <SegmentedControl
              options={["competition", "custom"]}
              value={form.source}
              onChange={(val) => setForm((f) => ({ ...f, source: val }))}
            />
          </Field>

          {form.source === "competition" ? (
            <Field
              label="Competition event"
              hint="Pulled from your Events list"
            >
              <Select
                disabled={eventsLoading}
                value={form.event_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, event_id: e.target.value }))
                }
              >
                <option value="" disabled>
                  {eventsLoading ? "Loading…" : "Select an event"}
                </option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field
              label="Custom event name"
              hint="e.g. Lunch, Rally, Inauguration"
            >
              <TextInput
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </Field>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Venue / Stage">
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
            <Field label="Round label" hint='Optional — e.g. "Round 2 of 3"'>
              <TextInput
                value={form.round_label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, round_label: e.target.value }))
                }
                placeholder="Round 2 of 3"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date">
              <TextInput
                type="date"
                required
                value={form.scheduled_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduled_date: e.target.value }))
                }
              />
            </Field>
            <Field label="Time">
              <TextInput
                type="time"
                required
                value={form.scheduled_time_of_day}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    scheduled_time_of_day: e.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              {mutating
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : "Add to schedule"}
            </button>
          </div>
        </form>
      </Modal>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
