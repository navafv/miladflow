import { useEffect, useMemo, useState } from "react";
import { useApiResource } from "../../lib/useApiResource.js";
import {
  useEventRoster,
  loadEventRoster,
  registerStudent,
  unregisterStudent,
  registerStudentsBulk,
} from "../../lib/registrationStore.js";
import { PageHeader } from "../../components/admin/TableShell.jsx";
import {
  Field,
  TextInput,
  Select,
} from "../../components/admin/FormFields.jsx";
import { Toast, useToast } from "../../components/admin/Toast.jsx";

const ALL = "All";
const genderFilterChoices = [
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
];

function studentTeam(student) {
  const id = student.team?.id ?? student.team_id ?? "unassigned";
  const name = student.team?.name ?? student.team_name ?? "No team";
  return { id, name };
}

function studentCategoryName(student) {
  return (
    student.category?.name ?? student.category_name ?? student.category ?? ""
  );
}

export default function RegistrationPage() {
  const { data: events, loading: eventsLoading } = useApiResource("/events/");
  const { data: students, loading: studentsLoading } =
    useApiResource("/students/");
  const { data: categories, loading: categoriesLoading } =
    useApiResource("/categories/");

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [eventSearch, setEventSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [filters, setFilters] = useState({ category: ALL, gender: ALL });
  const [collapsedTeams, setCollapsedTeams] = useState(new Set());
  const [bulkRegisteringTeamId, setBulkRegisteringTeamId] = useState(null);
  const { toast, showToast, dismiss } = useToast();

  const { byStudentId, loading: rosterLoading, loadError } = useEventRoster();

  useEffect(() => {
    if (selectedEventId == null) return;
    loadEventRoster(selectedEventId).catch(() => {});
    setStudentSearch("");
  }, [selectedEventId]);

  const selectedEvent = useMemo(
    () => events.find((ev) => ev.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );
  const isGroupEvent = selectedEvent?.event_type === "group";

  const {
    data: groupEntries,
    loading: entriesLoading,
    create: createGroupEntry,
    remove: removeGroupEntry,
  } = useApiResource(
    "/group-entries/",
    selectedEventId ? { event: selectedEventId } : { event: "__none__" },
  );

  const selectedCategoryIsDefault = useMemo(() => {
    if (filters.category === ALL) return false;
    const selected = categories.find(
      (c) => String(c.id) === String(filters.category),
    );
    return Boolean(selected?.is_default);
  }, [categories, filters.category]);

  const eventMatchesFilters = (event) => {
    if (
      filters.gender !== ALL &&
      event.gender !== "both" &&
      event.gender !== filters.gender
    )
      return false;

    if (filters.category !== ALL) {
      const eventCategoryId = event.category?.id ?? event.category_id;
      if (String(eventCategoryId) !== String(filters.category)) return false;
    }

    return true;
  };

  const studentMatchesFilters = (student) => {
    if (filters.gender !== ALL && student.gender !== filters.gender)
      return false;

    if (filters.category !== ALL && !selectedCategoryIsDefault) {
      const studentCategoryId = student.category?.id ?? student.category_id;
      if (String(studentCategoryId) !== String(filters.category)) return false;
    }

    return true;
  };

  const studentMatchesSearch = (student) => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return true;
    const name = (student.name ?? "").toLowerCase();
    const regNo = String(student.reg_no ?? "").toLowerCase();
    return name.includes(q) || regNo.includes(q);
  };

  const filteredEvents = useMemo(() => {
    const q = eventSearch.trim().toLowerCase();
    return events.filter((ev) => {
      if (q && !ev.name.toLowerCase().includes(q)) return false;
      return eventMatchesFilters(ev);
    });
  }, [events, eventSearch, filters]);

  useEffect(() => {
    if (filteredEvents.length === 0) {
      if (selectedEventId !== null) setSelectedEventId(null);
      return;
    }
    const stillVisible = filteredEvents.some((ev) => ev.id === selectedEventId);
    if (!stillVisible) {
      setSelectedEventId(filteredEvents[0].id);
    }
  }, [filteredEvents, selectedEventId]);

  const isEligibleForEvent = (student, event) => {
    if (!event) return false;

    const genderOk = event.gender === "both" || event.gender === student.gender;
    if (!genderOk) return false;

    if (event.category?.is_default) return true;

    const studentCategoryId = student.category?.id ?? student.category_id;
    const eventCategoryId = event.category?.id ?? event.category_id;
    return studentCategoryId === eventCategoryId;
  };

  const teamGroups = useMemo(() => {
    if (!selectedEvent) return [];
    const eligible = students.filter(
      (s) =>
        isEligibleForEvent(s, selectedEvent) &&
        studentMatchesFilters(s) &&
        studentMatchesSearch(s),
    );

    const groups = new Map();
    eligible.forEach((student) => {
      const { id, name } = studentTeam(student);
      if (!groups.has(id))
        groups.set(id, { teamId: id, teamName: name, students: [] });
      groups.get(id).students.push(student);
    });

    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        students: [...g.students].sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => a.teamName.localeCompare(b.teamName));
  }, [students, selectedEvent, filters, studentSearch]);

  const squadAssignedStudentIds = useMemo(() => {
    const set = new Set();
    if (!isGroupEvent) return set;
    groupEntries.forEach((entry) => {
      (entry.students ?? []).forEach((s) => set.add(s.id));
    });
    return set;
  }, [groupEntries, isGroupEvent]);

  const toggleTeamCollapse = (teamId) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  const handleToggleStudent = async (student) => {
    if (!selectedEvent) return;
    const entry = byStudentId.get(student.id);

    if (!entry || entry.status === "error") {
      const result = await registerStudent(student.id, selectedEvent.id);
      if (!result.ok) showToast(`${student.name}: ${result.error}`, "error");
      return;
    }
    if (entry.status === "registered") {
      const result = await unregisterStudent(
        student.id,
        entry.registrationId,
        selectedEvent.id,
      );
      if (!result.ok) showToast(`${student.name}: ${result.error}`, "error");
      return;
    }
  };

  const handleRegisterTeam = async (group) => {
    if (!selectedEvent) return;
    const unregisteredIds = group.students
      .filter((s) => byStudentId.get(s.id)?.status !== "registered")
      .map((s) => s.id);

    if (unregisteredIds.length === 0) {
      showToast(
        `Everyone in ${group.teamName} is already registered.`,
        "success",
      );
      return;
    }

    setBulkRegisteringTeamId(group.teamId);
    try {
      const { registeredIds, failures } = await registerStudentsBulk(
        unregisteredIds,
        selectedEvent.id,
      );
      const parts = [];
      if (registeredIds.length)
        parts.push(`${registeredIds.length} registered`);
      if (failures.length) parts.push(`${failures.length} failed`);
      showToast(
        `${group.teamName}: ${parts.join(" · ") || "nothing changed"}.`,
        failures.length ? "error" : "success",
      );
    } finally {
      setBulkRegisteringTeamId(null);
    }
  };

  const handleSaveSquad = async ({
    teamId,
    groupName,
    memberIds,
    captainId,
  }) => {
    const { failures } = await registerStudentsBulk(
      memberIds,
      selectedEvent.id,
    );
    if (failures.length) {
      const names = failures
        .map(
          (f) =>
            students.find((s) => s.id === f.studentId)?.name ?? f.studentId,
        )
        .join(", ");
      showToast(`Couldn't register: ${names}`, "error");
      return false;
    }

    try {
      await createGroupEntry({
        event_id: selectedEvent.id,
        team_id: teamId,
        group_name: groupName,
        captain_id: captainId ?? null,
        student_ids: memberIds,
      });
      showToast("Squad saved.", "success");
      return true;
    } catch (err) {
      showToast(err.message ?? "Could not save the squad.", "error");
      return false;
    }
  };

  const handleDeleteSquad = async (entry) => {
    try {
      await removeGroupEntry(entry.id);
      await loadEventRoster(selectedEvent.id);
      showToast(
        `"${entry.display_name}" removed and its members unregistered from this event.`,
        "success",
      );
    } catch (err) {
      showToast(err.message ?? "Could not remove the squad.", "error");
    }
  };

  const shellLoading = eventsLoading || studentsLoading;

  return (
    <div>
      <PageHeader
        title="Event Registrations"
        description={
          isGroupEvent
            ? "Build squads per team — members are auto-registered when a squad is saved."
            : "Pick an event, then tick students in — each tick saves immediately."
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="lg:w-72 lg:shrink-0">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626] p-3">
            <Field label="Search events">
              <TextInput
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="e.g. Quran recitation"
              />
            </Field>

            <div className="mt-3 grid grid-cols-2 gap-2">
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
                  <option value={ALL}>All genders</option>
                  {genderFilterChoices.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-3 max-h-[65vh] overflow-y-auto pr-1">
              {shellLoading && (
                <p className="px-2 py-3 text-xs text-slate-400">
                  Loading events…
                </p>
              )}
              {!shellLoading && filteredEvents.length === 0 && (
                <p className="px-2 py-3 text-xs text-slate-400">
                  No events match.
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {filteredEvents.map((ev) => {
                  const active = ev.id === selectedEventId;
                  return (
                    <li key={ev.id}>
                      <button
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`flex w-full flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors ${
                          active
                            ? "bg-[#21F1A8]/15 text-[#0f8f66] dark:text-[#21F1A8] ring-1 ring-[#21F1A8]/40"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="text-sm font-semibold leading-tight">
                          {ev.name}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {ev.category?.name ?? ""} · {ev.gender} ·{" "}
                          {ev.event_type === "group" ? "Group" : "Individual"}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {!selectedEvent && !shellLoading && (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
              Select an event to see its roster.
            </div>
          )}

          {selectedEvent && (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626] px-4 py-3">
                <div>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedEvent.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedEvent.category?.name ?? ""} ·{" "}
                    {selectedEvent.gender} ·{" "}
                    {isGroupEvent ? "Group event" : "Individual event"}
                    {isGroupEvent && selectedEvent.max_group_size
                      ? ` · up to ${selectedEvent.max_group_size} per squad`
                      : ""}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isGroupEvent
                    ? `${groupEntries.length} squad${groupEntries.length === 1 ? "" : "s"}`
                    : `${byStudentId.size} registered total`}
                </span>
              </div>

              <div className="mb-3 max-w-xs">
                <Field label="Search students">
                  <TextInput
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Name or reg no…"
                  />
                </Field>
              </div>

              {loadError && (
                <p className="mb-3 rounded-lg border border-rose-400 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {loadError}
                </p>
              )}

              {(rosterLoading || (isGroupEvent && entriesLoading)) && (
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#21F1A8]">
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Loading…
                </p>
              )}

              <div className="flex flex-col gap-3">
                {teamGroups.map((group) =>
                  isGroupEvent ? (
                    <SquadTeamSection
                      key={group.teamId}
                      group={group}
                      event={selectedEvent}
                      squads={groupEntries.filter(
                        (e) => e.team.id === group.teamId,
                      )}
                      assignedStudentIds={squadAssignedStudentIds}
                      collapsed={collapsedTeams.has(group.teamId)}
                      onToggleCollapse={() => toggleTeamCollapse(group.teamId)}
                      onSaveSquad={handleSaveSquad}
                      onDeleteSquad={handleDeleteSquad}
                    />
                  ) : (
                    <IndividualTeamSection
                      key={group.teamId}
                      group={group}
                      byStudentId={byStudentId}
                      collapsed={collapsedTeams.has(group.teamId)}
                      onToggleCollapse={() => toggleTeamCollapse(group.teamId)}
                      onToggleStudent={handleToggleStudent}
                      onRegisterTeam={() => handleRegisterTeam(group)}
                      registeringTeam={bulkRegisteringTeamId === group.teamId}
                    />
                  ),
                )}

                {teamGroups.length === 0 && !rosterLoading && (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
                    {studentSearch.trim()
                      ? `No students match "${studentSearch.trim()}".`
                      : "No eligible students for this event's category/gender restriction."}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}

function IndividualTeamSection({
  group,
  byStudentId,
  collapsed,
  onToggleCollapse,
  onToggleStudent,
  onRegisterTeam,
  registeringTeam,
}) {
  const registeredCount = group.students.filter(
    (s) => byStudentId.get(s.id)?.status === "registered",
  ).length;
  const allRegistered =
    registeredCount === group.students.length && group.students.length > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626]">
      <TeamSectionHeader
        teamName={group.teamName}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        badge={`${registeredCount}/${group.students.length} Registered`}
        badgeComplete={allRegistered}
        action={
          !allRegistered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRegisterTeam();
              }}
              disabled={registeringTeam}
              className="rounded-lg border border-[#21F1A8]/60 px-2.5 py-1 text-[11px] font-semibold text-[#0f8f66] dark:text-[#21F1A8] hover:bg-[#21F1A8]/10 transition-colors disabled:opacity-50"
            >
              {registeringTeam ? "Registering…" : "Register Team"}
            </button>
          )
        }
      />

      {!collapsed && (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800">
          {group.students.map((student) => {
            const entry = byStudentId.get(student.id);
            const status = entry?.status;
            const checked = status === "registered" || status === "saving";

            return (
              <li
                key={student.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <label className="flex flex-1 items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={status === "saving"}
                    onChange={() => onToggleStudent(student)}
                    className="h-4 w-4 rounded border-slate-300 text-[#21F1A8] focus:ring-[#21F1A8] disabled:opacity-50"
                  />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {student.name}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {student.reg_no} · {studentCategoryName(student)}
                    </span>
                  </span>
                </label>
                {status === "saving" && (
                  <span className="text-[11px] font-semibold text-amber-500">
                    Saving…
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SquadTeamSection({
  group,
  event,
  squads,
  assignedStudentIds,
  collapsed,
  onToggleCollapse,
  onSaveSquad,
  onDeleteSquad,
}) {
  const [building, setBuilding] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#262626]">
      <TeamSectionHeader
        teamName={group.teamName}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        badge={`${squads.length} squad${squads.length === 1 ? "" : "s"}`}
        badgeComplete={squads.length > 0}
      />

      {!collapsed && (
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 flex flex-col gap-3">
          {squads.map((entry) => (
            <SquadCard
              key={entry.id}
              entry={entry}
              onDelete={() => onDeleteSquad(entry)}
            />
          ))}

          {!building && (
            <button
              onClick={() => setBuilding(true)}
              className="self-start rounded-lg border border-dashed border-[#21F1A8]/60 px-3 py-2 text-xs font-semibold text-[#0f8f66] dark:text-[#21F1A8] hover:bg-[#21F1A8]/10 transition-colors"
            >
              + Build Squad
            </button>
          )}

          {building && (
            <SquadBuilderForm
              teamStudents={group.students}
              teamId={group.teamId}
              event={event}
              assignedStudentIds={assignedStudentIds}
              onCancel={() => setBuilding(false)}
              onSave={async (payload) => {
                const ok = await onSaveSquad(payload);
                if (ok) setBuilding(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function SquadCard({ entry, onDelete }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {entry.display_name}
          </p>
          {entry.captain && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Captain: {entry.captain.name}
            </p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="rounded-md px-2 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
        >
          Remove
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {entry.students.map((s) => (
          <span
            key={s.id}
            className="rounded-full bg-white dark:bg-[#262626] border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function SquadBuilderForm({
  teamStudents,
  teamId,
  event,
  assignedStudentIds,
  onCancel,
  onSave,
}) {
  const [groupName, setGroupName] = useState("");
  const [memberIds, setMemberIds] = useState(new Set());
  const [captainId, setCaptainId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggleMember = (studentId) => {
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
        if (captainId === studentId) setCaptainId(null);
      } else {
        if (event.max_group_size && next.size >= event.max_group_size) {
          setError(
            `This event allows at most ${event.max_group_size} students per squad.`,
          );
          return prev;
        }
        setError(null);
        next.add(studentId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (memberIds.size === 0) {
      setError("Pick at least one student for this squad.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await onSave({
      teamId,
      groupName: groupName.trim(),
      memberIds: Array.from(memberIds),
      captainId,
    });
    setSaving(false);
    if (result === false) setError("Could not save — see toast for details.");
  };

  const selectedMembers = teamStudents.filter((s) => memberIds.has(s.id));

  return (
    <div className="rounded-xl border border-[#21F1A8]/40 bg-[#21F1A8]/5 p-3 flex flex-col gap-3">
      <Field label="Squad name" hint="Optional — defaults to the team name.">
        <TextInput
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder={`e.g. ${teamStudents[0] ? "Squad A" : ""}`}
        />
      </Field>

      <div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Members
        </span>
        <ul className="mt-1.5 max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
          {teamStudents.map((student) => {
            const alreadyAssigned =
              assignedStudentIds.has(student.id) && !memberIds.has(student.id);
            return (
              <li
                key={student.id}
                className="flex items-center gap-3 px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={memberIds.has(student.id)}
                  disabled={alreadyAssigned}
                  onChange={() => toggleMember(student.id)}
                  className="h-4 w-4 rounded border-slate-300 text-[#21F1A8] focus:ring-[#21F1A8] disabled:opacity-40"
                />
                <span
                  className={`text-sm ${
                    alreadyAssigned
                      ? "text-slate-400 dark:text-slate-600"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {student.name}
                  {alreadyAssigned && (
                    <span className="ml-1.5 text-[11px] font-medium text-slate-400">
                      already in a squad for this event
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {selectedMembers.length > 0 && (
        <Field
          label="Captain"
          hint="Optional — must be one of the selected members."
        >
          <select
            value={captainId ?? ""}
            onChange={(e) =>
              setCaptainId(e.target.value ? Number(e.target.value) : null)
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-[#21F1A8] focus:ring-2 focus:ring-[#21F1A8] dark:border-slate-700 dark:bg-[#171717] dark:text-white"
          >
            <option value="">No captain</option>
            {selectedMembers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[#21F1A8] px-4 py-2 text-xs font-semibold text-[#171717] shadow-sm hover:bg-[#1de09a] disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save squad"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function TeamSectionHeader({
  teamName,
  collapsed,
  onToggleCollapse,
  badge,
  badgeComplete,
  action,
}) {
  return (
    <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
      <button
        onClick={onToggleCollapse}
        className="flex flex-1 items-center gap-2 text-left"
        aria-expanded={!collapsed}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${collapsed ? "-rotate-90" : ""}`}
          aria-hidden="true"
        >
          <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-display text-sm font-semibold text-slate-900 dark:text-white">
          {teamName}
        </span>
      </button>

      <div className="flex items-center gap-2">
        {action}
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
            badgeComplete
              ? "bg-[#21F1A8]/15 text-[#0f8f66] dark:text-[#21F1A8]"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"
          }`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
}
