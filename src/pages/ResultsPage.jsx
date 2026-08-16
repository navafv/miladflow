import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SeoHead from "../components/SeoHead.jsx";
import MadrassaNavbar from "../components/MadrassaNavbar.jsx";
import MadrassaFooter from "../components/MadrassaFooter.jsx";
import PublicUnavailable from "../components/PublicUnavailable.jsx";
import { apiClient, ApiError } from "../lib/apiClient.js";
import { usePublicResource } from "../lib/usePublicResource.js";
import { Toast, useToast } from "../components/admin/Toast.jsx";

const TABS = [
  { key: "all", label: "All Results" },
  { key: "event", label: "Event-Based Results" },
  { key: "standings", label: "Standings" },
];

const STANDINGS_VIEWS = [
  { key: "team", label: "Team Standings" },
  { key: "student", label: "Top Students" },
];

const RANK_MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };

const rankRowStyle = {
  1: "border-l-[#F5C518] bg-[#F5C518]/10 dark:bg-[#F5C518]/10",
  2: "border-l-neutral-400 bg-neutral-100 dark:bg-white/10",
  3: "border-l-[#C97A3D] bg-[#C97A3D]/10 dark:bg-[#C97A3D]/10",
};

const rankBadgeStyle = {
  1: "bg-[#F5C518] text-[#171717] shadow-sm shadow-[#F5C518]/50",
  2: "bg-neutral-300 text-[#171717] dark:bg-neutral-300",
  3: "bg-[#C97A3D] text-white shadow-sm shadow-[#C97A3D]/40",
};

const placeLabel = { 1: "1st", 2: "2nd", 3: "3rd" };

const placePillStyle = {
  1: "bg-[#21F1A8]/15 text-[#0f9c74] dark:text-[#21F1A8]",
  2: "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300",
  3: "bg-neutral-100 text-neutral-500 dark:bg-white/5 dark:text-neutral-400",
};

const podiumStyle = {
  1: "border-[#21F1A8]/50 bg-[#21F1A8]/10 text-[#171717] dark:text-white shadow-[0_0_20px_-6px_#21F1A8]",
  2: "border-neutral-200 bg-neutral-50 text-[#171717] dark:border-white/15 dark:bg-white/5 dark:text-white",
  3: "border-neutral-200 bg-neutral-50 text-[#171717] dark:border-white/10 dark:bg-white/[0.03] dark:text-white",
};
const placeMedal = { 1: "🥇", 2: "🥈", 3: "🥉" };

const CATEGORY_ALL = "all";
const TEAM_ALL = "all";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-[#171717]";

const cardClass =
  "rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-none";

function normalizeResult(row) {
  return {
    id: row.id,
    event: row.event ?? row.event_name,
    category: row.category ?? row.category_name,
    isGroup: row.is_group ?? false,
    groupName: row.group_name ?? null,
    winner: row.winner ?? row.winner_name ?? row.student_name,
    team: row.team ?? row.team_name,
    place: row.place,
  };
}

function useResultFilterOptions(slug) {
  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (!slug) return undefined;
    let cancelled = false;
    Promise.all([
      apiClient.get(`/public/${slug}/categories/`, { skipAuth: true }),
      apiClient.get(`/public/${slug}/teams/`, { skipAuth: true }),
    ])
      .then(([categoryList, teamList]) => {
        if (cancelled) return;
        setCategories(Array.isArray(categoryList) ? categoryList : []);
        setTeams(Array.isArray(teamList) ? teamList : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { categories, teams };
}

function AllResultsTab({ slug, showToast }) {
  const { categories, teams } = useResultFilterOptions(slug);
  const [category, setCategory] = useState(CATEGORY_ALL);
  const [team, setTeam] = useState(TEAM_ALL);
  const [studentId, setStudentId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => setPage(1), [category, team, studentId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (category !== CATEGORY_ALL) params.set("category", category);
    if (team !== TEAM_ALL) params.set("team", team);
    if (studentId.trim()) params.set("student", studentId.trim());
    params.set("page", String(page));
    params.set("page_size", String(pageSize));

    apiClient
      .get(`/public/${slug}/results/?${params.toString()}`, { skipAuth: true })
      .then((result) => {
        if (cancelled) return;
        const list = Array.isArray(result) ? result : (result?.results ?? []);
        setRows(list.map(normalizeResult));
        setCount(
          Array.isArray(result) ? list.length : (result?.count ?? list.length),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiError ? err.message : "Could not load results.";
        setError(message);
        showToast(message, "error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, category, team, studentId, page]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="animate-fade-up space-y-6">
      <div className={`grid gap-3 p-4 sm:grid-cols-3 ${cardClass}`}>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-[#171717] transition-all duration-200 dark:border-white/10 dark:bg-[#171717] dark:text-white ${focusRing}`}
          >
            <option value={CATEGORY_ALL}>All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          Team
          <select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className={`rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-[#171717] transition-all duration-200 dark:border-white/10 dark:bg-[#171717] dark:text-white ${focusRing}`}
          >
            <option value={TEAM_ALL}>All Teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          Student ID
          <input
            type="text"
            inputMode="numeric"
            value={studentId}
            onChange={(e) =>
              setStudentId(e.target.value.replace(/[^0-9]/g, ""))
            }
            placeholder="e.g. 42"
            className={`rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-[#171717] placeholder:text-neutral-400 transition-all duration-200 dark:border-white/10 dark:bg-[#171717] dark:text-white dark:placeholder:text-neutral-500 ${focusRing}`}
          />
          <span className="text-[10px] font-normal normal-case text-neutral-400 dark:text-neutral-500">
            Filters to one student's individual results by their registration
            id.
          </span>
        </label>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 shadow-sm dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-300 dark:shadow-none">
          {error}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`animate-pulse px-5 py-4 ${cardClass}`}>
              <div className="h-3.5 w-1/3 rounded-full bg-neutral-200 dark:bg-white/10" />
              <div className="mt-2.5 h-2.5 w-1/4 rounded-full bg-neutral-200 dark:bg-white/10" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p
          className={`px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400 ${cardClass}`}
        >
          No results match those filters yet.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-[#262626] dark:shadow-none">
          {rows.map((r, i) => (
            <li
              key={r.id}
              className="animate-stagger group flex items-center justify-between gap-4 border-l-2 border-transparent px-5 py-4 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:border-l-[#21F1A8] hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
              style={{ "--stagger-index": Math.min(i, 12) }}
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
                <span className="hidden items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 sm:inline-flex">
                  {r.isGroup && r.groupName && (
                    <span className="rounded-full bg-[#21F1A8]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0f9c74] dark:text-[#21F1A8]">
                      Group
                    </span>
                  )}
                  {r.winner}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold font-mono ${
                    placePillStyle[r.place] ??
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

      {!loading && count > pageSize && (
        <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={`rounded-lg border border-neutral-300 px-3 py-1.5 transition-all duration-200 hover:border-[#21F1A8] hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5 ${focusRing}`}
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className={`rounded-lg border border-neutral-300 px-3 py-1.5 transition-all duration-200 hover:border-[#21F1A8] hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5 ${focusRing}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PodiumRow({ place, entry, index = 0 }) {
  return (
    <div
      className={`animate-stagger group relative flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-all duration-300 ease-in-out hover:-translate-y-1 ${podiumStyle[place]}`}
      style={{ "--stagger-index": index }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-sm dark:bg-[#171717] dark:shadow-none">
          {placeMedal[place]}
        </span>
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            {entry ? (
              <>
                {entry.name}
                {entry.isGroup && entry.groupName && (
                  <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide opacity-70 dark:bg-white/10">
                    Group
                  </span>
                )}
              </>
            ) : (
              <span className="opacity-60">Not yet announced</span>
            )}
          </p>
          {entry?.team && (
            <p className="text-[11px] font-medium opacity-70">{entry.team}</p>
          )}
        </div>
      </div>
      <span className="font-mono text-[11px] font-bold uppercase tracking-wide opacity-70">
        {placeLabel[place]}
      </span>
    </div>
  );
}

const PLACE_KEY = { 1: "first", 2: "second", 3: "third" };

function normalizeByEventGroup(group) {
  const event = group.event ?? {};
  const placements = Array.isArray(group.placements) ? group.placements : [];
  const podium = { first: [], second: [], third: [] };
  placements.forEach((p) => {
    const key = PLACE_KEY[p.place];
    if (!key) return;
    podium[key].push({
      name: p.winner_name,
      team: p.team_name,
      isGroup: p.is_group,
      groupName: p.group_name,
    });
  });
  return {
    event: {
      id: event.id,
      name: event.name,
      category: event.category_name,
      gender: event.gender,
      type: event.event_type,
    },
    podium,
  };
}

function normalizeTeamRow(row) {
  return {
    id: row.team_id ?? row.id,
    name: row.team_name ?? row.name,
    totalPoints: row.total_points ?? 0,
    boysPoints: row.boys_points ?? 0,
    girlsPoints: row.girls_points ?? 0,
  };
}

function normalizeStudentRow(row) {
  return {
    id: row.student_id,
    rank: row.rank,
    name: row.student_name,
    category: row.category_name,
    team: row.team_name,
    totalPoints: row.total_points ?? 0,
  };
}

function StandingsRow({ rank, title, subtitle, points, index = 0 }) {
  const isTop3 = rank <= 3;
  return (
    <li
      className={`animate-stagger group flex items-center justify-between gap-4 border-l-2 px-5 py-4 transition-all duration-300 ease-in-out hover:-translate-y-0.5 ${
        isTop3
          ? rankRowStyle[rank]
          : "border-l-transparent hover:border-l-[#21F1A8] hover:bg-neutral-50 dark:hover:bg-white/[0.03]"
      }`}
      style={{ "--stagger-index": Math.min(index, 12) }}
    >
      <div className="flex items-center gap-4">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold ${
            isTop3
              ? rankBadgeStyle[rank]
              : "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300"
          }`}
        >
          {isTop3 ? RANK_MEDAL[rank] : rank}
        </span>
        <div>
          <p className="font-semibold text-[#171717] dark:text-white">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <span className="font-mono text-sm font-bold text-[#0f9c74] dark:text-[#21F1A8]">
        {points} pts
      </span>
    </li>
  );
}

function StandingsList({ loading, error, rows, emptyLabel }) {
  if (loading) {
    return (
      <div className="space-y-3 p-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-3.5 w-1/3 rounded-full bg-neutral-200 dark:bg-white/10" />
            <div className="mt-2.5 h-2.5 w-1/4 rounded-full bg-neutral-200 dark:bg-white/10" />
          </div>
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="px-5 py-8 text-center text-sm font-semibold text-red-700 dark:text-red-300">
        {error}
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-neutral-100 dark:divide-white/10">{rows}</ul>
  );
}

function TeamStandings({ slug }) {
  const { data, loading, error } = usePublicResource(
    `/public/${slug}/leaderboard/`,
  );
  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeTeamRow);
  }, [data]);

  return (
    <StandingsList
      loading={loading}
      error={error}
      emptyLabel="No team standings published yet."
      rows={rows.map((row, i) => (
        <StandingsRow
          key={row.id}
          rank={i + 1}
          title={row.name}
          subtitle={`Boys: ${row.boysPoints} pts · Girls: ${row.girlsPoints} pts`}
          points={row.totalPoints}
          index={i}
        />
      ))}
    />
  );
}

function StudentStandings({ slug }) {
  const { categories } = useResultFilterOptions(slug);
  const [category, setCategory] = useState(CATEGORY_ALL);
  const [gender, setGender] = useState("all");

  const params = new URLSearchParams();
  if (category !== CATEGORY_ALL) params.set("category", category);
  if (gender !== "all") params.set("gender", gender);

  const query = params.toString();
  const { data, loading, error } = usePublicResource(
    `/public/${slug}/leaderboard/students/${query ? `?${query}` : ""}`,
  );
  const rows = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return list.map(normalizeStudentRow);
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-col gap-1 px-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 sm:w-64">
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-[#171717] transition-all duration-200 dark:border-white/10 dark:bg-[#171717] dark:text-white ${focusRing}`}
          >
            <option value={CATEGORY_ALL}>All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 px-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400 sm:w-48">
          Gender
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className={`rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-[#171717] transition-all duration-200 dark:border-white/10 dark:bg-[#171717] dark:text-white ${focusRing}`}
          >
            <option value="all">All Students</option>
            <option value="boys">Boys</option>
            <option value="girls">Girls</option>
          </select>
        </label>
      </div>
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-none">
        <StandingsList
          loading={loading}
          error={error}
          emptyLabel="No student points recorded yet."
          rows={rows.map((row, i) => (
            <StandingsRow
              key={row.id}
              rank={row.rank}
              title={row.name}
              subtitle={`${row.category} · ${row.team}`}
              points={row.totalPoints}
              index={i}
            />
          ))}
        />
      </div>
    </div>
  );
}

function StandingsTab({ slug }) {
  const [view, setView] = useState(STANDINGS_VIEWS[0].key);

  return (
    <div className="animate-fade-up space-y-4">
      <div className={`inline-flex rounded-lg p-1 ${cardClass}`}>
        {STANDINGS_VIEWS.map((v) => (
          <button
            key={v.key}
            onClick={() => setView(v.key)}
            className={`rounded-md px-4 py-2 text-xs font-semibold transition-all duration-300 ease-in-out ${focusRing} ${
              view === v.key
                ? "bg-[#21F1A8] text-[#171717] shadow"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-[#171717] dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "team" ? (
        <div className={cardClass}>
          <TeamStandings slug={slug} />
        </div>
      ) : (
        <StudentStandings slug={slug} />
      )}
    </div>
  );
}

function EventResultsTab({ slug }) {
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const { data, loading, error } = usePublicResource(
    `/public/${slug}/results/by-event/?page=${page}&page_size=${pageSize}`,
  );
  const [selectedEventId, setSelectedEventId] = useState(null);

  const groups = useMemo(() => {
    const list = Array.isArray(data) ? data : (data?.results ?? []);
    return list.map(normalizeByEventGroup);
  }, [data]);

  const count = Array.isArray(data)
    ? groups.length
    : (data?.count ?? groups.length);
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const selected = groups.find((g) => g.event.id === selectedEventId) ?? null;

  const goToPage = (updater) => {
    setSelectedEventId(null);
    setPage(updater);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`animate-pulse px-5 py-6 ${cardClass}`} />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 shadow-sm dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-300 dark:shadow-none">
        {error}
      </p>
    );
  }

  if (!selected) {
    return (
      <div className="animate-fade-up space-y-3">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Select an event to see its winners.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => (
            <button
              key={g.event.id}
              onClick={() => setSelectedEventId(g.event.id)}
              className={`animate-stagger flex flex-col items-start gap-1 px-5 py-4 text-left transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-[#21F1A8] hover:shadow-lg dark:hover:shadow-[0_0_20px_-8px_#21F1A8] ${cardClass} ${focusRing}`}
              style={{ "--stagger-index": Math.min(i, 12) }}
            >
              <span className="font-display text-base font-semibold text-[#171717] dark:text-white">
                {g.event.name}
              </span>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                {g.event.category} · {g.event.gender} · {g.event.type}
              </span>
            </button>
          ))}
          {groups.length === 0 && (
            <p
              className={`col-span-full px-5 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400 ${cardClass}`}
            >
              No results published yet.
            </p>
          )}
        </div>

        {count > pageSize && (
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => goToPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={`rounded-lg border border-neutral-300 px-3 py-1.5 transition-all duration-200 hover:border-[#21F1A8] hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5 ${focusRing}`}
              >
                Previous
              </button>
              <button
                onClick={() => goToPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={`rounded-lg border border-neutral-300 px-3 py-1.5 transition-all duration-200 hover:border-[#21F1A8] hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:hover:bg-white/5 ${focusRing}`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-5">
      <button
        onClick={() => setSelectedEventId(null)}
        className={`flex items-center gap-1.5 rounded-md text-xs font-semibold text-[#171717] transition-all duration-200 hover:-translate-x-0.5 hover:text-[#0f9c74] hover:underline dark:text-[#21F1A8] dark:hover:text-[#21F1A8]/80 ${focusRing}`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="h-3.5 w-3.5"
        >
          <path
            d="M12.5 4.5 7 10l5.5 5.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to events
      </button>

      <div className={`p-6 ${cardClass}`}>
        <div className="mb-5">
          <h2 className="font-display text-xl font-semibold text-[#171717] dark:text-white">
            {selected.event.name}
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            {selected.event.category} · {selected.event.gender} ·{" "}
            {selected.event.type}
          </p>
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3].map((place) => {
            const entries = selected.podium[PLACE_KEY[place]];
            let index = 0;
            for (let p = 1; p < place; p += 1)
              index += Math.max(1, selected.podium[PLACE_KEY[p]].length);
            return entries.length > 0 ? (
              entries.map((entry, i) => (
                <PodiumRow
                  key={`${place}-${i}`}
                  place={place}
                  entry={entry}
                  index={index + i}
                />
              ))
            ) : (
              <PodiumRow
                key={`${place}-empty`}
                place={place}
                entry={null}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const { slug } = useParams();
  const { data: festival, notFound } = usePublicResource(
    slug ? `/public/${slug}/` : null,
  );
  const [tab, setTab] = useState(TABS[0].key);
  const { toast, showToast, dismiss } = useToast();

  if (notFound) return <PublicUnavailable />;

  const madrassaName = festival?.name ?? "—";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-[#171717] sm:pb-0">
      {festival && (
        <SeoHead
          rawTitle={`${madrassaName} | Results & Leaderboard`}
          description={`Every category result and event podium for ${madrassaName}'s Milad-un-Nabi festival, published live by the organizing committee.`}
          path={`/${slug}/results`}
        />
      )}
      <MadrassaNavbar />

      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-white to-slate-100 dark:border-white/10 dark:bg-[#171717] dark:bg-none">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#21F1A8]/15 blur-[100px] dark:bg-[#21F1A8]/15"
          aria-hidden="true"
        />
        <div className="rosette-field pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" />
        <div className="relative mx-auto max-w-6xl px-6 py-12">
          <h1 className="animate-fade-up font-display text-3xl font-semibold text-[#171717] dark:text-white sm:text-4xl">
            Results
          </h1>
          <p className="animate-fade-up animate-fade-up-1 mt-2 max-w-lg text-sm text-neutral-600 dark:text-neutral-400">
            Browse every result, or drill into a single event's top three.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <div className={`inline-flex rounded-lg p-1 ${cardClass}`}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-2 text-xs font-semibold transition-all duration-300 ease-in-out ${focusRing} ${
                tab === t.key
                  ? "bg-[#21F1A8] text-[#171717] shadow"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-[#171717] dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "all" ? (
          <AllResultsTab slug={slug} showToast={showToast} />
        ) : tab === "event" ? (
          <EventResultsTab slug={slug} />
        ) : (
          <StandingsTab slug={slug} />
        )}
      </main>
      <MadrassaFooter madrassaName={madrassaName} />
      <Toast toast={toast} onDismiss={dismiss} />
    </div>
  );
}
