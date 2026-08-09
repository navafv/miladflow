const committeePoints = [
  "One branded workspace for your whole festival \u2014 teams, categories, events, rules, schedule, results",
  "Set your rules once and trust the system to hold the line",
  "No spreadsheets to reconcile, no printouts to chase",
];

const familyPoints = [
  "No app to download, no account to create \u2014 just tap and follow",
  "Live schedule and results from their own phone, always up to date",
  "Know how their child placed the moment it\u2019s announced",
];

function AudienceCard({ eyebrow, title, body, points, cta }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-black/20">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#21F1A8]/15 blur-3xl"
        aria-hidden="true"
      />
      <span className="relative inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
        {eyebrow}
      </span>
      <h3 className="relative mt-4 font-display text-2xl font-semibold text-[#171717] dark:text-white">
        {title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {body}
      </p>
      <ul className="relative mt-6 space-y-3">
        {points.map((p) => (
          <li
            key={p}
            className="flex items-start gap-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#21F1A8]/15 ring-1 ring-[#21F1A8]/40">
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
            </span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      {cta}
    </div>
  );
}

export default function AudienceSplit() {
  return (
    <section className="border-t border-neutral-200 bg-white dark:border-white/10 dark:bg-[#171717]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
            Built for everyone in the hall
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold text-[#171717] dark:text-white">
            Why they&rsquo;ll love it.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <AudienceCard
            eyebrow="For the committee"
            title="Finally, a Milad you can run without holding your breath."
            body="Your entire event lives in one branded workspace built just for your Madrassa. Set your rules once and trust the system to hold the line, so you can focus on the ceremony, not the spreadsheet."
            points={committeePoints}
          />
          <AudienceCard
            eyebrow="For parents & teams"
            title="No app to download. No account to create. Just tap and follow."
            body="Share one link, and every parent, guardian, and team leader can follow the live schedule and results from their own phone."
            points={familyPoints}
          />
        </div>
      </div>
    </section>
  );
}
