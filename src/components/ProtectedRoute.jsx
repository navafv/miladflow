import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/authStore.js";
import PendingActivationPage from "../pages/PendingActivationPage.jsx";

export default function ProtectedRoute({ children }) {
  const { authed, isHydrating, isSubscriptionActive } = useAuth();
  const location = useLocation();

  if (isHydrating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#171717] font-['Manrope',sans-serif]">
        <div className="relative flex flex-col items-center gap-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[80px]"
            style={{
              background:
                "radial-gradient(circle, #21F1A8 0%, transparent 70%)",
            }}
          />

          <div className="relative z-10 flex h-14 w-14 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#21F1A8]/20" />
            <span className="absolute inline-flex h-9 w-9 animate-ping rounded-full bg-[#21F1A8]/30 [animation-delay:150ms]" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#21F1A8] shadow-[0_0_12px_2px_#21F1A8]" />
          </div>

          <p className="relative z-10 text-sm font-medium text-white/50">
            Checking your session…
          </p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isSubscriptionActive) {
    return <PendingActivationPage />;
  }

  return children;
}

export function Unauthorized() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#171717] px-6 py-20 text-center font-['Manrope',sans-serif]">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 text-white/[0.03]"
      >
        <path
          d="M12 15v2m-6 4h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2Zm10-10V7a4 4 0 0 0-8 0v2"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[100px]"
        style={{
          background: "radial-gradient(circle, #21F1A8 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <span className="rounded-full border border-[#21F1A8]/20 bg-[#21F1A8]/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#21F1A8]">
          Access restricted
        </span>

        <h1 className="max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
          You don&rsquo;t have access to this page
        </h1>

        <p className="max-w-sm text-sm leading-relaxed text-white/50">
          Your account isn&rsquo;t authorized to view this. If you think
          that&rsquo;s a mistake, contact your administrator.
        </p>

        <Link
          to="/login"
          className="group mt-4 inline-flex items-center gap-2 rounded-xl bg-[#21F1A8] px-6 py-3 text-sm font-semibold text-[#0A0A0A] shadow-[0_0_25px_-5px_#21F1A8] transition hover:shadow-[0_0_35px_-2px_#21F1A8] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21F1A8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717]"
        >
          Back to login
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
    </div>
  );
}
