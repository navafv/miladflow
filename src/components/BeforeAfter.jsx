const oldWay = [
  "Three spreadsheets that don\u2019t match each other",
  "A WhatsApp group with 40 unread messages and one very confused team leader",
  "A student registered for six events he wasn\u2019t allowed to enter",
  "A results announcement that turns into a debate on stage",
];

const newWay = [
  "One workspace. One source of truth.",
  "Registration limits that enforce themselves automatically",
  "A schedule that updates live for every volunteer",
  "Results that appear on screen the moment they\u2019re recorded",
];

function ListCard({ eyebrow, title, items, variant }) {
  const isOld = variant === "old";
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-7 sm:p-8 ${
        isOld
          ? "border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-[#1f1f1f]"
          : "border-[#21F1A8]/30 bg-white shadow-xl shadow-black/5 dark:border-[#21F1A8]/20 dark:bg-[#262626] dark:shadow-[0_0_40px_-14px_rgba(33,241,168,0.35)]"
      }`}
    >
      {!isOld && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#21F1A8]/20 blur-3xl"
          aria-hidden="true"
        />
      )}
      <span
        className={`relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] ${
          isOld
            ? "bg-neutral-200/70 text-neutral-500 dark:bg-white/10 dark:text-neutral-400"
            : "border border-[#21F1A8]/30 bg-[#21F1A8]/10 text-[#171717] dark:text-[#21F1A8]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${isOld ? "bg-neutral-400" : "bg-[#21F1A8]"}`}
        />
        {eyebrow}
      </span>
      <h3 className="relative mt-4 font-display text-2xl font-semibold text-[#171717] dark:text-white">
        {title}
      </h3>
      <ul className="relative mt-5 space-y-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400"
          >
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                isOld
                  ? "bg-neutral-200 dark:bg-white/10"
                  : "bg-[#21F1A8]/15 ring-1 ring-[#21F1A8]/40"
              }`}
              aria-hidden="true"
            >
              {isOld ? (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className="h-3 w-3 text-neutral-400"
                >
                  <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  className="h-3 w-3 text-[#0f9c74] dark:text-[#21F1A8]"
                >
                  <path
                    d="M4 10.5 8 14.5 16 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              className={isOld ? "" : "text-neutral-700 dark:text-neutral-300"}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BeforeAfter() {
  return (
    <section className="border-t border-neutral-200 bg-white dark:border-white/10 dark:bg-[#171717]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
            You didn&rsquo;t sign up for this
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold text-[#171717] dark:text-white">
            You signed up to honour the Prophet&rsquo;s ﷺ birth — not to referee
            arguments.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <ListCard
            eyebrow="The old way"
            title="Chaos, quietly tolerated"
            items={oldWay}
            variant="old"
          />
          <ListCard
            eyebrow="The Milad Flow way"
            title="Calm, by design"
            items={newWay}
            variant="new"
          />
        </div>

        <p className="mx-auto mt-12 max-w-xl text-center font-display text-xl font-semibold italic text-[#171717] dark:text-white">
          Rooted in tradition. Run in real time.
        </p>
      </div>
    </section>
  );
}
