import { Link } from "react-router-dom";
import { useApiResource } from "../../lib/useApiResource.js";
import { useLeaderboard } from "../../lib/resultsStore.js";

const quickActions = [
  {
    label: "Add student",
    to: "/admin/students",
    hint: "Register a new participant",
  },
  {
    label: "Add event",
    to: "/admin/events",
    hint: "Create a competition event",
  },
  {
    label: "Open schedule",
    to: "/admin/schedule",
    hint: "Start, pause or end an item",
  },
  {
    label: "Publish results",
    to: "/admin/results",
    hint: "Mark placings for an event",
  },
];

export default function AdminDashboard() {
  const { data: students, loading: studentsLoading } =
    useApiResource("/students/");
  const { data: events, loading: eventsLoading } = useApiResource("/events/");
  const { data: teams, loading: teamsLoading } = useApiResource("/teams/");
  const {
    data: leaderboard,
    loading: leaderboardLoading,
    error: leaderboardError,
  } = useLeaderboard();

  const teamPoints = [...leaderboard]
    .filter((row) => row.total_points > 0)
    .sort((a, b) => b.total_points - a.total_points);

  const maxPoints = Math.max(...teamPoints.map((t) => t.total_points), 1);

  const stats = [
    { label: "Total students", value: studentsLoading ? "…" : students.length },
    { label: "Active events", value: eventsLoading ? "…" : events.length },
    { label: "Teams", value: teamsLoading ? "…" : teams.length },
    {
      label: "Teams on the board",
      value: leaderboardLoading
        ? "…"
        : `${teamPoints.length} / ${leaderboard.length}`,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#262626]"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {s.label}
            </p>
            <p className="mt-2 font-display text-3xl font-semibold text-slate-900 dark:text-white">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#262626]">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
              Team points
            </h3>
            <Link
              to="/admin/results"
              className="text-xs font-semibold text-[#21F1A8] hover:underline"
            >
              Award points →
            </Link>
          </div>

          {leaderboardLoading && (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              Loading leaderboard…
            </p>
          )}

          {!leaderboardLoading && leaderboardError && (
            <p className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
              {leaderboardError}
            </p>
          )}

          {!leaderboardLoading &&
            !leaderboardError &&
            teamPoints.length === 0 && (
              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                No points have been awarded yet — head to Results to record
                placings.
              </p>
            )}

          {!leaderboardLoading &&
            !leaderboardError &&
            teamPoints.length > 0 && (
              <div className="mt-6 space-y-4">
                {teamPoints.map((t) => (
                  <div key={t.team_id}>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{t.team_name}</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {t.total_points} pts
                      </span>
                    </div>
                    <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-[#21F1A8]"
                        style={{
                          width: `${(t.total_points / maxPoints) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

          <p className="mt-5 text-[11px] text-slate-400 dark:text-slate-500">
            Live totals — awarded from the Results page.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#262626]">
          <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            Quick actions
          </h3>
          <div className="mt-4 space-y-2.5">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors hover:border-[#21F1A8] hover:bg-[#21F1A8]/10 dark:border-slate-700 dark:hover:border-[#21F1A8]"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {a.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {a.hint}
                  </p>
                </div>
                <span className="text-[#21F1A8]">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
