import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { usePublicPoll } from "../lib/usePublicResource.js";
import PublicUnavailable from "./PublicUnavailable.jsx";

const MASTER_ROTATE_MS = 12_000;
const INNER_ROTATE_MS = 8_000;

const HAPPENING_PAGE_SIZE = 6;
const RESULTS_PAGE_SIZE = 4;

const PLACE_COLORS = {
  1: "#21F1A8",
  2: "#38bdf8",
  3: "#fbbf24",
};


function isToday(isoValue) {
  if (!isoValue) return false;
  const d = new Date(isoValue);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function normalizeTeam(row) {
  return {
    id: row.team_id,
    name: row.team_name,
    points: Number(row.total_points ?? 0),
    boysPoints: Number(row.boys_points ?? 0),
    girlsPoints: Number(row.girls_points ?? 0),
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

const STATUS_SORT_RANK = {
  ongoing: 0,
  paused: 1,
  upcoming: 2,
  completed: 3,
  published: 3,
};

function sortHappeningNow(events) {
  return [...events].sort((a, b) => {
    const rankDiff =
      (STATUS_SORT_RANK[a.status] ?? 4) - (STATUS_SORT_RANK[b.status] ?? 4);
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
    <div className="mt-4 flex shrink-0 items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: i === activeIndex ? "2rem" : "0.5rem",
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
    <header className="flex shrink-0 items-center justify-between px-6 py-4 lg:px-10 lg:py-6 2xl:px-14">
      <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 dark:text-white lg:text-3xl 2xl:text-4xl">
        {madrassaName}
      </h1>

      <div className="flex items-center gap-3 rounded-full border border-red-500/20 bg-red-500/10 px-5 py-2">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-red-500 dark:text-red-400">
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
      className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border bg-white px-6 py-8 shadow-xl dark:bg-[#141414] lg:px-10 lg:py-10 2xl:px-12 2xl:py-12"
      style={{
        borderColor: isLeading ? `${color}55` : undefined,
        boxShadow: isLeading ? `0 0 60px -12px ${color}66` : undefined,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 rounded-3xl border ${
          isLeading ? "" : "border-slate-200 dark:border-white/10"
        }`}
      />

      {isLeading && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-25 blur-[90px]"
          style={{ background: color }}
        />
      )}

      <div className="relative z-10 flex items-center justify-between">
        <span
          className="rounded-full px-4 py-1 text-sm font-bold uppercase tracking-widest lg:text-base 2xl:text-lg"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          {isLeading ? "Leading" : `#${rank + 1}`}
        </span>
        <span
          className="h-4 w-4 rounded-full lg:h-5 lg:w-5"
          style={{ backgroundColor: color, boxShadow: `0 0 15px 3px ${color}` }}
        />
      </div>

      <div className="mb-auto mt-auto flex flex-col gap-2">
        <h2 className="relative z-10 line-clamp-2 text-balance text-center text-3xl font-extrabold text-slate-900 dark:text-white lg:text-4xl 2xl:text-5xl">
          {team.name}
        </h2>
        <div className="relative z-10 mt-2 flex items-baseline justify-center gap-3">
          <span
            className="text-7xl font-black leading-none tracking-tighter lg:text-8xl 2xl:text-[140px]"
            style={{ color }}
          >
            {team.points}
          </span>
          <span className="text-xl font-semibold text-slate-500 dark:text-slate-400 lg:text-2xl 2xl:text-4xl">
            pts
          </span>
        </div>

        <div className="relative z-10 mt-3 flex items-center justify-center gap-4 text-sm font-bold text-slate-500 dark:text-slate-400 lg:text-base 2xl:text-xl">
          <span className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#38bdf8]" />
            Boys: {team.boysPoints}
          </span>
          <span className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
            Girls: {team.girlsPoints}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-auto h-4 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 lg:h-6 2xl:h-8">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${fillPct}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 20px 0 ${color}88`,
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

  const getWidthClass = (total) => {
    if (total <= 3) return "w-[calc(100%/3-1rem)] flex-1 min-w-[30%]";
    if (total === 4) return "w-[calc(50%-1rem)]";
    return "w-[calc(100%/3-1.5rem)] min-w-[30%]";
  };

  return (
    <section className="tv-slide flex h-full w-full flex-wrap content-center justify-center gap-4 lg:gap-6 2xl:gap-8">
      {ranked.map((team, i) => (
        <div key={team.id} className={`flex ${getWidthClass(teams.length)}`}>
          <TeamClashCard team={team} maxPoints={maxPoints} rank={i} />
        </div>
      ))}
    </section>
  );
}

function StatusBadge({ status }) {
  if (status === "ongoing") {
    return (
      <span className="tv-pulse ml-3 flex shrink-0 items-center gap-1.5 rounded-full bg-[#21F1A8] px-4 py-1.5 text-xs font-black uppercase tracking-wide text-black lg:text-sm 2xl:text-base">
        <span className="h-2 w-2 rounded-full bg-black/70" />
        Live Now
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span className="ml-3 shrink-0 rounded-full bg-amber-400/15 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-amber-500 dark:text-amber-400 lg:text-sm 2xl:text-base">
        Paused
      </span>
    );
  }
  if (status === "completed" || status === "published") {
    return (
      <span className="ml-3 shrink-0 rounded-full bg-slate-200 px-4 py-1.5 text-xs font-black uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300 lg:text-sm 2xl:text-base">
        Completed
      </span>
    );
  }
  return null;
}

function HappeningNow({ events, pageIndex, pageCount }) {
  const ordered = useMemo(() => sortHappeningNow(events), [events]);
  const page = ordered.slice(
    pageIndex * HAPPENING_PAGE_SIZE,
    pageIndex * HAPPENING_PAGE_SIZE + HAPPENING_PAGE_SIZE,
  );

  return (
    <div className="tv-slide flex h-full w-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#141414] lg:p-10 2xl:p-12">
      <div className="mb-6 flex shrink-0 items-center gap-4 lg:mb-8">
        <span
          className="h-4 w-4 rounded-full bg-[#21F1A8]"
          style={{ boxShadow: "0 0 15px 3px #21F1A8" }}
        />
        <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900 dark:text-white lg:text-4xl 2xl:text-5xl">
          Happening Now & Upcoming
        </h3>
      </div>

      <div
        key={pageIndex}
        className="tv-fade grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-5 lg:gap-8 2xl:gap-10"
      >
        {page.length === 0 && (
          <div className="col-span-2 row-span-3 flex items-center justify-center text-xl text-slate-400 dark:text-slate-500 2xl:text-3xl">
            Nothing scheduled for today.
          </div>
        )}
        {page.map((e) => {
          const isOngoing = e.status === "ongoing";
          const isPaused = e.status === "paused";
          return (
            <div
              key={e.id}
              className={`flex flex-col justify-center rounded-2xl border px-6 py-4 dark:bg-white/[0.03] lg:px-8 lg:py-6 2xl:px-10 2xl:py-8 ${
                isOngoing
                  ? "border-[#21F1A8]/40 bg-[#21F1A8]/[0.06] shadow-[0_0_30px_-10px_#21F1A855] dark:border-[#21F1A8]/30"
                  : isPaused
                    ? "border-amber-400/30 bg-amber-400/[0.06] dark:border-amber-400/20"
                    : "border-slate-100 bg-slate-50 dark:border-white/5"
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <span className="shrink-0 rounded-full bg-[#21F1A8]/10 px-4 py-1.5 text-base font-bold text-[#0d9e73] dark:text-[#21F1A8] lg:text-lg 2xl:text-2xl">
                  {formatTime(e.time)}
                </span>
                <StatusBadge status={e.status} />
              </div>
              <div className="min-w-0">
                <p
                  className={`line-clamp-2 text-balance text-2xl font-bold leading-tight lg:text-3xl 2xl:text-4xl ${
                    isPaused
                      ? "text-slate-500 dark:text-slate-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {e.eventName}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <p className="line-clamp-1 text-lg text-slate-500 dark:text-slate-400 lg:text-xl 2xl:text-2xl">
                    {e.venue}
                  </p>
                  {e.categoryTag && (
                    <>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="line-clamp-1 text-lg font-medium text-slate-500 dark:text-slate-400 lg:text-xl 2xl:text-2xl">
                        {e.categoryTag}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {page.length > 0 &&
          Array.from({ length: HAPPENING_PAGE_SIZE - page.length }).map(
            (_, i) => <div key={`pad-${i}`} className="hidden lg:block" />,
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
      <div className="flex items-center gap-4 opacity-40">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black lg:h-12 lg:w-12 2xl:h-16 2xl:w-16 2xl:text-xl"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          {medalLabel(place)}
        </span>
        <p className="text-lg text-slate-400 dark:text-slate-500 2xl:text-2xl">
          —
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-4">
      <span
        className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black lg:h-12 lg:w-12 2xl:h-16 2xl:w-16 2xl:text-xl"
        style={{
          color,
          backgroundColor: `${color}1a`,
          boxShadow: `0 0 12px 0 ${color}55`,
        }}
      >
        {medalLabel(place)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p className="line-clamp-2 text-balance text-xl font-bold leading-snug text-slate-900 dark:text-white lg:text-2xl 2xl:text-3xl">
            {entry.name}
          </p>
          {entry.isGroup && entry.groupName && (
            <span className="mt-1 shrink-0 rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400 2xl:text-xs">
              Group
            </span>
          )}
        </div>
        {entry.team && (
          <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400 lg:text-base 2xl:text-xl">
            {entry.team}
          </p>
        )}
      </div>
    </div>
  );
}

function LatestResults({ groupedResults, pageIndex, pageCount }) {
  const page = groupedResults.slice(
    pageIndex * RESULTS_PAGE_SIZE,
    pageIndex * RESULTS_PAGE_SIZE + RESULTS_PAGE_SIZE,
  );

  return (
    <div className="tv-slide flex h-full w-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#141414] lg:p-10 2xl:p-12">
      <div className="mb-6 flex shrink-0 items-center gap-4 lg:mb-8">
        <span
          className="h-4 w-4 rounded-full bg-[#fbbf24]"
          style={{ boxShadow: "0 0 15px 3px #fbbf24" }}
        />
        <h3 className="text-2xl font-bold uppercase tracking-wide text-slate-900 dark:text-white lg:text-4xl 2xl:text-5xl">
          Latest Results
        </h3>
      </div>

      <div
        key={pageIndex}
        className="tv-fade grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-5 lg:gap-8 2xl:gap-10"
      >
        {page.length === 0 && (
          <div className="col-span-2 row-span-2 flex items-center justify-center text-xl text-slate-400 dark:text-slate-500 2xl:text-3xl">
            No results announced yet.
          </div>
        )}
        {page.map((g) => (
          <div
            key={g.eventId}
            className="flex flex-col justify-center rounded-2xl border border-slate-100 bg-slate-50 px-6 py-5 dark:border-white/5 dark:bg-white/[0.03] lg:px-8 lg:py-6 2xl:px-10 2xl:py-8"
          >
            <p className="mb-5 line-clamp-2 text-balance text-lg font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 lg:text-xl 2xl:text-3xl">
              {g.eventName}
              {g.categoryTag && (
                <span className="ml-2 font-medium normal-case text-slate-400 dark:text-slate-500">
                  {g.categoryTag}
                </span>
              )}
            </p>
            <div className="grid grid-cols-1 gap-5 lg:gap-6 2xl:gap-8">
              <ResultRow place={1} entry={g.entries[1]} />
              <ResultRow place={2} entry={g.entries[2]} />
              <ResultRow place={3} entry={g.entries[3]} />
            </div>
          </div>
        ))}
        {page.length > 0 &&
          Array.from({ length: RESULTS_PAGE_SIZE - page.length }).map(
            (_, i) => <div key={`pad-${i}`} className="hidden lg:block" />,
          )}
      </div>

      <PageDots count={pageCount} activeIndex={pageIndex} color="#fbbf24" />
    </div>
  );
}

export default function LiveTvDashboard() {
  const { slug } = useParams();

  const {
    data: festival,
    notFound,
    loading: festivalLoading,
  } = usePublicPoll(slug ? `/public/${slug}/` : null);

  const festivalConfirmed = !festivalLoading && !notFound && festival != null;

  const leaderboard = usePublicPoll(
    slug && festivalConfirmed ? `/public/${slug}/leaderboard/` : null,
  );
  const schedule = usePublicPoll(
    slug && festivalConfirmed ? `/public/${slug}/schedule/` : null,
  );
  const results = usePublicPoll(
    slug && festivalConfirmed ? `/public/${slug}/results/?page_size=500` : null,
  );

  const teams = useMemo(() => {
    const rows = Array.isArray(leaderboard.data) ? leaderboard.data : [];
    return rows.map(normalizeTeam);
  }, [leaderboard.data]);

  const events = useMemo(() => {
    const items = Array.isArray(schedule.data) ? schedule.data : [];
    return items.map(normalizeScheduleItem).filter((e) => {
      if (
        e.status === "ongoing" ||
        e.status === "upcoming" ||
        e.status === "paused"
      )
        return true;
      if (
        (e.status === "completed" || e.status === "published") &&
        isToday(e.time)
      )
        return true;

      return false;
    });
  }, [schedule.data]);

  const groupedResults = useMemo(() => {
    const rows = Array.isArray(results.data)
      ? results.data
      : (results.data?.results ?? []);
    const normalized = rows.map(normalizePlacement);
    return groupPlacementsByEvent(normalized);
  }, [results.data]);

  const SLIDE_LEADERBOARD = 0;
  const SLIDE_SCHEDULE = 1;
  const SLIDE_RESULTS = 2;
  const SLIDES = [SLIDE_LEADERBOARD, SLIDE_SCHEDULE, SLIDE_RESULTS];

  const [slideState, setSlideState] = useState({
    slide: SLIDE_LEADERBOARD,
    page: 0,
  });

  const schedulePageCount = Math.max(
    1,
    Math.ceil(events.length / HAPPENING_PAGE_SIZE),
  );
  const resultsPageCount = Math.max(
    1,
    Math.ceil(groupedResults.length / RESULTS_PAGE_SIZE),
  );

  useEffect(() => {
    let timeoutId;
    const { slide, page } = slideState;

    if (slide === SLIDE_SCHEDULE && page >= schedulePageCount) {
      setSlideState({ slide: SLIDE_RESULTS, page: 0 });
      return;
    }
    if (slide === SLIDE_RESULTS && page >= resultsPageCount) {
      setSlideState({ slide: SLIDE_LEADERBOARD, page: 0 });
      return;
    }

    if (slide === SLIDE_LEADERBOARD) {
      timeoutId = setTimeout(() => {
        setSlideState({ slide: SLIDE_SCHEDULE, page: 0 });
      }, MASTER_ROTATE_MS);
    } else if (slide === SLIDE_SCHEDULE) {
      timeoutId = setTimeout(() => {
        if (page + 1 < schedulePageCount) {
          setSlideState({ slide: SLIDE_SCHEDULE, page: page + 1 });
        } else {
          setSlideState({ slide: SLIDE_RESULTS, page: 0 });
        }
      }, INNER_ROTATE_MS);
    } else if (slide === SLIDE_RESULTS) {
      timeoutId = setTimeout(() => {
        if (page + 1 < resultsPageCount) {
          setSlideState({ slide: SLIDE_RESULTS, page: page + 1 });
        } else {
          setSlideState({ slide: SLIDE_LEADERBOARD, page: 0 });
        }
      }, INNER_ROTATE_MS);
    }

    return () => clearTimeout(timeoutId);
  }, [slideState, schedulePageCount, resultsPageCount]);

  if (notFound) {
    return <PublicUnavailable />;
  }

  return (
    <div className="fixed inset-0 flex h-[100vh] w-[100vw] flex-col overflow-hidden bg-slate-50 font-['Manrope',sans-serif] dark:bg-[#0a0a0a] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <style>{`
        @keyframes tv-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .tv-fade { animation: tv-fade-in 0.5s ease; }
        
        @keyframes tv-slide-in { 
          0% { opacity: 0; transform: scale(0.97) translateY(15px); } 
          100% { opacity: 1; transform: scale(1) translateY(0); } 
        }
        .tv-slide { animation: tv-slide-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
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

      <main className="flex min-h-0 flex-1 px-6 pb-6 lg:px-10 lg:pb-8 2xl:px-14 2xl:pb-10">
        {slideState.slide === SLIDE_LEADERBOARD && (
          <EpicLeaderboard teams={teams} />
        )}

        {slideState.slide === SLIDE_SCHEDULE && (
          <HappeningNow
            events={events}
            pageIndex={slideState.page}
            pageCount={schedulePageCount}
          />
        )}

        {slideState.slide === SLIDE_RESULTS && (
          <LatestResults
            groupedResults={groupedResults}
            pageIndex={slideState.page}
            pageCount={resultsPageCount}
          />
        )}
      </main>

      <div className="absolute bottom-0 left-0 flex w-full items-center justify-center gap-3 pb-4">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all duration-700"
            style={{
              width: i === slideState.slide ? "4rem" : "1.5rem",
              backgroundColor:
                i === slideState.slide ? "#21F1A8" : "rgba(148,163,184,0.3)",
            }}
          />
        ))}
      </div>

      <FullscreenToggle />
    </div>
  );
}
