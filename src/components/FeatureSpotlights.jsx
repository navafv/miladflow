const spotlights = [
  {
    tag: "For the main hall",
    title: "The Live TV Dashboard",
    hook: "Put the whole hall on the same page — literally.",
    desc: 'Cast a beautiful, real-time schedule and leaderboard straight onto the main hall screen. Parents stop asking "what\u2019s next?" and start watching. Every placement, every point, updates the moment your team confirms it \u2014 no refreshing, no announcements lost in the noise.',
    imageLight: "/screenshots/tv-dashboard-light.png",
    imageDark: "/screenshots/tv-dashboard-dark.png",
    alt: "Milad Flow live TV dashboard showing a real-time leaderboard and upcoming event countdown",
  },
  {
    tag: "For registration day",
    title: "The Bulk Registration Matrix & Rule Engine",
    hook: "Register hundreds of students without a single mistake.",
    desc: "Build your event rules once \u2014 per age category, per gender, per stage or off-stage limits \u2014 and let the system enforce them for you. Drop your whole roster into one matrix, register everyone in minutes, and let Milad Flow quietly reject anything that breaks your own rules before it becomes a problem.",
    imageLight: "/screenshots/registration-matrix-light.png",
    imageDark: "/screenshots/registration-matrix-dark.png",
    alt: "Milad Flow bulk registration matrix showing students against events with rule-based limits enforced",
  },
  {
    tag: "For results day",
    title: "Automated Scoring & Shareable Posters",
    hook: "Results the instant they happen. Keepsakes in seconds.",
    desc: "Record a placement and watch the leaderboard recalculate itself \u2014 no mental math, no manual tallying, no disputes. Then generate elegant, branded posters and QR-coded student ID cards that teams and parents can share instantly, turning every win into a memory worth keeping.",
    imageLight: "/screenshots/results-poster-light.png",
    imageDark: "/screenshots/results-poster-dark.png",
    alt: "Milad Flow auto-generated student achievement poster with QR code, ready to share",
  },
];

function SpotlightRow({ item, index }) {
  const reversed = index % 2 === 1;
  return (
    <div
      className={`grid items-center gap-8 md:grid-cols-2 md:gap-14 ${reversed ? "md:[&>*:first-child]:order-2" : ""}`}
    >
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
          {item.tag}
        </span>
        <h3 className="mt-4 font-display text-3xl font-semibold leading-tight text-[#171717] dark:text-white">
          {item.title}
        </h3>
        <p className="mt-3 text-lg font-semibold text-[#0f9c74] dark:text-[#21F1A8]">
          {item.hook}
        </p>
        <p className="mt-3 max-w-md text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
          {item.desc}
        </p>
      </div>

      <div className="relative">
        <div
          className="absolute -inset-4 rounded-3xl bg-[#21F1A8]/15 blur-2xl"
          aria-hidden="true"
        />
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-xl shadow-black/5 dark:border-white/10 dark:bg-[#262626] dark:shadow-black/40">
          <img
            src={item.imageLight}
            alt={item.alt}
            loading="lazy"
            className="block aspect-[16/10] w-full object-cover object-top dark:hidden"
          />
          <img
            src={item.imageDark}
            alt={item.alt}
            loading="lazy"
            className="hidden aspect-[16/10] w-full object-cover object-top dark:block"
          />
        </div>
      </div>
    </div>
  );
}

export default function FeatureSpotlights() {
  return (
    <section
      id="features"
      className="border-t border-neutral-200 bg-neutral-50 dark:border-white/10 dark:bg-[#171717]"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
            The big three
          </span>
          <h2 className="mt-4 font-display text-4xl font-semibold text-[#171717] dark:text-white">
            The features your committee will actually feel.
          </h2>
        </div>

        <div className="mt-16 space-y-20">
          {spotlights.map((item, i) => (
            <SpotlightRow key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
