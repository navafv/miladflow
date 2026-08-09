import { Link, useParams } from "react-router-dom";
import SeoHead from "../components/SeoHead.jsx";
import MadrassaNavbar from "../components/MadrassaNavbar.jsx";
import MadrassaFooter from "../components/MadrassaFooter.jsx";
import PublicUnavailable from "../components/PublicUnavailable.jsx";
import OngoingEventBanner from "../components/OngoingEventBanner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { usePublicResource } from "../lib/usePublicResource.js";
import { formatTime } from "../lib/formatTime.js";

function normalizeScheduleItem(row) {
  return {
    id: row.id,
    time: formatTime(row.scheduled_time),
    name: row.title,
    venue: row.venue_name,
    status: row.status ?? "upcoming",
    roundLabel: row.round_label ?? "",
    isCustom: row.is_custom === true,
  };
}

function normalizeLeaderboardRow(row) {
  return {
    id: row.team_id,
    name: row.team_name,
    totalPoints: row.total_points,
  };
}

function normalizeResult(row) {
  return {
    id: row.id,
    event: row.event ?? row.event_name,
    category: row.category ?? row.category_name,
    winner: row.winner ?? row.student_name,
    team: row.team ?? row.team_name,
    place: row.place,
  };
}

const placeBadgeStyle = {
  1: "bg-[#21F1A8]/15 text-[#0f9c74] dark:text-[#21F1A8]",
  2: "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300",
  3: "bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-400",
};
const placeLabel = { 1: "1st", 2: "2nd", 3: "3rd" };

function SkeletonRow() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-none">
      <div className="h-3.5 w-1/3 rounded-full bg-neutral-200 dark:bg-white/10" />
      <div className="mt-2.5 h-2.5 w-1/4 rounded-full bg-neutral-200 dark:bg-white/10" />
    </div>
  );
}

export default function MadrassaDashboard() {
  const { slug } = useParams();

  const {
    data: festival,
    loading: festivalLoading,
    notFound,
  } = usePublicResource(slug ? `/public/${slug}/` : null);
  const { data: resultsResponse, loading: resultsLoading } = usePublicResource(
    slug ? `/public/${slug}/results/?page_size=5` : null,
  );
  const { data: scheduleResponse, loading: scheduleLoading } =
    usePublicResource(slug ? `/public/${slug}/schedule/` : null);
  const { data: leaderboardResponse, loading: leaderboardLoading } =
    usePublicResource(slug ? `/public/${slug}/leaderboard/` : null);

  if (notFound) return <PublicUnavailable />;

  const madrassaName = festival?.name ?? "—";
  const location = festival?.location ?? "";
  const festivalYear = festival?.festival_year ?? festival?.festivalYear ?? "";

  const results = Array.isArray(resultsResponse)
    ? resultsResponse
    : (resultsResponse?.results ?? []);
  const recentResults = results.map(normalizeResult);

  const scheduleItems = Array.isArray(scheduleResponse)
    ? scheduleResponse
    : (scheduleResponse?.results ?? []);
  const items = scheduleItems.map(normalizeScheduleItem);
  const current =
    items.find((it) => it.status === "ongoing") ??
    items.find((it) => it.status === "paused") ??
    null;
  const next = items.find((it) => it.status === "upcoming") ?? null;

  const leaderboardRows = (
    Array.isArray(leaderboardResponse) ? leaderboardResponse : []
  ).map(normalizeLeaderboardRow);

  const loading = festivalLoading || resultsLoading || scheduleLoading;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-[#171717] sm:pb-0">
      {!festivalLoading && (
        <SeoHead
          rawTitle={
            festival ? `${madrassaName} | Live Schedule & Results` : undefined
          }
          description={
            festival
              ? `Live schedule, on-stage updates and the latest results for ${madrassaName}'s Milad-un-Nabi festival${festivalYear ? ` ${festivalYear}` : ""}. Shared by the organizing committee.`
              : undefined
          }
          path={`/${slug}`}
        />
      )}
      <MadrassaNavbar />

      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-white to-slate-100 dark:border-white/10 dark:bg-[#171717] dark:bg-none">
        <div
          className="pointer-events-none absolute -left-24 -top-32 h-96 w-96 rounded-full bg-[#21F1A8]/15 blur-[110px] dark:bg-[#21F1A8]/15"
          aria-hidden="true"
        />
        <div className="rosette-field pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 sm:py-16">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.3em] text-[#0f9c74] dark:text-[#21F1A8]">
            {location}
            {location && festivalYear ? " · " : ""}
            {festivalYear}
          </p>
          <h1 className="animate-fade-up animate-fade-up-1 mt-3 font-display text-4xl font-semibold text-[#171717] dark:text-white sm:text-5xl">
            {madrassaName}
          </h1>
          <p className="animate-fade-up animate-fade-up-2 mt-3 max-w-xl text-sm text-neutral-600 dark:text-neutral-400">
            Follow the festival as it happens — live schedule, on-stage updates,
            and results as soon as they're announced.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <div className="animate-fade-up">
          {!loading && <OngoingEventBanner current={current} next={next} />}
          {loading && (
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:text-neutral-400 dark:shadow-none">
              Loading festival status…
            </div>
          )}
        </div>

        <section className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#171717] dark:text-white">
                Last 5 results
              </h2>
              <Link
                to={`/${slug}/results`}
                className="rounded-md text-sm font-semibold text-[#171717] transition-all duration-300 ease-in-out hover:translate-x-0.5 hover:text-[#0f9c74] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:text-[#21F1A8] dark:hover:text-[#21F1A8]/80 dark:focus-visible:ring-offset-[#171717]"
              >
                View all results →
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : recentResults.length === 0 ? (
                <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-8 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:text-neutral-400 dark:shadow-none">
                  No results published yet.
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-[#262626] dark:shadow-none">
                  {recentResults.map((r, i) => (
                    <li
                      key={r.id}
                      className="animate-stagger group flex items-center justify-between gap-4 border-l-2 border-transparent px-5 py-4 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-l-[#21F1A8] hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
                      style={{ "--stagger-index": i }}
                    >
                      <div>
                        <p className="font-semibold text-[#171717] dark:text-white">
                          {r.event}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {r.category} · {r.team}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="hidden text-sm text-neutral-500 dark:text-neutral-400 sm:inline">
                          {r.winner}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold font-mono ${
                            placeBadgeStyle[r.place] ??
                            "bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-400"
                          }`}
                        >
                          {placeLabel[r.place] ?? `${r.place}th`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-[#171717] dark:text-white">
                Today
              </h2>
              <Link
                to={`/${slug}/schedule`}
                className="rounded-md text-sm font-semibold text-[#171717] transition-all duration-300 ease-in-out hover:translate-x-0.5 hover:text-[#0f9c74] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:text-[#21F1A8] dark:hover:text-[#21F1A8]/80 dark:focus-visible:ring-offset-[#171717]"
              >
                Full schedule →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : (
                items.slice(0, 4).map((s, i) => (
                  <li
                    key={s.id}
                    className={`animate-stagger group relative flex items-center gap-4 rounded-xl border px-4 py-3 transition-all duration-300 ease-in-out hover:-translate-y-1 ${
                      s.status === "ongoing"
                        ? "border-[#21F1A8]/60 bg-[#21F1A8]/5 shadow-sm dark:bg-[#21F1A8]/10 dark:shadow-none"
                        : "border-neutral-200 bg-white shadow-sm hover:border-[#21F1A8]/50 dark:border-white/10 dark:bg-[#262626] dark:shadow-none"
                    }`}
                    style={{ "--stagger-index": i }}
                  >
                    {s.status === "ongoing" && (
                      <span className="shimmer-sweep rounded-xl" />
                    )}
                    <span className="relative z-10 w-16 shrink-0 font-mono text-xs font-semibold text-[#171717] dark:text-[#21F1A8]">
                      {s.time}
                    </span>
                    <div className="relative z-10 flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          s.isCustom
                            ? "text-neutral-500 dark:text-neutral-400"
                            : "text-[#171717] dark:text-white"
                        }`}
                      >
                        {s.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {s.venue}
                        {s.roundLabel ? ` · ${s.roundLabel}` : ""}
                      </p>
                    </div>
                    <span className="relative z-10">
                      <StatusBadge status={s.status} isCustom={s.isCustom} />
                    </span>
                  </li>
                ))
              )}
              {!loading && items.length === 0 && (
                <p className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:text-neutral-400 dark:shadow-none">
                  Nothing scheduled yet.
                </p>
              )}
            </ul>
          </div>
        </section>

        <section className="animate-fade-up">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-[#171717] dark:text-white">
              Leaderboard
            </h2>
            <Link
              to={`/${slug}/results`}
              className="rounded-md text-sm font-semibold text-[#171717] transition-all duration-300 ease-in-out hover:translate-x-0.5 hover:text-[#0f9c74] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:text-[#21F1A8] dark:hover:text-[#21F1A8]/80 dark:focus-visible:ring-offset-[#171717]"
            >
              Full results →
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-none">
            {leaderboardLoading ? (
              <div className="space-y-3 p-5">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : leaderboardRows.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                No team standings published yet.
              </p>
            ) : (
              <ul className="divide-y divide-neutral-100 dark:divide-white/10">
                {leaderboardRows.map((row, i) => {
                  const rank = i + 1;
                  const isLeader = rank === 1;
                  return (
                    <li
                      key={row.id}
                      className={`animate-stagger group flex items-center justify-between gap-4 border-l-2 px-5 py-4 transition-all duration-300 ease-in-out hover:-translate-y-0.5 ${
                        isLeader
                          ? "border-l-[#21F1A8] bg-[#21F1A8]/5 dark:bg-[#21F1A8]/10"
                          : "border-l-transparent hover:border-l-[#21F1A8] hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
                      }`}
                      style={{ "--stagger-index": i }}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
                            isLeader
                              ? "bg-[#21F1A8] text-[#171717] shadow-sm shadow-[#21F1A8]/40"
                              : "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
                          }`}
                        >
                          {rank}
                        </span>
                        <p className="font-semibold text-[#171717] dark:text-white">
                          {row.name}
                        </p>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#0f9c74] dark:text-[#21F1A8]">
                        {row.totalPoints} pts
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
      <MadrassaFooter madrassaName={madrassaName} />
    </div>
  );
}
