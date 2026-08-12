import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SeoHead from "../components/SeoHead.jsx";
import MadrassaNavbar from "../components/MadrassaNavbar.jsx";
import MadrassaFooter from "../components/MadrassaFooter.jsx";
import PublicUnavailable from "../components/PublicUnavailable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { usePublicResource } from "../lib/usePublicResource.js";
import { formatTime, dateKey, formatDateHeading } from "../lib/formatTime.js";

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

function normalizeScheduleItem(row) {
  return {
    id: row.id,
    scheduledTime: row.scheduled_time,
    time: formatTime(row.scheduled_time),
    name: row.title,
    categoryTag: formatCategoryTag(row.category_name, row.gender),
    venue: row.venue_name,
    status: row.status ?? "upcoming",
    roundLabel: row.round_label ?? "",
    isCustom: row.is_custom === true,
  };
}

function groupByDate(items) {
  const buckets = new Map();
  for (const item of items) {
    const key = dateKey(item.scheduledTime);
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        heading: formatDateHeading(item.scheduledTime),
        items: [],
      });
    }
    buckets.get(key).items.push(item);
  }
  return Array.from(buckets.values());
}

const ALL_STAGES = "All";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-offset-[#171717]";

const cardClass =
  "rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-none";

function SkeletonItem() {
  return (
    <div className="animate-pulse rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-none">
      <div className="h-3.5 w-2/5 rounded-full bg-neutral-200 dark:bg-white/10" />
      <div className="mt-2.5 h-2.5 w-1/4 rounded-full bg-neutral-200 dark:bg-white/10" />
    </div>
  );
}

export default function SchedulePage() {
  const { slug } = useParams();
  const { data: festival, notFound: festivalNotFound } = usePublicResource(
    slug ? `/public/${slug}/` : null,
  );
  const {
    data: scheduleResponse,
    loading,
    notFound: scheduleNotFound,
    error,
  } = usePublicResource(slug ? `/public/${slug}/schedule/` : null);

  const rawItems = Array.isArray(scheduleResponse) ? scheduleResponse : [];
  const items = useMemo(() => rawItems.map(normalizeScheduleItem), [rawItems]);

  const [venueFilter, setVenueFilter] = useState(ALL_STAGES);
  const venues = useMemo(() => {
    const set = new Set();
    items.forEach((i) => {
      if (i.venue) set.add(i.venue);
    });
    return Array.from(set).sort();
  }, [items]);

  if (festivalNotFound || scheduleNotFound) return <PublicUnavailable />;

  const filteredItems =
    venueFilter === ALL_STAGES
      ? items
      : items.filter((i) => i.venue === venueFilter);
  const dayGroups = groupByDate(filteredItems);
  const festivalYear = festival?.festival_year ?? festival?.festivalYear ?? "";
  const madrassaName = festival?.name ?? "—";

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-[#171717] sm:pb-0">
      {festival && (
        <SeoHead
          rawTitle={`${madrassaName} | Live Schedule`}
          description={`Full event-by-event schedule for ${madrassaName}'s Milad-un-Nabi festival${festivalYear ? ` ${festivalYear}` : ""}, updated live as events wrap up.`}
          path={`/${slug}/schedule`}
        />
      )}
      <MadrassaNavbar />

      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-white to-slate-100 dark:border-white/10 dark:bg-[#171717] dark:bg-none">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#21F1A8]/15 blur-[100px] dark:bg-[#21F1A8]/15"
          aria-hidden="true"
        />
        <div className="rosette-field pointer-events-none absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" />
        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.25em] text-[#0f9c74] dark:text-[#21F1A8]">
            {madrassaName}
          </p>
          <h1 className="animate-fade-up animate-fade-up-1 mt-1 font-display text-3xl font-semibold text-[#171717] dark:text-white sm:text-4xl">
            Full schedule
          </h1>
          <p className="animate-fade-up animate-fade-up-2 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {festivalYear} · Every event across the festival, updated live as
            each one wraps up.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {error && (
          <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 shadow-sm dark:border-red-400/40 dark:bg-red-400/10 dark:text-red-300 dark:shadow-none">
            {error}
          </p>
        )}

        {venues.length > 1 && (
          <div className={`mb-6 grid gap-3 p-4 sm:max-w-xs ${cardClass}`}>
            <label className="flex flex-col gap-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Stage
              <select
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className={`rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-[#171717] transition-all duration-200 dark:border-white/10 dark:bg-[#171717] dark:text-white ${focusRing}`}
              >
                <option value={ALL_STAGES}>All Stages</option>
                {venues.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </div>
        ) : dayGroups.length === 0 ? (
          <p className="rounded-2xl border border-neutral-200 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:text-neutral-400 dark:shadow-none">
            {venueFilter === ALL_STAGES
              ? "Nothing scheduled yet."
              : `Nothing scheduled at ${venueFilter} yet.`}
          </p>
        ) : (
          <div className="space-y-8">
            {dayGroups.map((group) => (
              <section key={group.key}>
                <div className="sticky top-[57px] z-10 -mx-4 mb-3 bg-slate-50/95 px-4 py-2 backdrop-blur-sm dark:bg-[#171717]/95 sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
                  <h2 className="font-display text-base font-semibold text-[#171717] dark:text-white sm:text-lg">
                    {group.heading}
                  </h2>
                </div>

                <ol className="relative space-y-3">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-2 left-[74px] top-2 hidden w-px bg-gradient-to-b from-[#21F1A8]/40 via-neutral-200 to-transparent dark:via-white/10 sm:block"
                  />
                  {group.items.map((s, i) => {
                    const isLive = s.status === "ongoing";
                    return (
                      <li
                        key={s.id}
                        className={`animate-stagger group relative flex items-center gap-4 rounded-2xl border px-4 py-4 transition-all duration-300 ease-in-out hover:-translate-y-1 sm:gap-5 sm:px-5 ${
                          isLive
                            ? "border-[#21F1A8] bg-[#21F1A8]/5 shadow-lg shadow-[#21F1A8]/10 dark:bg-[#21F1A8]/10 dark:shadow-none"
                            : "border-neutral-200 bg-white shadow-sm hover:border-[#21F1A8]/60 dark:border-white/10 dark:bg-[#262626] dark:shadow-none dark:hover:border-[#21F1A8]/50"
                        }`}
                        style={{ "--stagger-index": i }}
                      >
                        {isLive && (
                          <span className="shimmer-sweep rounded-2xl" />
                        )}
                        <span className="relative z-10 w-16 shrink-0 font-mono text-sm font-semibold text-[#171717] dark:text-[#21F1A8] sm:w-20">
                          {s.time}
                        </span>
                        <div className="relative z-10 min-w-0 flex-1">
                          <p
                            className={`font-semibold leading-snug ${
                              s.isCustom
                                ? "text-neutral-500 dark:text-neutral-400"
                                : "text-[#171717] dark:text-white"
                            }`}
                          >
                            {s.name}
                            {s.categoryTag && (
                              <span className="ml-1.5 text-sm font-medium text-slate-500 dark:text-neutral-400">
                                {s.categoryTag}
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                            {s.venue}
                            {s.roundLabel ? ` · ${s.roundLabel}` : ""}
                          </p>
                        </div>
                        <span className="relative z-10 shrink-0">
                          <StatusBadge
                            status={s.status}
                            isCustom={s.isCustom}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        )}
      </main>
      <MadrassaFooter madrassaName={madrassaName} />
    </div>
  );
}
