import { Link } from "react-router-dom";
import PublicNavbar from "./PublicNavbar.jsx";
import PublicFooter from "./PublicFooter.jsx";

export default function PublicUnavailable() {
  return (
    <div className="flex min-h-screen flex-col bg-[#171717] font-['Manrope',sans-serif]">
      <PublicNavbar />

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 text-white/[0.03]"
        >
          <path
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L14.71 3.86a2 2 0 0 0-3.42 0Z"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #21F1A8 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className="rounded-full border border-[#21F1A8]/20 bg-[#21F1A8]/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#21F1A8]">
            Page unavailable
          </span>

          <h1 className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            This festival page isn&rsquo;t available
          </h1>

          <p className="max-w-sm text-sm leading-relaxed text-white/50">
            The link may be mistyped, or this madrassa&rsquo;s festival page
            isn&rsquo;t currently active. Double-check the link with the
            organizing committee.
          </p>

          <Link
            to="/"
            className="group mt-4 inline-flex items-center gap-2 rounded-xl bg-[#21F1A8] px-6 py-3 text-sm font-semibold text-[#0A0A0A] shadow-[0_0_25px_-5px_#21F1A8] transition hover:shadow-[0_0_35px_-2px_#21F1A8] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717]"
          >
            Back to home
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
