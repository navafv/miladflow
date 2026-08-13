import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

const ACTUAL_VALUE = "\u20b92,499";
const OFFER_PRICE = "\u20b9999";
const OFFER_LABEL = "Introductory launch offer";

const planFeatures = [
  "Unlimited students & team registrations",
  "Unlimited events, categories & rules",
  "Live, filterable public results page",
  "Auto-generated student achievement posters",
  "Live schedule board for stage & category",
  "Bulk student import via Excel/CSV",
  "Custom madrassa slug & branded public page",
  "Committee admin login & settings",
];

const roiStats = [
  { value: "15+ hrs", label: "saved vs. spreadsheets & printouts" },
  { value: "0", label: "pages of paperwork to print or file" },
  { value: "1 link", label: "every parent needs, on any phone" },
];

const reasons = [
  {
    title: "Built for committees, not enterprises",
    body: "No seat limits, no per-student fees — one price covers your whole festival team.",
  },
  {
    title: "Live the moment results are announced",
    body: "Parents refresh a public page instead of calling the madrassa office.",
  },
  {
    title: "Set up in an afternoon",
    body: "Import your existing student list, add categories, and you\u2019re ready before rehearsals start.",
  },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#171717]";

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-[#171717]"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:max-w-none lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
              One simple plan
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold text-[#171717] dark:text-white sm:text-4xl">
              One subscription. Every feature.
            </h2>
            <p className="mt-3 max-w-md text-base text-neutral-600 dark:text-neutral-400 lg:mx-0 mx-auto">
              No confusing tiers or per-student pricing — one flat rate for one
              Madrassa&rsquo;s Milad-e-Nabi festival.
            </p>

            <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-4 text-center lg:mx-0 lg:max-w-md lg:text-left">
              {roiStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-neutral-200 bg-white px-3 py-4 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-none"
                >
                  <p className="font-display text-2xl font-semibold text-[#0f9c74] dark:text-[#21F1A8]">
                    {s.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-tight text-neutral-500 dark:text-neutral-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-md space-y-5 text-left lg:mx-0">
              {reasons.map((r) => (
                <div key={r.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#21F1A8]/15 ring-1 ring-[#21F1A8]/30">
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="h-3 w-3 text-[#0f9c74] dark:text-[#21F1A8]"
                    >
                      <path
                        d="M4 10.5 8 14.5 16 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#171717] dark:text-white">
                      {r.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {r.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-10 max-w-md border-t border-neutral-200 pt-6 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-500 lg:mx-0">
              No setup fees, no lock-in. Committees can cancel anytime between
              festivals.
            </p>
          </div>

          <div className="relative mx-auto mt-14 max-w-lg lg:mx-0 lg:mt-0 lg:ml-auto">
            <div
              className="absolute -inset-6 rounded-[2.5rem] bg-[#21F1A8]/25 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-3xl border border-t-0 border-[#21F1A8]/30 bg-white p-8 pt-9 text-center text-[#171717] shadow-2xl shadow-black/10 ring-1 ring-[#21F1A8]/20 dark:bg-[#171717] dark:text-white dark:shadow-black/40 dark:ring-[#21F1A8]/10 dark:shadow-[0_0_80px_-12px_rgba(33,241,168,0.45)] sm:p-10 sm:pt-11">
              <div
                className="absolute inset-x-0 top-0 h-1.5 bg-[#21F1A8] shadow-[0_0_20px_#21F1A8]"
                aria-hidden="true"
              />

              <div
                className="rosette-field pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[#21F1A8]/20 blur-3xl dark:bg-[#21F1A8]/20"
                aria-hidden="true"
              />

              <span className="relative inline-flex items-center gap-1.5 rounded-full border border-[#21F1A8]/60 bg-[#21F1A8] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#171717] shadow-[0_0_15px_#21F1A8]">
                <Logo className="h-3 w-3" />
                {OFFER_LABEL}
              </span>

              <h3 className="relative mt-5 font-display text-2xl font-semibold text-[#171717] dark:text-white">
                Madrassa Plan
              </h3>
              <p className="relative mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Everything your committee needs — one flat price, no per-student
                fees.
              </p>

              <div className="relative mt-8 flex flex-col items-center gap-1">
                <span className="flex items-baseline gap-2 text-sm text-neutral-500 dark:text-neutral-500">
                  Actual value
                  <span className="font-display text-xl font-semibold text-neutral-500 line-through decoration-2 dark:text-neutral-500">
                    {ACTUAL_VALUE}
                  </span>
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-6xl font-semibold tracking-tight text-[#0f9c74] [text-shadow:0_0_30px_rgba(15,156,116,0.25)] dark:text-[#21F1A8] dark:[text-shadow:0_0_40px_rgba(33,241,168,0.5)]">
                    {OFFER_PRICE}
                  </span>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    per Milad-e-Nabi
                  </span>
                </div>
                <p className="relative mt-1 max-w-xs text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  Valid for one complete Milad-e-Nabi festival for a single
                  Madrassa.
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#171717]/5 px-3 py-1 text-xs font-bold text-[#171717] ring-1 ring-[#171717]/10 dark:bg-white/10 dark:text-white dark:ring-white/20">
                  Save 60% — introductory pricing, limited time
                </span>
              </div>

              <div className="relative mx-auto mt-8 h-px w-full max-w-xs bg-gradient-to-r from-transparent via-[#21F1A8]/50 to-transparent" />

              <ul className="relative mt-8 space-y-3 text-left text-sm">
                {planFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-3">
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
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                className={`relative mt-9 block w-full rounded-full bg-[#21F1A8] px-5 py-3.5 text-sm font-bold text-[#171717] shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_25px_#21F1A8] ${focusRing}`}
              >
                Register Your Madrassa for {OFFER_PRICE}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
