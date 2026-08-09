export default function OngoingEventBanner({ current, next }) {
  if (!current) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-5 text-center text-sm text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:text-neutral-400 dark:shadow-none">
        No event on stage right now. Check the schedule for what's next.
      </div>
    );
  }

  const isPaused = current.status === "paused";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171717] text-white shadow-lg shadow-black/20 dark:shadow-none">
      {!isPaused && <span className="shimmer-sweep rounded-2xl" />}
      <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
              isPaused
                ? "bg-neutral-400"
                : "bg-[#21F1A8] shadow-[0_0_10px_#21F1A8] animate-pulse-live"
            }`}
          />
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-[0.2em] ${isPaused ? "text-neutral-400" : "text-[#21F1A8]"}`}
            >
              {isPaused ? "Paused" : "On stage now"}
            </p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-white">
              {current.name}
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              {current.venue}
              {current.time ? ` · ${current.time}` : ""}
            </p>
          </div>
        </div>
        {next && (
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm sm:text-right">
            <p className="text-neutral-400">Up next</p>
            <p className="font-semibold text-white">{next.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
