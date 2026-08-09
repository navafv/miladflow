import { useEffect, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#171717] transition-all duration-200";

const ICONS = {
  home: (active) => (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 10.5 12 3l9 7.5" />
      <path d={active ? "M5 9.5V21h14V9.5" : "M5 9.5V21h5v-6h4v6h5V9.5"} />
    </svg>
  ),
  schedule: () => (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3.5" y="4.5" width="17" height="16" rx="3" />
      <path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" />
      <path d="M8 13.5h.01M12 13.5h.01M16 13.5h.01M8 17h.01M12 17h.01" />
    </svg>
  ),
  results: () => (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 21h8M12 17v4" />
      <path d="M6 4h12v3a6 6 0 0 1-12 0V4Z" />
      <path d="M6 5H4a2 2 0 0 0 2 4M18 5h2a2 2 0 0 1-2 4" />
    </svg>
  ),
  tv: () => (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      strokeWidth="2"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M8 3l4 3 4-3M8 22h8" />
    </svg>
  ),
};

function useNavItems(slug) {
  return [
    { to: `/${slug}`, end: true, label: "Home", icon: "home" },
    { to: `/${slug}/schedule`, label: "Schedule", icon: "schedule" },
    { to: `/${slug}/results`, label: "Results", icon: "results" },
    { to: `/${slug}/tv`, label: "TV", icon: "tv" },
  ];
}

export default function MadrassaNavbar() {
  const { slug } = useParams();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = useNavItems(slug);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [slug]);

  const desktopLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-in-out ${focusRing} ${
      isActive
        ? "bg-[#21F1A8] text-[#171717] shadow-sm shadow-black/10"
        : "text-neutral-600 hover:bg-neutral-100 hover:text-[#171717] dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
    }`;

  return (
    <>
      <header
        className={`sticky top-0 z-40 bg-white transition-all duration-300 dark:bg-[#171717]/80 dark:backdrop-blur-md ${
          scrolled
            ? "border-b border-neutral-200/80 bg-white/80 shadow-sm shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:shadow-black/40"
            : "border-b border-neutral-200 dark:border-white/5"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link
            to="/"
            className={`flex items-center gap-2 rounded-md text-[#171717] dark:text-white ${focusRing}`}
          >
            <Logo className="h-7 w-7 sm:h-6 sm:w-6" />
            <span className="font-display text-base font-semibold tracking-tight sm:text-lg">
              MiladFlow
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 sm:flex">
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={desktopLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-1.5 sm:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-all duration-200 dark:border-white/10 dark:text-neutral-200 ${focusRing}`}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                {menuOpen ? (
                  <path d="M6 6l12 12M18 6L6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-neutral-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#171717] sm:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#21F1A8] text-[#171717]"
                        : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5"
                    }`
                  }
                >
                  <span className="shrink-0">{ICONS[item.icon]()}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/95 sm:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition-all duration-200 ${focusRing} ${
                  isActive
                    ? "text-[#0f9c74] dark:text-[#21F1A8]"
                    : "text-neutral-500 dark:text-neutral-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-[#21F1A8]/15 text-[#0f9c74] dark:bg-[#21F1A8]/15 dark:text-[#21F1A8]"
                        : ""
                    }`}
                  >
                    {ICONS[item.icon](isActive)}
                  </span>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
