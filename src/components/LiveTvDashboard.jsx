import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { usePublicPoll } from "../lib/usePublicResource.js";
import PublicUnavailable from "./PublicUnavailable.jsx";

const POLL_INTERVAL_MS = 15_000;
const ROTATE_INTERVAL_MS = 7_000;

const PLACE_COLORS = {
  1: "#21F1A8",
  2: "#38bdf8",
  3: "#fbbf24",
};

function useRotatingPages(items, pageSize, intervalMs = ROTATE_INTERVAL_MS) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [items.length, pageSize]);

  useEffect(() => {
    if (pageCount <= 1) return undefined;
    const id = setInterval(() => {
      setPageIndex((i) => (i + 1) % pageCount);
    }, intervalMs);
    return () => clearInterval(id);
  }, [pageCount, intervalMs]);

  const safeIndex = pageIndex % pageCount;
  const page = items.slice(
    safeIndex * pageSize,
    safeIndex * pageSize + pageSize,
  );

  return { page, pageIndex: safeIndex, pageCount };
}
function normalizeTeam(row) {
  return {
    id: row.team_id,
    name: row.team_name,
    points: Number(row.total_points ?? 0),
  };
}

function genderLabel(value) {
  if (!value) return "";
  if (value === "mixed") return "Mixed";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatCategoryTag(categoryName, gender) {
  if (!categoryName) return "";
  if (gender && gender !== "mixed") {
    return `[${categoryName} - ${genderLabel(gender)}]`;
  }
  return `[${categoryName}]`;
}

function normalizeScheduleItem(item) {
  return {
    id: item.id,
    eventName: item.title ?? item.event_name ?? "Event",
    categoryTag: formatCategoryTag(item.category_name, item.gender),
    venue: item.venue_name ?? "—",
    time: item.scheduled_time ?? null,
    status: item.status ?? "upcoming",
  };
}

const STATUS_SORT_RANK = { ongoing: 0, paused: 1, upcoming: 2 };

function sortHappeningNow(events) {
  return [...events].sort((a, b) => {
    const rankDiff =
      (STATUS_SORT_RANK[a.status] ?? 3) - (STATUS_SORT_RANK[b.status] ?? 3);
    if (rankDiff !== 0) return rankDiff;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}

function normalizePlacement(p) {
  return {
    id: p.id,
    eventId: p.event_id,
    eventName: p.event_name ?? "Event",
    categoryTag: formatCategoryTag(p.category_name, p.gender),
    place: p.place,
    isGroup: p.is_group ?? false,
    groupName: p.group_name ?? null,
    name: p.winner_name ?? "—",
    team: p.team_name ?? "",
  };
}

function formatTime(isoValue) {
  if (!isoValue) return "—";
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupPlacementsByEvent(placements) {
  const groups = new Map();

  for (const p of placements) {
    const key = p.eventId ?? p.eventName;
    if (!groups.has(key)) {
      groups.set(key, {
        eventId: key,
        eventName: p.eventName,
        categoryTag: p.categoryTag,
        entries: {},
      });
    }
    groups.get(key).entries[p.place] = p;
  }

  return [...groups.values()].reverse();
}

function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}

function DigitalClock() {
  const now = useClock();

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col items-end">
      <span className="font-mono text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white lg:text-3xl 2xl:text-4xl">
        {time}
      </span>
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 lg:text-base 2xl:text-lg">
        {date}
      </span>
    </div>
  );
}

function useIdleCursor(timeoutMs = 2500) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;

    const show = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), timeoutMs);
    };

    window.addEventListener("mousemove", show);
    return () => {
      window.removeEventListener("mousemove", show);
      clearTimeout(timer);
    };
  }, [timeoutMs]);

  return visible;
}

function FullscreenToggle() {
  const visible = useIdleCursor();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 backdrop-blur transition-opacity duration-500 dark:border-white/10 dark:bg-black/60 dark:text-white ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {isFullscreen ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M9 3v4a2 2 0 0 1-2 2H3m18 0h-4a2 2 0 0 1-2-2V3m0 18v-4a2 2 0 0 1 2-2h4M3 15h4a2 2 0 0 1 2 2v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}

function PageDots({ count, activeIndex, color }) {
  if (count <= 1) return null;
  return (
    <div className="mt-3 flex shrink-0 items-center justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: i === activeIndex ? "1.25rem" : "0.375rem",
            backgroundColor:
              i === activeIndex ? color : "rgba(148,163,184,0.35)",
          }}
        />
      ))}
    </div>
  );
}

function DashboardHeader({ madrassaName }) {
  return (
    <header className="flex shrink-0 items-center justify-between px-6 py-3 lg:px-10 lg:py-4 2xl:px-14">
      <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-2xl 2xl:text-3xl">
        {madrassaName}
      </h1>

      <div className="flex items-center gap-2.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-500 dark:text-red-400">
          Live
        </span>
      </div>

      <DigitalClock />
    </header>
  );
}

function TeamClashCard({ team, maxPoints, rank }) {
  const fillPct =
    maxPoints > 0
      ? Math.max(4, Math.round((team.points / maxPoints) * 100))
      : 4;
  const isLeading = rank === 0;
  const color = PLACE_COLORS[rank + 1] ?? "#94a3b8";

  return (
    <div
      className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border bg-white px-5 py-4 dark:bg-[#141414] lg:px-7 lg:py-5 2xl:px-9 2xl:py-6"
      style={{
        borderColor: isLeading ? `${color}55` : undefined,
        boxShadow: isLeading ? `0 0 40px -12px ${color}66` : undefined,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl border ${
          isLeading ? "" : "border-slate-200 dark:border-white/10"
        }`}
      />

      {isLeading && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-25 blur-[70px]"
          style={{ background: color }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-widest lg:text-sm"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          {isLeading ? "Leading" : `#${rank + 1}`}
        </span>
        <span
          className="h-3 w-3 rounded-full lg:h-3.5 lg:w-3.5"
          style={{ backgroundColor: color, boxShadow: `0 0 10px 2px ${color}` }}
        />
      </div>

      <h2 className="relative z-10 mt-1 truncate text-2xl font-extrabold text-slate-900 dark:text-white lg:text-3xl 2xl:text-4xl">
        {team.name}
      </h2>

      <div className="relative z-10 mt-1 flex items-baseline gap-2">
        <span
          className="text-5xl font-black leading-none tracking-tighter lg:text-6xl 2xl:text-7xl"
          style={{ color }}
        >
          {team.points}
        </span>
        <span className="text-base font-semibold text-slate-500 dark:text-slate-400 lg:text-lg 2xl:text-xl">
          pts
        </span>
      </div>

      <div className="relative z-10 mt-3 h-3.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 lg:h-4">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 16px 0 ${color}88`,
          }}
        />
      </div>
    </div>
  );
}

function EpicLeaderboard({ teams }) {
  const ranked = useMemo(
    () => [...teams].sort((a, b) => b.points - a.points),
    [teams],
  );
  const maxPoints = ranked[0]?.points ?? 0;

  return (
    <section className="flex shrink-0 gap-4 px-6 pb-4 lg:gap-6 lg:px-10 lg:pb-5 2xl:gap-8 2xl:px-14">
      {ranked.map((team, i) => (
        <TeamClashCard
          key={team.id}
          team={team}
          maxPoints={maxPoints}
          rank={i}
        />
      ))}
    </section>
  );
}

const HAPPENING_PAGE_SIZE = 3;
const RESULTS_PAGE_SIZE = 2;

function StatusBadge({ status }) {
  if (status === "ongoing") {
    return (
      <span className="tv-pulse ml-3 flex shrink-0 items-center gap-1.5 rounded-full bg-[#21F1A8] px-3 py-1 text-xs font-black uppercase tracking-wide text-black lg:text-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-black/70" />
        Live Now
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span className="ml-3 shrink-0 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-500 dark:text-amber-400 lg:text-sm">
        Paused
      </span>
    );
  }
  return null;
}

function HappeningNow({ events }) {
  const ordered = useMemo(() => sortHappeningNow(events), [events]);
  const { page, pageIndex, pageCount } = useRotatingPages(
    ordered,
    HAPPENING_PAGE_SIZE,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#141414] lg:p-7 2xl:p-9">
      <div className="mb-3 flex shrink-0 items-center gap-2.5 lg:mb-4">
        <span
          className="h-2.5 w-2.5 rounded-full bg-[#21F1A8]"
          style={{ boxShadow: "0 0 10px 2px #21F1A8" }}
        />
        <h3 className="text-lg font-bold uppercase tracking-wide text-slate-900 dark:text-white lg:text-xl 2xl:text-2xl">
          Happening Now
        </h3>
      </div>

      <div
        key={pageIndex}
        className="tv-fade grid min-h-0 flex-1 grid-rows-3 gap-3 lg:gap-4"
      >
        {page.length === 0 && (
          <div className="row-span-3 flex items-center justify-center text-base text-slate-400 dark:text-slate-500">
            Nothing scheduled right now.
          </div>
        )}
        {page.map((e) => {
          const isOngoing = e.status === "ongoing";
          const isPaused = e.status === "paused";
          return (
            <div
              key={e.id}
              className={`flex items-center justify-between rounded-xl border px-4 dark:bg-white/[0.03] lg:px-5 ${
                isOngoing
                  ? "border-[#21F1A8]/40 bg-[#21F1A8]/[0.06] dark:border-[#21F1A8]/30"
                  : isPaused
                    ? "border-amber-400/30 bg-amber-400/[0.06] dark:border-amber-400/20"
                    : "border-slate-100 bg-slate-50 dark:border-white/5"
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`text-lg font-bold leading-snug lg:text-xl 2xl:text-2xl ${
                    isPaused
                      ? "text-slate-500 dark:text-slate-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {e.eventName}
                  {e.categoryTag && (
                    <span className="ml-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 lg:text-base">
                      {e.categoryTag}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400 lg:text-base 2xl:text-lg">
                  {e.venue}
                </p>
              </div>
              <div className="ml-3 flex shrink-0 items-center">
                <span className="shrink-0 rounded-full bg-[#21F1A8]/10 px-3 py-1 text-sm font-bold text-[#0d9e73] dark:text-[#21F1A8] lg:text-base">
                  {formatTime(e.time)}
                </span>
                <StatusBadge status={e.status} />
              </div>
            </div>
          );
        })}
        {page.length > 0 &&
          Array.from({ length: HAPPENING_PAGE_SIZE - page.length }).map(
            (_, i) => <div key={`pad-${i}`} />,
          )}
      </div>

      <PageDots count={pageCount} activeIndex={pageIndex} color="#21F1A8" />
    </div>
  );
}

function medalLabel(place) {
  if (place === 1) return "1st";
  if (place === 2) return "2nd";
  return "3rd";
}

function ResultRow({ place, entry }) {
  const color = PLACE_COLORS[place] ?? "#94a3b8";

  if (!entry) {
    return (
      <div className="flex items-center gap-3 opacity-40">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black lg:h-9 lg:w-9"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          {medalLabel(place)}
        </span>
        <p className="text-sm text-slate-400 dark:text-slate-500">—</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black lg:h-9 lg:w-9"
        style={{
          color,
          backgroundColor: `${color}1a`,
          boxShadow: `0 0 8px 0 ${color}55`,
        }}
      >
        {medalLabel(place)}
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-base font-bold text-slate-900 dark:text-white lg:text-lg 2xl:text-xl">
          <span className="truncate">{entry.name}</span>
          {entry.isGroup && entry.groupName && (
            <span className="shrink-0 rounded-full bg-slate-900/5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
              Group
            </span>
          )}
        </p>
        {entry.team && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400 lg:text-sm">
            {entry.team}
          </p>
        )}
      </div>
    </div>
  );
}

function LatestResults({ groupedResults }) {
  const { page, pageIndex, pageCount } = useRotatingPages(
    groupedResults,
    RESULTS_PAGE_SIZE,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#141414] lg:p-7 2xl:p-9">
      <div className="mb-3 flex shrink-0 items-center gap-2.5 lg:mb-4">
        <span
          className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]"
          style={{ boxShadow: "0 0 10px 2px #fbbf24" }}
        />
        <h3 className="text-lg font-bold uppercase tracking-wide text-slate-900 dark:text-white lg:text-xl 2xl:text-2xl">
          Latest Results
        </h3>
      </div>

      <div
        key={pageIndex}
        className="tv-fade grid min-h-0 flex-1 grid-rows-2 gap-4"
      >
        {page.length === 0 && (
          <div className="row-span-2 flex items-center justify-center text-base text-slate-400 dark:text-slate-500">
            No results announced yet.
          </div>
        )}
        {page.map((g) => (
          <div
            key={g.eventId}
            className="flex flex-col justify-center rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-white/[0.03] lg:px-5 lg:py-4"
          >
            <p className="mb-3 truncate text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:text-base">
              {g.eventName}
              {g.categoryTag && (
                <span className="ml-1.5 font-medium normal-case text-slate-400 dark:text-slate-500">
                  {g.categoryTag}
                </span>
              )}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <ResultRow place={1} entry={g.entries[1]} />
              <ResultRow place={2} entry={g.entries[2]} />
              <ResultRow place={3} entry={g.entries[3]} />
            </div>
          </div>
        ))}
        {page.length > 0 &&
          Array.from({ length: RESULTS_PAGE_SIZE - page.length }).map(
            (_, i) => <div key={`pad-${i}`} />,
          )}
      </div>

      <PageDots count={pageCount} activeIndex={pageIndex} color="#fbbf24" />
    </div>
  );
}

export default function LiveTvDashboard() {
  const { slug } = useParams();

  const { data: festival, notFound } = usePublicPoll(
    slug ? `/public/${slug}/` : null,
  );
  const leaderboard = usePublicPoll(
    slug ? `/public/${slug}/leaderboard/` : null,
  );
  const schedule = usePublicPoll(slug ? `/public/${slug}/schedule/` : null);
  const results = usePublicPoll(
    slug ? `/public/${slug}/results/?page_size=100` : null,
  );

  const teams = useMemo(() => {
    const rows = Array.isArray(leaderboard.data) ? leaderboard.data : [];
    return rows.map(normalizeTeam);
  }, [leaderboard.data]);

  const events = useMemo(() => {
    const items = Array.isArray(schedule.data) ? schedule.data : [];
    return items
      .map(normalizeScheduleItem)
      .filter(
        (e) =>
          e.status === "ongoing" ||
          e.status === "upcoming" ||
          e.status === "paused",
      );
  }, [schedule.data]);

  const groupedResults = useMemo(() => {
    const rows = Array.isArray(results.data)
      ? results.data
      : (results.data?.results ?? []);
    const normalized = rows.map(normalizePlacement);
    return groupPlacementsByEvent(normalized);
  }, [results.data]);

  if (notFound) {
    return <PublicUnavailable />;
  }

  return (
    <div className="fixed inset-0 flex h-[100vh] w-[100vw] flex-col overflow-hidden bg-slate-50 font-['Manrope',sans-serif] dark:bg-[#0a0a0a] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <style>{`
        @keyframes tv-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .tv-fade { animation: tv-fade-in 0.5s ease; }
        @keyframes tv-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .tv-pulse { animation: tv-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 hidden h-[40rem] w-[70rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[140px] dark:block"
        style={{
          background: "radial-gradient(circle, #21F1A8 0%, transparent 70%)",
        }}
      />

      <DashboardHeader madrassaName={festival?.name ?? "—"} />

      <div className="flex shrink-0 flex-col" style={{ flexBasis: "32%" }}>
        <EpicLeaderboard teams={teams} />
      </div>

      <section className="flex min-h-0 flex-1 gap-4 px-6 pb-6 lg:gap-6 lg:px-10 lg:pb-8 2xl:gap-8 2xl:px-14 2xl:pb-10">
        <HappeningNow events={events} />
        <LatestResults groupedResults={groupedResults} />
      </section>

      <FullscreenToggle />
    </div>
  );
}
