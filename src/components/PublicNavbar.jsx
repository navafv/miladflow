import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import Logo from "./Logo.jsx";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#contact", label: "Contact" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#171717] transition-all duration-200";

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 dark:bg-[#171717]/80 dark:backdrop-blur-md ${
        scrolled
          ? "border-b border-neutral-200/70 bg-white/80 shadow-sm shadow-black/5 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:shadow-black/40"
          : "border-b border-transparent bg-white dark:border-white/5"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          to="/"
          className={`flex items-center gap-2 rounded-md text-[#171717] dark:text-white ${focusRing}`}
          onClick={() => setMenuOpen(false)}
        >
          <Logo className="h-6 w-6" />
          <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Milad Flow
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-400 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`relative rounded-md pb-1 transition-all duration-200 hover:text-[#171717] dark:hover:text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#21F1A8] after:transition-all after:duration-200 hover:after:w-full ${focusRing}`}
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/demo-festival"
            className={`relative rounded-md pb-1 transition-all duration-200 hover:text-[#171717] dark:hover:text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[#21F1A8] after:transition-all after:duration-200 hover:after:w-full ${focusRing}`}
          >
            Live demo
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            to="/login"
            className={`rounded-md px-2 py-1.5 text-sm font-semibold text-[#171717] transition-all duration-200 hover:text-[#171717]/70 dark:text-white dark:hover:text-[#21F1A8] ${focusRing}`}
          >
            Log In
          </Link>
          <Link
            to="/signup"
            className={`rounded-full bg-[#21F1A8] px-4 py-2 text-sm font-bold text-[#171717] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_15px_#21F1A8] active:translate-y-0 ${focusRing}`}
          >
            Sign Up
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className={`flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-[#171717] transition-all duration-200 hover:border-[#21F1A8] hover:bg-neutral-100 dark:border-white/10 dark:text-white dark:hover:border-[#21F1A8] dark:hover:bg-white/5 md:hidden ${focusRing}`}
          >
            <span className="relative block h-3.5 w-4">
              <span
                className={`absolute left-0 top-0 block h-0.5 w-4 bg-current transition-transform duration-200 ${menuOpen ? "translate-y-[6px] rotate-45" : ""}`}
              />
              <span
                className={`absolute left-0 top-[6px] block h-0.5 w-4 bg-current transition-opacity duration-200 ${menuOpen ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 top-[12px] block h-0.5 w-4 bg-current transition-transform duration-200 ${menuOpen ? "-translate-y-[6px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-neutral-200 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#171717]/95 md:hidden">
          <nav className="flex flex-col gap-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-2 py-2.5 transition-all duration-200 hover:bg-neutral-100 hover:text-[#171717] dark:hover:bg-white/5 dark:hover:text-white ${focusRing}`}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/demo-festival"
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-2 py-2.5 transition-all duration-200 hover:bg-neutral-100 hover:text-[#171717] dark:hover:bg-white/5 dark:hover:text-white ${focusRing}`}
            >
              Live demo
            </Link>
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-white/10">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg border border-neutral-200 px-4 py-2.5 text-center text-sm font-semibold text-[#171717] transition-all duration-200 hover:border-[#21F1A8] hover:bg-neutral-50 dark:border-white/10 dark:text-white dark:hover:border-[#21F1A8] dark:hover:bg-white/5 ${focusRing}`}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              onClick={() => setMenuOpen(false)}
              className={`rounded-full bg-[#21F1A8] px-4 py-2.5 text-center text-sm font-bold text-[#171717] shadow-sm transition-all duration-200 hover:shadow-[0_0_15px_#21F1A8] ${focusRing}`}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
