import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { usePublicPoll } from "../lib/usePublicResource.js";
import PublicUnavailable from "./PublicUnavailable.jsx";

const MASTER_ROTATE_MS = 12_000;
const INNER_ROTATE_MS = 8_000;

const TEAMS_PAGE_SIZE = 3;
const HAPPENING_PAGE_SIZE = 6;
const RESULTS_PAGE_SIZE = 2;

const PLACE_COLORS = {
  1: "#FFC542",
  2: "#B8C4D9",
  3: "#E8A26B",
};

const PLACE_GLOW = {
  1: "rgba(255, 197, 66, 0.45)",
  2: "rgba(184, 196, 217, 0.4)",
  3: "rgba(232, 162, 107, 0.4)",
};

const PLACE_LABELS = {
  1: "1st",
  2: "2nd",
  3: "3rd",
};

/* ---------------------------------------------------------------------- */
/* Data helpers (unchanged wiring — same API shape from the backend)      */
/* ---------------------------------------------------------------------- */

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

function useRotatingPages(items, pageSize, intervalMs = INNER_ROTATE_MS) {
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
    boysPoints: Number(row.boys_points ?? 0),
    girlsPoints: Number(row.girls_points ?? 0),
  };
}

function genderLabel(value) {
  if (!value) return "";
  if (value.toLowerCase() === "mixed" || value.toLowerCase() === "both")
    return "Mixed";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function normalizeScheduleItem(item) {
  return {
    id: item.id,
    eventName: item.title ?? item.event_name ?? "Event",
    category: item.category_name,
    gender: item.gender,
    venue: item.venue_name ?? "—",
    time: item.scheduled_time ?? null,
    status: item.status ?? "upcoming",
  };
}

function sortHappeningNow(events) {
  return [...events].sort((a, b) => {
    const timeA = a.time ? new Date(a.time).getTime() : Infinity;
    const timeB = b.time ? new Date(b.time).getTime() : Infinity;
    return timeA - timeB;
  });
}

function normalizePlacement(p) {
  return {
    id: p.id,
    eventId: p.event_id,
    eventName: p.event_name ?? "Event",
    category: p.category_name ?? p.category,
    gender: p.gender,
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
        category: p.category,
        gender: p.gender,
        entries: { 1: [], 2: [], 3: [] },
      });
    }
    if (p.place && groups.get(key).entries[p.place]) {
      groups.get(key).entries[p.place].push(p);
    }
  }

  return [...groups.values()].reverse();
}

/* ---------------------------------------------------------------------- */
/* Chrome: clock, header, fullscreen, page dots                           */
/* ---------------------------------------------------------------------- */

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
      <span className="font-mono text-[clamp(1.1rem,2.4vw,2.75rem)] font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
        {time}
      </span>
      <span className="hidden text-[clamp(0.7rem,1vw,1.15rem)] font-medium text-slate-500 dark:text-slate-400 sm:block">
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
      className={`fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-700 backdrop-blur transition-opacity duration-500 dark:border-white/10 dark:bg-black/60 dark:text-white sm:bottom-6 sm:right-6 sm:h-12 sm:w-12 ${
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
    <div className="mt-3 flex shrink-0 items-center justify-center gap-2 sm:mt-4">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 rounded-full transition-all duration-500 sm:h-2"
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
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-10 lg:py-6 2xl:px-14">
      <h1 className="min-w-0 flex-1 truncate text-[clamp(1.15rem,2.6vw,2.75rem)] font-bold tracking-tight text-slate-900 dark:text-white">
        {madrassaName}
      </h1>

      <div className="flex shrink-0 items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 sm:gap-3 sm:px-5 sm:py-2">
        <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 sm:h-3 sm:w-3" />
        </span>
        <span className="text-[clamp(0.65rem,1vw,1rem)] font-bold uppercase tracking-[0.3em] text-red-500 dark:text-red-400">
          Live
        </span>
      </div>

      <DigitalClock />
    </header>
  );
}

function OngoingBanner({ ongoingEvents }) {
  if (!ongoingEvents || ongoingEvents.length === 0) return null;
  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-2xl border border-[#21F1A8]/30 bg-[#21F1A8]/[0.08] p-4 shadow-[0_0_30px_-10px_rgba(33,241,168,0.2)] sm:mb-6 sm:rounded-3xl sm:p-5 lg:mb-8 lg:p-6 2xl:mb-10 2xl:p-8">
      <div className="flex items-center gap-3">
        <span className="tv-pulse h-2.5 w-2.5 rounded-full bg-[#21F1A8] shadow-[0_0_12px_3px_#21F1A8] sm:h-3 sm:w-3" />
        <h3 className="text-[clamp(0.7rem,1vw,1.15rem)] font-bold uppercase tracking-widest text-[#0d9e73] dark:text-[#21F1A8]">
          Live Events
        </h3>
      </div>
      <div className="flex flex-wrap gap-3 sm:gap-4 lg:gap-6">
        {ongoingEvents.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center gap-2 text-[clamp(0.9rem,1.4vw,1.9rem)] font-bold text-slate-900 dark:text-white"
          >
            <span>{e.eventName}</span>
            {e.category && (
              <span className="font-medium text-slate-500 dark:text-slate-400">
                [{e.category}]
              </span>
            )}
            <span className="rounded-full bg-slate-900/5 px-2.5 py-1 text-[clamp(0.6rem,0.75vw,1rem)] text-slate-600 dark:bg-white/10 dark:text-slate-300 sm:px-3">
              @ {e.venue}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Slide 1 — Leaderboard                                                  */
/* ---------------------------------------------------------------------- */

function TeamClashCard({ team, maxPoints, rank }) {
  const fillPct =
    maxPoints > 0
      ? Math.max(4, Math.round((team.points / maxPoints) * 100))
      : 4;
  const isLeading = rank === 0;
  const color = PLACE_COLORS[rank + 1] ?? "#94a3b8";

  return (
    <div
      className="relative flex h-full min-h-[13rem] w-full flex-col justify-between overflow-hidden rounded-2xl border bg-white px-5 py-6 shadow-xl dark:bg-[#141414] sm:rounded-3xl sm:px-8 sm:py-8 lg:px-10 lg:py-10 2xl:px-12 2xl:py-12"
      style={{
        borderColor: isLeading ? `${color}55` : undefined,
        boxShadow: isLeading ? `0 0 60px -12px ${color}66` : undefined,
      }}
    >
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl border sm:rounded-3xl ${
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
          className="rounded-full px-3 py-1 text-[clamp(0.65rem,0.85vw,1.15rem)] font-bold uppercase tracking-widest"
          style={{ color, backgroundColor: `${color}1a` }}
        >
          {isLeading ? "Leading" : `#${rank + 1}`}
        </span>
        <span
          className="h-3.5 w-3.5 rounded-full sm:h-4 sm:w-4 lg:h-5 lg:w-5"
          style={{ backgroundColor: color, boxShadow: `0 0 15px 3px ${color}` }}
        />
      </div>

      <div className="mb-auto mt-auto flex flex-col gap-2 py-2">
        <h2 className="relative z-10 line-clamp-2 text-balance text-center text-[clamp(1.35rem,2.6vw,3.25rem)] font-extrabold text-slate-900 dark:text-white">
          {team.name}
        </h2>
        <div className="relative z-10 mt-1 flex items-baseline justify-center gap-2 sm:gap-3">
          <span
            className="text-[clamp(2.75rem,7vw,9rem)] font-black leading-none tracking-tighter"
            style={{ color }}
          >
            {team.points}
          </span>
          <span className="text-[clamp(0.9rem,1.4vw,2rem)] font-semibold text-slate-500 dark:text-slate-400">
            pts
          </span>
        </div>

        <div className="relative z-10 mt-2 flex items-center justify-center gap-3 text-[clamp(0.7rem,1vw,1.25rem)] font-bold text-slate-500 dark:text-slate-400 sm:mt-3 sm:gap-4">
          <span className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2 w-2 rounded-full bg-[#38bdf8] sm:h-2.5 sm:w-2.5" />
            Boys: {team.boysPoints}
          </span>
          <span className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2 w-2 rounded-full bg-[#fbbf24] sm:h-2.5 sm:w-2.5" />
            Girls: {team.girlsPoints}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-auto h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/5 sm:h-4 lg:h-6 2xl:h-8">
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

function EpicLeaderboard({
  pagedTeams,
  maxPoints,
  pageIndex,
  pageCount,
  ongoingEvents,
}) {
  return (
    <div className="tv-slide flex h-full w-full flex-col">
      <OngoingBanner ongoingEvents={ongoingEvents} />

      <div className="grid min-h-0 flex-1 w-full auto-rows-fr grid-cols-1 place-content-center gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 2xl:gap-8">
        {pagedTeams.map((team) => (
          <TeamClashCard
            key={team.id}
            team={team}
            maxPoints={maxPoints}
            rank={team.actualRank}
          />
        ))}
      </div>

      <PageDots count={pageCount} activeIndex={pageIndex} color="#21F1A8" />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Slide 2 — Today's schedule                                             */
/* ---------------------------------------------------------------------- */

function StatusBadge({ status }) {
  if (status === "ongoing") {
    return (
      <span className="tv-pulse ml-2 flex shrink-0 items-center gap-1.5 rounded-full bg-[#21F1A8] px-3 py-1 text-[clamp(0.55rem,0.7vw,0.9rem)] font-black uppercase tracking-wide text-black sm:ml-3 sm:px-4 sm:py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-black/70" />
        Live Now
      </span>
    );
  }
  if (status === "paused") {
    return (
      <span className="ml-2 shrink-0 rounded-full bg-amber-400/15 px-3 py-1 text-[clamp(0.55rem,0.7vw,0.9rem)] font-black uppercase tracking-wide text-amber-500 dark:text-amber-400 sm:ml-3 sm:px-4 sm:py-1.5">
        Paused
      </span>
    );
  }
  if (status === "completed" || status === "published") {
    return (
      <span className="ml-2 shrink-0 rounded-full bg-slate-200 px-3 py-1 text-[clamp(0.55rem,0.7vw,0.9rem)] font-black uppercase tracking-wide text-slate-600 dark:bg-white/10 dark:text-slate-300 sm:ml-3 sm:px-4 sm:py-1.5">
        Completed
      </span>
    );
  }
  return null;
}

function SlideShell({ accentColor, icon, title, children }) {
  return (
    <div className="tv-slide flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-[#141414] sm:rounded-3xl sm:p-6 lg:p-10 2xl:p-12">
      <div className="mb-4 flex shrink-0 items-center gap-3 sm:mb-6 sm:gap-4 lg:mb-8">
        {icon ?? (
          <span
            className="h-3 w-3 shrink-0 rounded-full sm:h-4 sm:w-4"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 15px 3px ${accentColor}`,
            }}
          />
        )}
        <h3 className="text-[clamp(1.1rem,2.2vw,3rem)] font-bold uppercase tracking-wide text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function HappeningNow({ events, pageIndex, pageCount }) {
  const ordered = useMemo(() => sortHappeningNow(events), [events]);
  const page = ordered.slice(
    pageIndex * HAPPENING_PAGE_SIZE,
    pageIndex * HAPPENING_PAGE_SIZE + HAPPENING_PAGE_SIZE,
  );

  return (
    <SlideShell accentColor="#21F1A8" title="Today's Schedule">
      <div
        key={pageIndex}
        className="tv-fade grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:gap-8 2xl:gap-10"
      >
        {page.length === 0 && (
          <div className="col-span-full flex items-center justify-center text-[clamp(0.9rem,1.4vw,1.9rem)] text-slate-400 dark:text-slate-500">
            Nothing scheduled for today.
          </div>
        )}
        {page.map((e) => {
          const isOngoing = e.status === "ongoing";
          const isPaused = e.status === "paused";
          return (
            <div
              key={e.id}
              className={`flex flex-col justify-center rounded-xl border px-4 py-3 dark:bg-white/[0.03] sm:rounded-2xl sm:px-6 sm:py-4 lg:px-8 lg:py-6 2xl:px-10 2xl:py-8 ${
                isOngoing
                  ? "border-[#21F1A8]/40 bg-[#21F1A8]/[0.06] shadow-[0_0_30px_-10px_#21F1A855] dark:border-[#21F1A8]/30"
                  : isPaused
                    ? "border-amber-400/30 bg-amber-400/[0.06] dark:border-amber-400/20"
                    : "border-slate-100 bg-slate-50 dark:border-white/5"
              }`}
            >
              <div className="mb-2 flex items-start justify-between sm:mb-4">
                <span className="shrink-0 rounded-full bg-[#21F1A8]/10 px-3 py-1 text-[clamp(0.7rem,1vw,1.5rem)] font-bold text-[#0d9e73] dark:text-[#21F1A8] sm:px-4 sm:py-1.5">
                  {formatTime(e.time)}
                </span>
                <StatusBadge status={e.status} />
              </div>
              <div className="min-w-0">
                <p
                  className={`line-clamp-2 text-balance text-[clamp(1.05rem,1.8vw,2.5rem)] font-bold leading-tight ${
                    isPaused
                      ? "text-slate-500 dark:text-slate-400"
                      : "text-slate-900 dark:text-white"
                  }`}
                >
                  {e.eventName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-3 sm:gap-3">
                  <p className="line-clamp-1 text-[clamp(0.8rem,1.1vw,1.5rem)] text-slate-500 dark:text-slate-400">
                    {e.venue}
                  </p>
                  {e.category && (
                    <>
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300 dark:bg-slate-700" />
                      <span className="line-clamp-1 text-[clamp(0.8rem,1.1vw,1.5rem)] font-medium text-slate-500 dark:text-slate-400">
                        {e.category}{" "}
                        {e.gender && e.gender !== "Mixed"
                          ? `- ${genderLabel(e.gender)}`
                          : ""}
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
    </SlideShell>
  );
}

/* ---------------------------------------------------------------------- */
/* Slide 3 — Latest results (redesigned: 2-per-page medal podium)         */
/* ---------------------------------------------------------------------- */

function TrophyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 4h8v3.2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v.75A3.75 3.75 0 0 0 7.75 11H8M16 5h2.5A1.5 1.5 0 0 1 20 6.5v.75A3.75 3.75 0 0 1 16.25 11H16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11.2V15m0 0c-1.8 0-2.6 1-2.8 2.6M12 15c1.8 0 2.6 1 2.8 2.6M7.5 20h9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MedalIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 3h10l-3.2 6.4L17 15l-5-2.8L7 15l3.2-5.6L7 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="15.5" r="5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m9.7 15.3 1.6 1.6 3-3.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PodiumNames({ entries, emphasis }) {
  if (!entries || entries.length === 0) {
    return (
      <p className="text-[clamp(0.85rem,1vw,1.35rem)] font-semibold text-slate-300 dark:text-slate-600">
        —
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2">
      {entries.map((entry, idx) => (
        <div key={entry.id || idx} className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <p
              className={`line-clamp-2 text-balance text-center font-extrabold leading-tight text-slate-900 dark:text-white ${
                emphasis
                  ? "text-[clamp(1.2rem,2.1vw,2.6rem)]"
                  : "text-[clamp(0.95rem,1.5vw,2rem)]"
              }`}
            >
              {entry.name}
            </p>
            {entry.isGroup && entry.groupName && (
              <span className="hidden shrink-0 rounded-md bg-slate-900/5 px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-widest text-slate-500 dark:bg-white/10 dark:text-slate-400 sm:inline-block">
                Group
              </span>
            )}
          </div>
          {entry.team && (
            <p className="line-clamp-1 text-[clamp(0.72rem,1vw,1.3rem)] font-bold text-slate-500 dark:text-slate-400">
              {entry.team}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function PodiumColumn({ place, entries }) {
  const color = PLACE_COLORS[place];
  const glow = PLACE_GLOW[place];
  const isFirst = place === 1;
  const heightClass = isFirst
    ? "min-h-[8.5rem] sm:min-h-[10.5rem] lg:min-h-[13rem]"
    : place === 2
      ? "min-h-[6.25rem] sm:min-h-[7.5rem] lg:min-h-[9.5rem]"
      : "min-h-[4.75rem] sm:min-h-[5.75rem] lg:min-h-[7.25rem]";
  const hasEntries = entries && entries.length > 0;

  return (
    <div
      className={`flex flex-col items-center gap-2.5 sm:gap-3 ${isFirst ? "flex-[1.15]" : "flex-1"}`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[clamp(0.72rem,1vw,1.2rem)] font-black sm:h-12 sm:w-12 lg:h-16 lg:w-16"
        style={{
          color: hasEntries ? "#1a1408" : "#94a3b8",
          background: hasEntries
            ? `linear-gradient(155deg, ${color}, ${color}bb)`
            : "rgba(148,163,184,0.1)",
          boxShadow: hasEntries ? `0 6px 20px -4px ${glow}` : undefined,
        }}
      >
        {isFirst ? (
          <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
        ) : (
          <MedalIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
        )}
      </div>

      <div className="flex min-h-[4rem] items-center px-1 sm:min-h-[4.5rem]">
        <PodiumNames entries={entries} emphasis={isFirst} />
      </div>

      <div
        className={`relative flex w-full items-start justify-center overflow-hidden rounded-t-2xl pt-2 sm:rounded-t-[1.25rem] sm:pt-3 ${heightClass}`}
        style={{
          background: hasEntries
            ? `linear-gradient(180deg, ${color}2e, ${color}08)`
            : "rgba(148,163,184,0.05)",
          boxShadow: hasEntries
            ? `inset 0 2px 0 0 ${color}`
            : "inset 0 2px 0 0 rgba(148,163,184,0.25)",
        }}
      >
        <span
          className="rounded-full px-3 py-1 text-[clamp(0.6rem,0.8vw,0.95rem)] font-black uppercase tracking-widest"
          style={{
            color: hasEntries ? color : "#94a3b8",
            backgroundColor: hasEntries ? "rgba(0,0,0,0.18)" : "transparent",
          }}
        >
          {PLACE_LABELS[place]}
        </span>
      </div>
    </div>
  );
}

function ResultEventCard({ group }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#161616] sm:rounded-[1.75rem]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full opacity-[0.14] blur-[80px]"
        style={{ background: PLACE_COLORS[1] }}
      />

      <div className="relative z-10 flex flex-col items-center gap-2.5 border-b border-slate-200/70 bg-gradient-to-b from-slate-50/80 to-transparent px-5 py-5 text-center dark:border-white/5 dark:from-white/[0.03] sm:gap-3 sm:px-8 sm:py-7">
        <h4 className="line-clamp-2 text-balance text-[clamp(1.3rem,2.3vw,2.75rem)] font-black uppercase tracking-tight text-slate-900 dark:text-white">
          {group.eventName}
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {group.category && (
            <span className="rounded-full bg-[#21F1A8]/15 px-3 py-1 text-[clamp(0.62rem,0.85vw,1rem)] font-bold uppercase tracking-wider text-[#0d9e73] dark:bg-[#21F1A8]/10 dark:text-[#21F1A8]">
              {group.category}
            </span>
          )}
          {group.gender &&
            group.gender.toLowerCase() !== "mixed" &&
            group.gender.toLowerCase() !== "both" && (
              <span className="rounded-full bg-slate-200 px-3 py-1 text-[clamp(0.62rem,0.85vw,1rem)] font-bold uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-300">
                {genderLabel(group.gender)}
              </span>
            )}
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-end justify-center gap-3 px-4 pb-6 pt-6 sm:gap-5 sm:px-8 sm:pb-8 sm:pt-8 lg:gap-6 lg:px-10">
        <PodiumColumn place={2} entries={group.entries[2]} />
        <PodiumColumn place={1} entries={group.entries[1]} />
        <PodiumColumn place={3} entries={group.entries[3]} />
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
    <SlideShell accentColor="#fbbf24" title="Latest Results">
      <div
        key={pageIndex}
        className="tv-fade grid min-h-0 flex-1 auto-rows-fr grid-cols-1 place-content-center gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-8"
      >
        {page.length === 0 && (
          <div className="col-span-full flex items-center justify-center text-[clamp(0.9rem,1.4vw,1.9rem)] text-slate-400 dark:text-slate-500">
            No results announced yet.
          </div>
        )}

        {page.map((g) => (
          <ResultEventCard key={g.eventId} group={g} />
        ))}
      </div>

      <PageDots count={pageCount} activeIndex={pageIndex} color="#fbbf24" />
    </SlideShell>
  );
}

/* ---------------------------------------------------------------------- */
/* Root component                                                         */
/* ---------------------------------------------------------------------- */

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

  const rankedTeams = useMemo(() => {
    const rows = Array.isArray(leaderboard.data) ? leaderboard.data : [];
    const normalized = rows.map(normalizeTeam);
    return normalized.sort((a, b) => b.points - a.points);
  }, [leaderboard.data]);

  const events = useMemo(() => {
    const items = Array.isArray(schedule.data) ? schedule.data : [];
    return items.map(normalizeScheduleItem).filter((e) => isToday(e.time));
  }, [schedule.data]);

  const ongoingEvents = useMemo(() => {
    return events.filter((e) => e.status === "ongoing");
  }, [events]);

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

  const leaderboardPageCount = Math.max(
    1,
    Math.ceil(rankedTeams.length / TEAMS_PAGE_SIZE),
  );
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

    if (slide === SLIDE_LEADERBOARD && page >= leaderboardPageCount) {
      setSlideState({ slide: SLIDE_SCHEDULE, page: 0 });
      return;
    }
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
        if (page + 1 < leaderboardPageCount) {
          setSlideState({ slide: SLIDE_LEADERBOARD, page: page + 1 });
        } else {
          setSlideState({ slide: SLIDE_SCHEDULE, page: 0 });
        }
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
  }, [slideState, leaderboardPageCount, schedulePageCount, resultsPageCount]);

  const pagedTeams = useMemo(() => {
    return rankedTeams
      .slice(
        slideState.page * TEAMS_PAGE_SIZE,
        slideState.page * TEAMS_PAGE_SIZE + TEAMS_PAGE_SIZE,
      )
      .map((t, idx) => ({
        ...t,
        actualRank: slideState.page * TEAMS_PAGE_SIZE + idx,
      }));
  }, [rankedTeams, slideState.page]);

  const maxPoints = rankedTeams[0]?.points ?? 0;

  if (notFound) {
    return <PublicUnavailable />;
  }

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-[100vw] flex-col overflow-hidden bg-slate-50 font-['Manrope',sans-serif] dark:bg-[#0a0a0a] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        @media (prefers-reduced-motion: reduce) {
          .tv-fade, .tv-slide, .tv-pulse, .animate-ping { animation: none !important; }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 hidden h-[40rem] w-[70rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-[140px] dark:block"
        style={{
          background: "radial-gradient(circle, #21F1A8 0%, transparent 70%)",
        }}
      />

      <DashboardHeader madrassaName={festival?.name ?? "—"} />

      <main className="flex min-h-0 flex-1 px-4 pb-10 sm:px-6 sm:pb-10 lg:px-10 lg:pb-12 2xl:px-14 2xl:pb-14">
        {slideState.slide === SLIDE_LEADERBOARD && (
          <EpicLeaderboard
            pagedTeams={pagedTeams}
            maxPoints={maxPoints}
            pageIndex={slideState.page}
            pageCount={leaderboardPageCount}
            ongoingEvents={ongoingEvents}
          />
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

      <div className="absolute bottom-0 left-0 flex w-full items-center justify-center gap-2.5 pb-3 sm:gap-3 sm:pb-4">
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
