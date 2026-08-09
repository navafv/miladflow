const coreFeatures = [
  {
    title: "Multi-Tenant Storefronts",
    desc: "Every madrassa gets its own dedicated public URL to showcase their festival, fully branded and live the moment the committee signs up.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.2 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.2-3.4-8.5S9.8 5.8 12 3.5Z" />
      </svg>
    ),
  },
  {
    title: "Advanced Rule Engine",
    desc: "Automatically enforce participation limits based on student categories, gender, and event types to prevent registration conflicts before they happen.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3.5 19 7v5c0 4.2-2.9 7.4-7 8.5-4.1-1.1-7-4.3-7-8.5V7l7-3.5Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Rapid Registration Matrix",
    desc: "A powerful spreadsheet-like grid for admins to bulk-register hundreds of students in seconds, not hours.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
        <path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17M15 3.5v17" />
      </svg>
    ),
  },
  {
    title: "Smart Scheduling",
    desc: "Generate and manage live itineraries with exact timings and venue assignments, kept in sync for volunteers and parents alike.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    ),
  },
  {
    title: "Live Leaderboards & Results",
    desc: "Real-time point tracking and team standings updated instantly as event results are published \u2014 no more waiting on a printed sheet.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 20V11M12 20V4M17 20v-7" />
        <path d="M4 20h16" />
      </svg>
    ),
  },
  {
    title: "Print-Ready ID Cards",
    desc: "Automatically generate A4-formatted, portrait student ID cards with scannable QR codes linking directly to their public profiles.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="2.5" width="14" height="19" rx="2" />
        <circle cx="10" cy="8.2" r="1.8" />
        <path d="M7 15.5c.6-1.6 1.8-2.4 3-2.4s2.4.8 3 2.4M14 7.2h3M14 9.6h3" />
      </svg>
    ),
  },
  {
    title: "Complete Roster Management",
    desc: "Centralized control over students, teams, event categories, and venues \u2014 one source of truth for the whole festival.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="9" cy="8" r="2.6" />
        <path d="M4 19c0-3 2.3-5 5-5s5 2 5 5" />
        <circle cx="17" cy="8.5" r="2" />
        <path d="M15.5 14.2c2.3.3 3.8 2 3.8 4.8" />
      </svg>
    ),
  },
  {
    title: "Secure Admin Dashboard",
    desc: "A fully responsive, dark-mode-ready control panel with strict data isolation between every madrassa on the platform.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3.5" y="4.5" width="17" height="12" rx="2" />
        <path d="M8.5 20.5h7M12 16.5v4" />
        <path d="M7.5 11.5 10 9l2 2 4.5-4.5" />
      </svg>
    ),
  },
];

function FeatureCard({ title, desc, icon, index }) {
  return (
    <div
      className={`animate-fade-up animate-fade-up-${Math.min((index % 4) + 1, 4)} group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#21F1A8] hover:shadow-xl hover:shadow-black/5 focus-within:-translate-y-1 focus-within:border-[#21F1A8] dark:border-white/10 dark:bg-[#262626] dark:hover:border-[#21F1A8] dark:hover:shadow-[0_0_25px_-6px_#21F1A8]`}
      tabIndex={0}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#21F1A8]/0 blur-2xl transition duration-300 group-hover:bg-[#21F1A8]/25 group-focus-within:bg-[#21F1A8]/25"
        aria-hidden="true"
      />
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-[#21F1A8]/10 text-[#171717] transition duration-300 group-hover:bg-[#21F1A8] group-hover:text-[#171717] dark:text-[#21F1A8] dark:group-hover:text-[#171717]">
        {icon}
      </div>
      <h3 className="relative mt-4 font-display text-xl font-semibold text-[#171717] dark:text-white">
        {title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
        {desc}
      </p>
    </div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl bg-white px-4 py-16 dark:bg-[#171717] sm:px-6 sm:py-24"
    >
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
          Built for the whole festival
        </span>
        <h2 className="mt-4 font-display text-4xl font-semibold text-[#171717] dark:text-white">
          Everything you need to run a flawless festival.
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          From the first registration to the last prize handed out \u2014 one
          platform, purpose-built for Madrassa Milad-un-Nabi festivals.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {coreFeatures.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>
    </section>
  );
}
