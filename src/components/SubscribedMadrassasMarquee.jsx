import { Link } from "react-router-dom";
import { usePublicResource } from "../lib/usePublicResource.js";
import Logo from "./Logo.jsx";

const SKELETON_COUNT = 8;

export default function SubscribedMadrassasMarquee() {
  const { data, loading, error } = usePublicResource("/public/madrassas/");
  const madrassas = Array.isArray(data) ? data : [];

  if (!loading && (error || madrassas.length === 0)) return null;

  const track = loading
    ? Array.from({ length: SKELETON_COUNT }, (_, i) => ({
        slug: `skeleton-${i}`,
      }))
    : [...madrassas, ...madrassas];

  return (
    <section className="border-t border-neutral-200 bg-white py-14 dark:border-white/10 dark:bg-[#171717]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500">
          Trusted by madrassa committees across Kerala
        </p>
      </div>
      <div className="marquee-mask relative mt-7 overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-10">
          {track.map((m, i) =>
            loading ? (
              <div
                key={`${m.slug}-${i}`}
                aria-hidden="true"
                className="h-11 w-40 shrink-0 animate-pulse rounded-full border border-neutral-200 bg-neutral-100 dark:border-white/10 dark:bg-white/5"
              />
            ) : (
              <Link
                key={`${m.slug}-${i}`}
                to={`/${m.slug}`}
                className="flex shrink-0 items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-5 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-[#21F1A8] hover:shadow-[0_0_15px_-4px_#21F1A8] dark:border-white/10 dark:bg-[#262626]"
              >
                <Logo className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap text-sm font-semibold text-[#171717] dark:text-white">
                  {m.name}
                </span>
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
