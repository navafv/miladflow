import { Link } from "react-router-dom";
import { useDashboardStats } from "../../lib/dashboardStore.js";
import { useAuth } from "../../lib/authStore.js";

const MINT = "#21F1A8";
const GOLD = "#F5C518";
const DEEP_GREEN = "#0B3B2E";

function buildQuickActions(slug) {
  return [
    {
      label: "Add student",
      to: "/admin/students",
      hint: "Register a participant",
      icon: "👤",
    },
    {
      label: "Bulk import",
      to: "/admin/students",
      hint: "Upload a student list",
      icon: "📥",
    },
    {
      label: "Add event",
      to: "/admin/events",
      hint: "Create a competition event",
      icon: "🏆",
    },
    {
      label: "Open live TV",
      to: slug ? `/${slug}/tv` : "/admin/schedule",
      hint: "Cast the stage screen",
      icon: "📺",
      external: Boolean(slug),
    },
    {
      label: "Print ID cards",
      to: "/admin/students",
      hint: "Generate & print cards",
      icon: "🪪",
    },
    {
      label: "Manage schedule",
      to: "/admin/schedule",
      hint: "Start, pause or end",
      icon: "🗓️",
    },
  ];
}

function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-[#262626]/80 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeading({ title, action }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      {action}
    </div>
  );
}

function NowRunningBanner({ liveNow, loading }) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100 p-6 dark:border-slate-800 dark:bg-[#262626]" />
    );
  }

  if (!liveNow || liveNow.length === 0) {
    return (
      <div
        className="rounded-2xl border p-5 dark:border-slate-800"
        style={{
          backgroundColor: `${DEEP_GREEN}0d`,
          borderColor: `${DEEP_GREEN}33`,
        }}
      >
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Nothing is on stage right now. Head to{" "}
          <Link
            to="/admin/schedule"
            className="font-semibold underline"
            style={{ color: MINT }}
          >
            Schedule
          </Link>{" "}
          to start the next item.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {liveNow.map((item) => (
        <div
          key={item.id}
          className="relative overflow-hidden rounded-2xl border p-5 shadow-lg sm:p-6"
          style={{
            background: `linear-gradient(135deg, ${DEEP_GREEN} 0%, #123028 100%)`,
            borderColor: MINT,
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl"
            style={{ backgroundColor: `${MINT}33` }}
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="relative mt-1.5 flex h-3 w-3">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ backgroundColor: MINT }}
                />
                <span
                  className="relative inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: MINT }}
                />
              </span>
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: MINT }}
                >
                  Now running
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-white">
                  {item.name}
                </p>
                <p className="mt-1 text-sm text-emerald-100/80">
                  {item.venue ? `${item.venue} · ` : ""}
                  {item.round_label ? `${item.round_label} · ` : ""}
                  Started {formatTime(item.scheduled_time)}
                </p>
              </div>
            </div>
            <Link
              to="/admin/schedule"
              className="inline-flex shrink-0 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-[#0B3B2E] shadow-sm transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: MINT }}
            >
              Pause / End →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub, loading }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-slate-900 dark:text-white">
        {loading ? "…" : value}
      </p>
      {sub && !loading && (
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          {sub}
        </p>
      )}
    </Card>
  );
}

function ProgressBar({ label, completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
        <span>{label}</span>
        <span className="font-mono">
          {completed}/{total} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: MINT }}
        />
      </div>
    </div>
  );
}

function AlertRow({ title, subtitle, tone = "gold" }) {
  const color = tone === "gold" ? GOLD : MINT;
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}14` }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </p>
        {subtitle && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data, loading, error } = useDashboardStats();
  const { me } = useAuth();
  const quickActions = buildQuickActions(me?.madrassa?.slug);

  const stats = data?.stats;
  const liveNow = data?.live_now ?? [];
  const missingResults = data?.missing_results ?? [];
  const upcoming = data?.upcoming_next_hour ?? [];
  const teamPoints = [...(data?.team_points ?? [])]
    .filter((t) => t.total_points > 0)
    .sort((a, b) => b.total_points - a.total_points);
  const maxPoints = Math.max(...teamPoints.map((t) => t.total_points), 1);
  const regByCategory = data?.registrations_by_category ?? [];
  const maxCategoryCount = Math.max(
    ...regByCategory.map((c) => c.registration_count),
    1,
  );
  const ruleWarnings = data?.rule_limit_warnings;
  const attentionCount = missingResults.length + (ruleWarnings?.count ?? 0);

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Now Running banner — always full width, top priority */}
      <NowRunningBanner liveNow={liveNow} loading={loading && !data} />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Total students"
          value={stats?.total_students ?? 0}
          sub={
            stats?.recent_students_7d
              ? `+${stats.recent_students_7d} this week`
              : null
          }
          loading={loading && !data}
        />
        <KpiCard
          label="Registrations"
          value={stats?.total_registrations ?? 0}
          sub={
            stats?.avg_registrations_per_student
              ? `avg ${stats.avg_registrations_per_student} / student`
              : null
          }
          loading={loading && !data}
        />
        <KpiCard
          label="Events scored"
          value={stats ? `${stats.scored_events}/${stats.total_events}` : "…"}
          sub={
            stats?.pending_events
              ? `${stats.pending_events} pending`
              : "All caught up"
          }
          loading={loading && !data}
        />
        <KpiCard
          label="Live now"
          value={stats?.live_now_count ?? 0}
          sub={stats?.live_now_count ? "On stage" : "Nothing running"}
          loading={loading && !data}
        />
      </div>

      {/* Progress + alerts (left, span 2) | Quick actions + upcoming (right) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionHeading title="Festival progress" />
            <div className="mt-4">
              <ProgressBar
                label="Events scored"
                completed={stats?.scored_events ?? 0}
                total={stats?.total_events ?? 0}
              />
            </div>
          </Card>

          <Card>
            <SectionHeading
              title="Needs attention"
              action={
                attentionCount > 0 && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold text-[#5c4400]"
                    style={{ backgroundColor: GOLD }}
                  >
                    {attentionCount}
                  </span>
                )
              }
            />

            <div className="mt-4 space-y-2.5">
              {attentionCount === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nothing needs attention right now — great work!
                </p>
              )}

              {missingResults.map((item) => (
                <AlertRow
                  key={`mr-${item.id}`}
                  title={`Missing results: ${item.name}`}
                  subtitle={
                    item.venue
                      ? `${item.venue} · completed but not scored`
                      : "Completed but not scored"
                  }
                  tone="gold"
                />
              ))}

              {ruleWarnings?.sample?.map((w) => (
                <AlertRow
                  key={`rw-${w.student_id}`}
                  title={`${w.student_name} is at the registration limit`}
                  subtitle={`${w.registration_count}/${w.max_total} events · ${w.category_name}`}
                  tone="gold"
                />
              ))}

              {ruleWarnings?.count > (ruleWarnings?.sample?.length ?? 0) && (
                <p className="pt-1 text-xs text-slate-500 dark:text-slate-400">
                  +{ruleWarnings.count - ruleWarnings.sample.length} more
                  students at their limit.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionHeading title="Quick actions" />
            <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-1">
              {quickActions.map((a) =>
                a.external ? (
                  <a
                    key={a.label}
                    href={a.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-sm transition-colors hover:border-[#21F1A8] hover:bg-[#21F1A8]/10 dark:border-slate-700 dark:hover:border-[#21F1A8]"
                  >
                    <span className="text-lg leading-none">{a.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {a.label}
                      </p>
                      <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 lg:block">
                        {a.hint}
                      </p>
                    </div>
                  </a>
                ) : (
                  <Link
                    key={a.label}
                    to={a.to}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-sm transition-colors hover:border-[#21F1A8] hover:bg-[#21F1A8]/10 dark:border-slate-700 dark:hover:border-[#21F1A8]"
                  >
                    <span className="text-lg leading-none">{a.icon}</span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {a.label}
                      </p>
                      <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 lg:block">
                        {a.hint}
                      </p>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Up next" />
            <div className="mt-4 space-y-2.5">
              {upcoming.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nothing scheduled soon.
                </p>
              )}
              {upcoming.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-slate-700"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {item.venue ?? "Venue TBD"}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {formatTime(item.scheduled_time)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Team points | Registrations by category */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeading
            title="Team points"
            action={
              <Link
                to="/admin/results"
                className="text-xs font-semibold hover:underline"
                style={{ color: MINT }}
              >
                Award points →
              </Link>
            }
          />

          {loading && !data && (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              Loading leaderboard…
            </p>
          )}

          {!loading && teamPoints.length === 0 && (
            <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
              No points have been awarded yet — head to Results to record
              placings.
            </p>
          )}

          {teamPoints.length > 0 && (
            <div className="mt-6 space-y-4">
              {teamPoints.map((t) => {
                const basePct = (t.base_points / maxPoints) * 100;
                const bonusPct =
                  (Math.max(t.bonus_points, 0) / maxPoints) * 100;
                return (
                  <div key={t.team_id}>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{t.team_name}</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {t.total_points} pts
                        {t.bonus_points !== 0 && (
                          <span
                            className="ml-1.5"
                            style={{
                              color: t.bonus_points > 0 ? MINT : "#e11d48",
                            }}
                          >
                            ({t.bonus_points > 0 ? "+" : ""}
                            {t.bonus_points} bonus)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mt-1.5 flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full"
                        style={{ width: `${basePct}%`, backgroundColor: MINT }}
                      />
                      {t.bonus_points > 0 && (
                        <div
                          className="h-full"
                          style={{
                            width: `${bonusPct}%`,
                            backgroundColor: GOLD,
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-5 text-[11px] text-slate-400 dark:text-slate-500">
            Mint = base points from placements · Gold = bonus point adjustments.
          </p>
        </Card>

        <Card>
          <SectionHeading title="Registrations by category" />
          <div className="mt-4 space-y-3">
            {regByCategory.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No categories yet.
              </p>
            )}
            {regByCategory.map((c) => (
              <div key={c.category_id}>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span className="truncate">{c.category_name}</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {c.registration_count}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(c.registration_count / maxCategoryCount) * 100}%`,
                      backgroundColor: DEEP_GREEN,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
