import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/admin/AdminSidebar.jsx";
import { apiClient } from "../../lib/apiClient.js";
import { useAuth, logout } from "../../lib/authStore.js";
import { getInitials } from "../../lib/initials.js";
import ThemeToggle from "../../components/ThemeToggle.jsx";

const titles = {
  "/admin": "Dashboard",
  "/admin/teams": "Teams",
  "/admin/categories": "Categories",
  "/admin/venues": "Venues",
  "/admin/events": "Events",
  "/admin/rules": "Rules",
  "/admin/students": "Students",
  "/admin/registration": "Registration",
  "/admin/registrations/view": "View Registrations",
  "/admin/schedule": "Schedule",
  "/admin/results": "Results",
  "/admin/settings": "Settings",
};

const HEALTH_CHECK_INTERVAL_MS = 60_000;

function useApiHealth() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        await apiClient.get("/health-check/", { skipAuth: true });
        if (!cancelled) setStatus("ok");
      } catch {
        if (!cancelled) setStatus("down");
      }
    };

    check();
    const interval = setInterval(check, HEALTH_CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return status;
}

function HealthIndicator() {
  const status = useApiHealth();
  const label =
    status === "ok"
      ? "API online"
      : status === "down"
        ? "API unreachable"
        : "Checking…";
  const dotClass =
    status === "ok"
      ? "bg-[#21F1A8]"
      : status === "down"
        ? "bg-rose-500 animate-pulse"
        : "bg-slate-400";

  return (
    <span
      title={label}
      aria-label={label}
      className="hidden items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:flex"
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

const ACTIVE_STATUS = "active";

function SubscriptionInactiveScreen() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-[#171717]">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-[#262626]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10">
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-6 w-6 text-rose-600 dark:text-rose-400"
            aria-hidden="true"
          >
            <path
              d="M10 6.5v4.25M10 13.5h.01"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.68 3.45 2.2 15.1c-.6 1.08.16 2.4 1.4 2.4h12.8c1.24 0 2-1.32 1.4-2.4L11.32 3.45a1.6 1.6 0 0 0-2.64 0Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
          Subscription Inactive
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Your madrassa's account is set up, but your subscription hasn't been
          activated yet. Reach out to support to confirm payment and unlock the
          dashboard.
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = titles[location.pathname] ?? "Dashboard";
  const { me } = useAuth();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const subscriptionStatus = me?.madrassa?.subscription_status ?? null;
  if (subscriptionStatus !== null && subscriptionStatus !== ACTIVE_STATUS) {
    return <SubscriptionInactiveScreen />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#171717]">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-slate-50/95 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-[#171717]/95 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-slate-200 p-2 transition-colors hover:border-[#21F1A8] dark:border-slate-700 lg:hidden"
              aria-label="Open menu"
            >
              <span className="block h-0.5 w-5 bg-slate-700 dark:bg-slate-200" />
              <span className="mt-1 block h-0.5 w-5 bg-slate-700 dark:bg-slate-200" />
              <span className="mt-1 block h-0.5 w-5 bg-slate-700 dark:bg-slate-200" />
            </button>
            <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <HealthIndicator />
            <ThemeToggle className="!h-9 !w-9" />
            <span className="hidden text-sm text-slate-500 dark:text-slate-400 sm:inline">
              {me?.madrassa?.name || "Your madrassa"}
            </span>
            <div className="h-9 w-9 shrink-0 rounded-full bg-[#21F1A8]/10 flex items-center justify-center text-sm font-semibold text-[#21F1A8]">
              {getInitials(me?.madrassa?.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
