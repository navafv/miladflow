import { Link } from "react-router-dom";
import { recentResults } from "../lib/mockData.js";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-white dark:border-white/10 dark:bg-[#171717]">
      <div
        className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#21F1A8]/20 blur-[100px] dark:bg-[#21F1A8]/10"
        aria-hidden="true"
      />
      <div className="rosette-field absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-2 md:items-center md:py-28">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
            For Madrassa Milad-un-Nabi Committees
          </span>

          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-[#171717] dark:text-white md:text-6xl">
            Every Milad, perfectly orchestrated.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
            Milad Flow is the all-in-one platform for Madrassa committees —
            manage registrations, enforce your own rules automatically, run a
            live schedule, and publish results the instant they happen.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/signup"
              className="rounded-full bg-[#21F1A8] px-6 py-3 text-sm font-bold text-[#171717] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_25px_#21F1A8]"
            >
              Start Your Workspace
            </Link>
            <Link
              to="/demo-festival"
              className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold text-[#171717] transition duration-200 hover:-translate-y-0.5 hover:border-[#21F1A8] hover:text-[#171717] dark:border-white/15 dark:text-white dark:hover:border-[#21F1A8]"
            >
              See It in Action →
            </Link>
          </div>

          <p className="mt-6 text-xs italic text-neutral-500 dark:text-neutral-500">
            Rooted in tradition. Run in real time.
          </p>
        </div>

        <div className="animate-fade-up animate-fade-up-2 relative">
          <div
            className="absolute -inset-4 rounded-3xl bg-[#21F1A8]/20 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-black/5 dark:border-white/10 dark:bg-[#262626] dark:shadow-black/40">
            <div className="flex items-center justify-between rounded-t-2xl bg-[#171717] px-5 py-3">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white">
                <span className="h-2 w-2 rounded-full bg-[#21F1A8] animate-pulse-live" />
                Live results feed
              </span>
              <span className="font-mono text-[11px] text-white/50">
                miladflow.vercel.app/demo-festival
              </span>
            </div>
            <ul className="divide-y divide-neutral-100 dark:divide-white/10">
              {recentResults.slice(0, 4).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#171717] dark:text-white">
                      {r.event}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {r.category} · {r.team}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#21F1A8]/15 px-2.5 py-1 text-xs font-bold font-mono text-[#0f9c74] dark:text-[#21F1A8]">
                    1st
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
