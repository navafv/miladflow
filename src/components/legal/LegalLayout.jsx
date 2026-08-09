import PublicNavbar from "../PublicNavbar.jsx";
import PublicFooter from "../PublicFooter.jsx";
import SeoHead from "../SeoHead.jsx";

export default function LegalLayout({
  eyebrow,
  title,
  intro,
  updatedLabel,
  sections,
  seoTitle,
  seoDescription,
  seoPath,
}) {
  return (
    <div className="min-h-screen bg-white text-[#171717] transition-colors dark:bg-[#171717] dark:text-white">
      <SeoHead title={seoTitle} description={seoDescription} path={seoPath} />
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#21F1A8]/30 bg-[#21F1A8]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[#171717] dark:text-[#21F1A8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]" />
            {eyebrow}
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-[#171717] dark:text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400">
            {intro}
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:text-neutral-400 dark:shadow-none">
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#21F1A8]"
              aria-hidden="true"
            />
            {updatedLabel}
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
          <aside className="hidden lg:block">
            <nav aria-label="Sections" className="sticky top-24">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-400">
                On this page
              </p>
              <ul className="mt-4 space-y-1 border-l border-neutral-200 text-sm dark:border-white/10">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block -ml-px border-l-2 border-transparent py-1.5 pl-4 text-neutral-500 transition-all duration-200 hover:border-[#21F1A8] hover:text-[#171717] dark:text-neutral-400 dark:hover:text-[#21F1A8]"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div
            className="prose prose-neutral min-w-0 max-w-none dark:prose-invert
              prose-headings:font-display prose-headings:font-semibold prose-headings:text-[#171717] dark:prose-headings:text-white
              prose-h2:text-2xl prose-h2:scroll-mt-24
              prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-neutral-600 dark:prose-p:text-neutral-300
              prose-li:text-[15px] prose-li:text-neutral-600 dark:prose-li:text-neutral-300
              prose-a:font-semibold prose-a:text-[#171717] prose-a:no-underline hover:prose-a:text-[#0f9c74] hover:prose-a:underline dark:prose-a:text-[#21F1A8] dark:hover:prose-a:text-[#21F1A8]/80
              prose-strong:text-[#171717] dark:prose-strong:text-white
              marker:text-[#21F1A8]
              divide-y divide-neutral-100 dark:divide-white/10"
          >
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={`scroll-mt-24 ${index > 0 ? "pt-10" : ""}`}
              >
                <h2>{section.title}</h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                  {section.list && (
                    <ul className="ml-1 list-disc space-y-1.5 pl-5">
                      {section.list.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}

            <div className="not-prose pt-10">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm dark:border-white/10 dark:bg-[#262626] dark:shadow-none sm:p-8">
                <h3 className="font-display text-xl font-semibold text-[#171717] dark:text-white">
                  Questions about this policy?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  Reach out any time — we're happy to walk through specifics for
                  your committee.
                </p>
                <a
                  href="mailto:whyrowdev@gmail.com"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#21F1A8] px-5 py-2.5 text-sm font-bold text-[#171717] transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_0_20px_#21F1A8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#262626]"
                >
                  whyrowdev@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
