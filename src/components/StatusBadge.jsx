const styles = {
  upcoming:
    "bg-neutral-100 text-neutral-600 dark:bg-white/10 dark:text-neutral-300",
  ongoing:
    "bg-[#21F1A8] text-[#171717] shadow-sm shadow-[#21F1A8]/40 dark:shadow-[#21F1A8]/30",
  paused:
    "border border-neutral-300 bg-neutral-50 text-neutral-600 dark:border-white/20 dark:bg-white/5 dark:text-neutral-300",
  completed: "bg-[#21F1A8]/10 text-[#0f9c74] dark:text-[#21F1A8]",
};

const labels = {
  upcoming: "Upcoming",
  ongoing: "Ongoing",
  paused: "Paused",
  completed: "Completed",
};

export default function StatusBadge({ status, isCustom = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all duration-300 ease-in-out ${styles[status] ?? styles.upcoming}`}
    >
      {status === "ongoing" && !isCustom && (
        <span className="h-1.5 w-1.5 rounded-full bg-[#171717] animate-pulse-live" />
      )}
      {labels[status] ?? status}
    </span>
  );
}
