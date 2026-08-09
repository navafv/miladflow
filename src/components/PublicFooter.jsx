import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#171717] rounded-sm transition-all duration-200";

const linkClass = `text-neutral-500 dark:text-neutral-400 transition-all duration-200 hover:text-[#0f9c74] dark:hover:text-[#21F1A8] hover:translate-x-0.5 inline-block ${focusRing}`;

const iconButtonClass = `flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#21F1A8]/60 hover:text-[#0f9c74] hover:shadow-[0_0_15px_-4px_#21F1A8] dark:border-white/10 dark:text-neutral-400 dark:hover:text-[#21F1A8] ${focusRing}`;

export default function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-slate-50 text-neutral-600 dark:border-white/10 dark:bg-[#171717] dark:text-neutral-300">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2">
              <Logo className="h-5 w-5" />
              <span className="font-display text-xl font-semibold text-[#171717] dark:text-white">
                Milad Flow
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              Built for madrassa committees running Milad-un-Nabi festivals —
              from registration to the final prize list.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="mailto:whyrowdev@gmail.com"
                className={iconButtonClass}
                aria-label="Email us"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                >
                  <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
                  <path
                    d="M3 5.5l7 5.5 7-5.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="tel:+919995061050"
                className={iconButtonClass}
                aria-label="Call us"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                >
                  <path
                    d="M4 3.5h3l1.2 3.4L6.6 8.4a9 9 0 0 0 5 5l1.5-1.6L16.5 13v3a1.2 1.2 0 0 1-1.3 1.2A13 13 0 0 1 3 4.8 1.2 1.2 0 0 1 4 3.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 md:col-span-8">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                Product
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a href="/#features" className={linkClass}>
                    Features
                  </a>
                </li>
                <li>
                  <a href="/#pricing" className={linkClass}>
                    Pricing
                  </a>
                </li>
                <li>
                  <Link to="/demo-festival" className={linkClass}>
                    Live demo
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                Committee
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link to="/login" className={linkClass}>
                    Admin login
                  </Link>
                </li>
                <li>
                  <a href="/#contact" className={linkClass}>
                    Support
                  </a>
                </li>
                <li>
                  <Link to="/privacy" className={linkClass}>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className={linkClass}>
                    Terms &amp; Conditions
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                Contact
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <li>
                  <a href="mailto:whyrowdev@gmail.com" className={linkClass}>
                    whyrowdev@gmail.com
                  </a>
                </li>
                <li>
                  <a href="tel:+919995061050" className={linkClass}>
                    +91 99950 61050
                  </a>
                </li>
                <li>Kannur, Kerala, India</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-neutral-200 pt-8 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Milad Flow. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link to="/privacy" className={linkClass}>
              Privacy
            </Link>
            <Link to="/terms" className={linkClass}>
              Terms
            </Link>
            <p className="hidden text-neutral-500 dark:text-neutral-500 sm:block">
              Developed by{" "}
              <a
                href="https://navaf.vercel.app"
                className="font-bold"
                target="_blank"
                rel="noopener noreferrer"
              >
                Navaf
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
