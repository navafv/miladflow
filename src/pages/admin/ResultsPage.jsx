import { useCallback, useEffect, useMemo, useState } from "react";
import { apiClient } from "../../lib/apiClient.js";
import { useApiResource } from "../../lib/useApiResource.js";
import {
  useEventRoster,
  loadEventRoster,
} from "../../lib/registrationStore.js";
import { PageHeader } from "../../components/admin/TableShell.jsx";
import {
  Field,
  Select,
  NumberInput,
  TextInput,
} from "../../components/admin/FormFields.jsx";
import PosterModal from "../../components/admin/PosterModal.jsx";
import EventPoster from "../../components/admin/EventPoster.jsx";
import { Toast, useToast } from "../../components/admin/Toast.jsx";

function placementMatchesRow(placement, rowId, kind) {
  if (kind === "student")
    return (placement.student?.id ?? placement.student_id) === rowId;
  if (kind === "group_entry")
    return (placement.group_entry?.id ?? placement.group_entry_id) === rowId;
  return (
    !placement.group_entry &&
    !placement.group_entry_id &&
    (placement.team?.id ?? placement.team_id) === rowId
  );
}

function toWinnerLabel(
  placement,
  studentsList = [],
  groupEntriesList = [],
  teamsList = [],
) {
  if (placement.student || placement.student_id) {
    const sId =
      placement.student?.id ?? placement.student_id ?? placement.student;
    const richStudent = studentsList.find((s) => s.id === sId);
    return {
      id: sId,
      name: richStudent?.name ?? placement.student?.name ?? "",
      team:
        richStudent?.team?.name ??
        placement.student?.team?.name ??
        placement.team?.name ??
        "",
      isGroup: false,
    };
  }
  if (placement.group_entry || placement.group_entry_id) {
    const geId =
      placement.group_entry?.id ??
      placement.group_entry_id ??
      placement.group_entry;
    const richGe = groupEntriesList.find((ge) => ge.id === geId);
    return {
      id: geId,
      name:
        richGe?.display_name ||
        richGe?.captain?.name ||
        placement.group_entry?.display_name ||
        placement.team?.name ||
        "",
      team: richGe?.team?.name ?? placement.team?.name ?? "",
      isGroup: true,
    };
  }
  if (placement.team || placement.team_id) {
    const tId = placement.team?.id ?? placement.team_id ?? placement.team;
    const richTeam = teamsList.find((t) => t.id === tId);
    return {
      id: tId,
      name: richTeam?.name ?? placement.team?.name ?? "",
      team: "",
      isGroup: true,
    };
  }
  return null;
}

const genderChoices = [
  { value: "boys", label: "Boys" },
  { value: "girls", label: "Girls" },
  { value: "any", label: "Any" },
];

export default function ResultsPage() {
  const { data: events } = useApiResource("/events/");
  const { data: students } = useApiResource("/students/");
  const { data: teams } = useApiResource("/teams/");
  const { data: categories } = useApiResource("/categories/");

  const {
    data: placements,
    create: createPlacement,
    update: updatePlacement,
    remove: removePlacement,
  } = useApiResource("/results/placements/");

  const { data: bonusPoints, create: createBonusPoint } = useApiResource(
    "/results/team-bonus-points/",
  );

  const {
    data: leaderboard,
    loading: leaderboardLoading,
    refresh: refreshLeaderboard,
  } = useApiResource("/results/leaderboard/");

  const { byStudentId, currentEventId } = useEventRoster();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [eventId, setEventId] = useState("");
  const [placementError, setPlacementError] = useState("");
  const [posterOpen, setPosterOpen] = useState(false);
  const { toast, showToast, dismiss } = useToast();

  const canSelectEvent = Boolean(selectedCategory) && Boolean(selectedGender);

  const filteredEvents = useMemo(() => {
    if (!canSelectEvent) return [];
    return events.filter((ev) => {
      const eventCategoryId = ev.category?.id ?? ev.category_id;
      if (String(eventCategoryId) !== String(selectedCategory)) return false;
      if (selectedGender === "any") return true;
      return ev.gender === selectedGender || ev.gender === "both";
    });
  }, [events, canSelectEvent, selectedCategory, selectedGender]);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setEventId("");
  };

  const handleGenderChange = (value) => {
    setSelectedGender(value);
    setEventId("");
  };

  const [madrassaName, setMadrassaName] = useState("");
  useEffect(() => {
    apiClient
      .get("/auth/me/")
      .then((me) => setMadrassaName(me?.madrassa?.name ?? ""))
      .catch(() => {});
  }, []);

  const [pointsForm, setPointsForm] = useState({
    team_id: "",
    points: 5,
    note: "",
  });
  const [pointsError, setPointsError] = useState("");
  const effectiveEventId = eventId || filteredEvents[0]?.id || "";
  const effectiveTeamId = pointsForm.team_id || teams[0]?.id || "";

  const event = useMemo(
    () => events.find((ev) => ev.id === Number(effectiveEventId)),
    [events, effectiveEventId],
  );
  const isIndividual = event?.event_type === "individual";

  useEffect(() => {
    if (event && isIndividual) {
      loadEventRoster(event.id).catch(() => {});
    }
  }, [event, isIndividual]);

  const { data: groupEntries } = useApiResource("/group-entries/", {
    event: !isIndividual ? effectiveEventId || undefined : undefined,
  });

  const placementsForEvent = useMemo(
    () =>
      placements.filter(
        (p) => (p.event?.id ?? p.event_id) === Number(effectiveEventId),
      ),
    [placements, effectiveEventId],
  );
  const firsts = placementsForEvent.filter((p) => p.place === 1);
  const seconds = placementsForEvent.filter((p) => p.place === 2);
  const thirds = placementsForEvent.filter((p) => p.place === 3);

  const registeredStudents = useMemo(() => {
    if (!event || !isIndividual) return [];
    if (currentEventId !== event.id) return [];
    const ids = [...byStudentId.entries()]
      .filter(([, v]) => v.status === "registered")
      .map(([id]) => id);
    return students.filter((s) => ids.includes(s.id));
  }, [event, isIndividual, students, byStudentId, currentEventId]);

  const placementRows = useMemo(() => {
    if (isIndividual) {
      return registeredStudents.map((s) => ({
        id: s.id,
        kind: "student",
        label: s.name,
        sub: s.team?.name,
        regNo: s.reg_no,
      }));
    }
    if (groupEntries.length > 0) {
      return groupEntries.map((ge) => ({
        id: ge.id,
        kind: "group_entry",
        label: ge.display_name || ge.team?.name,
        sub: ge.team?.name,
      }));
    }
    return teams.map((t) => ({
      id: t.id,
      kind: "team",
      label: t.name,
      sub: null,
    }));
  }, [isIndividual, registeredStudents, groupEntries, teams]);

  const winners = useMemo(() => {
    const label = (p) => toWinnerLabel(p, students, groupEntries, teams);
    return {
      1: firsts.map(label).filter(Boolean),
      2: seconds.map(label).filter(Boolean),
      3: thirds.map(label).filter(Boolean),
    };
  }, [firsts, seconds, thirds, students, groupEntries, teams]);

  const hasAnyWinner =
    winners[1].length + winners[2].length + winners[3].length > 0;

  const handleSetPlacement = useCallback(
    async (place, rowId, kind) => {
      if (!event) return;
      setPlacementError("");

      const placesForRank =
        place === 1 ? firsts : place === 2 ? seconds : thirds;
      const existing = placesForRank.find((p) =>
        placementMatchesRow(p, rowId, kind),
      );

      const payload = {
        event_id: event.id,
        place,
        student_id: kind === "student" ? rowId : null,
        team_id: kind === "team" ? rowId : null,
        group_entry_id: kind === "group_entry" ? rowId : null,
      };

      try {
        if (existing) {
          await removePlacement(existing.id);
          showToast("Placement removed.", "success");
        } else {
          await createPlacement(payload);
          showToast("Placement saved successfully.", "success");
        }
        refreshLeaderboard();
      } catch (err) {
        const message =
          err.message || "Could not save this placement. Please try again.";
        setPlacementError(message);
        showToast(message, "error");
      }
    },
    [
      event,
      firsts,
      seconds,
      thirds,
      removePlacement,
      createPlacement,
      refreshLeaderboard,
      showToast,
    ],
  );

  const teamTotals = useMemo(() => {
    const totals = {};
    leaderboard.forEach((entry) => {
      const name = entry.team?.name ?? entry.team_name;
      if (name) totals[name] = entry.total_points ?? entry.points ?? 0;
    });
    return totals;
  }, [leaderboard]);

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    setPointsError("");

    const points = Number(pointsForm.points);
    if (pointsForm.points === "" || Number.isNaN(points)) {
      setPointsError("Please enter a valid number of points.");
      return;
    }
    if (points < 0 && !pointsForm.note.trim()) {
      setPointsError(
        "A note is required when awarding negative (deduction) points.",
      );
      return;
    }

    try {
      await createBonusPoint({
        team_id: effectiveTeamId,
        points,
        note: pointsForm.note,
      });
      setPointsForm((f) => ({ ...f, points: 5, note: "" }));
      refreshLeaderboard();
      showToast("Points awarded successfully.", "success");
    } catch (err) {
      const message =
        err.message || "Could not award these points. Please try again.";
      setPointsError(message);
      showToast(message, "error");
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <PageHeader
          title="Results"
          description="Pick an event, mark placings, then publish the poster."
        />

        <div className="grid gap-3 sm:grid-cols-3 sm:max-w-2xl">
          <Field label="Category">
            <Select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Gender">
            <Select
              value={selectedGender}
              onChange={(e) => handleGenderChange(e.target.value)}
            >
              <option value="">Select gender</option>
              {genderChoices.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Event">
            <Select
              value={effectiveEventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={!canSelectEvent}
            >
              <option value="">
                {canSelectEvent
                  ? "Select an event"
                  : "Choose category & gender first"}
              </option>
              {filteredEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} — {ev.event_type}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {placementError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {placementError}
          </div>
        )}

        {!event ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Select a category, gender, and event above to begin entering
            placements.
          </p>
        ) : placementRows.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {isIndividual
              ? "No students are registered for this event yet. Assign students on the Registration page first."
              : "No teams are available to place yet — add teams first."}
          </p>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <th className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#171717] dark:text-[#21F1A8]">
                    {isIndividual
                      ? "Student"
                      : groupEntries.length > 0
                        ? "Squad"
                        : "Team"}
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-800 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    1st (multiple allowed)
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-800 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#21F1A8]">
                    2nd (multiple allowed)
                  </th>
                  <th className="border-b border-slate-200 dark:border-slate-800 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                    3rd (multiple allowed)
                  </th>
                </tr>
              </thead>
              <tbody>
                {placementRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="border-b border-slate-200 dark:border-slate-800 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 dark:border-slate-800 bg-[#21F1A8]/10">
                          <span className="text-xs font-semibold text-[#21F1A8]">
                            {row.label.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                            {row.label}
                            {row.kind === "group_entry" && (
                              <span className="rounded-full bg-[#21F1A8]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0f9c74] dark:text-[#21F1A8]">
                                Group
                              </span>
                            )}
                            {row.regNo && (
                              <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                                #{row.regNo}
                              </span>
                            )}
                          </p>
                          {row.sub && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {row.sub}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-slate-200 dark:border-slate-800 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={firsts.some((p) =>
                          placementMatchesRow(p, row.id, row.kind),
                        )}
                        onChange={() => handleSetPlacement(1, row.id, row.kind)}
                        className="h-4 w-4 accent-amber-500"
                      />
                    </td>
                    <td className="border-b border-slate-200 dark:border-slate-800 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={seconds.some((p) =>
                          placementMatchesRow(p, row.id, row.kind),
                        )}
                        onChange={() => handleSetPlacement(2, row.id, row.kind)}
                        className="h-4 w-4 accent-[#21F1A8]"
                      />
                    </td>
                    <td className="border-b border-slate-200 dark:border-slate-800 px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={thirds.some((p) =>
                          placementMatchesRow(p, row.id, row.kind),
                        )}
                        onChange={() => handleSetPlacement(3, row.id, row.kind)}
                        className="h-4 w-4 accent-red-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={() => setPosterOpen(true)}
            disabled={!hasAnyWinner}
            className="rounded-lg bg-[#21F1A8] px-5 py-2.5 text-sm font-semibold shadow-sm text-[#171717] transition hover:bg-[#1de09a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate event poster
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
          Team points
        </h2>
        {/*
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Award (or deduct) points to a team at the committee's discretion — a
          note is required for deductions.
        </p>

        {pointsError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
            {pointsError}
          </div>
        )}

        <form
          onSubmit={handleAwardPoints}
          className="mt-4 grid gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] p-4 sm:grid-cols-4"
        >
          <Field label="Team">
            <Select
              value={effectiveTeamId}
              onChange={(e) =>
                setPointsForm((f) => ({ ...f, team_id: e.target.value }))
              }
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Points (negative to deduct)">
            <NumberInput
              value={pointsForm.points}
              onChange={(e) =>
                setPointsForm((f) => ({ ...f, points: e.target.value }))
              }
            />
          </Field>
          <Field
            label={
              pointsForm.points < 0 ? "Reason (required)" : "Reason (optional)"
            }
          >
            <TextInput
              required={Number(pointsForm.points) < 0}
              value={pointsForm.note}
              onChange={(e) =>
                setPointsForm((f) => ({ ...f, note: e.target.value }))
              }
              placeholder="e.g. Overall discipline award"
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-[#21F1A8] px-4 py-2 text-sm font-semibold shadow-sm text-[#171717] hover:bg-[#1de09a] transition-colors"
            >
              Save
            </button>
          </div>
        </form>
        */}

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {leaderboardLoading && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Loading standings…
            </p>
          )}
          {!leaderboardLoading &&
            teams.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {t.name}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-slate-900 dark:text-white">
                  {teamTotals[t.name] ?? 0} pts
                </p>
              </div>
            ))}
        </div>

        {bonusPoints.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626]">
            {[...bonusPoints].reverse().map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="font-medium text-slate-900 dark:text-white">
                  {p.team?.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {p.note || "No note"}
                </span>
                <span
                  className={`font-mono text-xs font-bold ${p.points < 0 ? "text-red-600 dark:text-red-400" : "text-[#21F1A8]"}`}
                >
                  {p.points > 0 ? "+" : ""}
                  {p.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {event && (
        <PosterModal
          open={posterOpen}
          onClose={() => setPosterOpen(false)}
          title={`Poster — ${event.name}`}
          filename={`${event.name.replace(/\s+/g, "-").toLowerCase()}-results`}
          showPhotoUpload={false}
        >
          {(ref, _posterImage, theme) => (
            <EventPoster
              ref={ref}
              theme={theme}
              madrassaName={madrassaName || "Madrassa Milad"}
              eventName={event.name}
              eventId={event.id}
              category={event.category?.name}
              gender={event.gender}
              winners={winners}
            />
          )}
        </PosterModal>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
