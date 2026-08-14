import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../Logo.jsx";
import { logout, useAuth } from "../../lib/authStore.js";
import { getInitials } from "../../lib/initials.js";

const navSections = [
  {
    items: [{ to: "/admin", label: "Dashboard", end: true }],
  },
  {
    label: "Setup",
    items: [
      { to: "/admin/teams", label: "Teams" },
      { to: "/admin/categories", label: "Categories" },
      { to: "/admin/venues", label: "Venues" },
      { to: "/admin/events", label: "Events" },
      { to: "/admin/rules", label: "Rules" },
    ],
  },
  {
    label: "Festival",
    items: [
      { to: "/admin/students", label: "Students" },
      { to: "/admin/registration", label: "Registration" },
      { to: "/admin/registrations/view", label: "View Registrations" },
      { to: "/admin/schedule", label: "Schedule" },
      { to: "/admin/results", label: "Results" },
      { to: "/admin/reports", label: "Reports & Exports" },
    ],
  },
  {
    items: [{ to: "/admin/settings", label: "Settings" }],
  },
];

const DESKTOP_QUERY = "(min-width: 1024px)";

export default function AdminSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const navRef = useRef(null);
  const firstLinkRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const handleChange = (e) => setIsDesktop(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const isHiddenDrawer = !open && !isDesktop;

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) firstLinkRef.current?.focus();
  }, [open]);

  const { me } = useAuth();
  const madrassaName = me?.madrassa?.name;
  const signedInLabel =
    me?.email || (madrassaName ? `${madrassaName} admin` : "Committee Admin");

  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return undefined;

    const updateFades = () => {
      setCanScrollUp(el.scrollTop > 4);
      setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
    };

    updateFades();
    el.addEventListener("scroll", updateFades, { passive: true });

    const resizeObserver = new ResizeObserver(updateFades);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateFades);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        aria-hidden={isHiddenDrawer ? true : undefined}
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 grow-0 basis-64 flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform dark:border-slate-800 dark:bg-[#171717] dark:text-white lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
          <Logo className="h-5 w-5" />
          <span className="font-display text-lg font-semibold text-slate-900 dark:text-white">
            Milad Flow
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <style>{`
            .admin-nav-scroll { scrollbar-width: thin; scrollbar-color: rgba(33,241,168,0.35) transparent; }
            .admin-nav-scroll::-webkit-scrollbar { width: 5px; }
            .admin-nav-scroll::-webkit-scrollbar-track { background: transparent; }
            .admin-nav-scroll::-webkit-scrollbar-thumb { background: rgba(33,241,168,0.35); border-radius: 9999px; }
            .admin-nav-scroll::-webkit-scrollbar-thumb:hover { background: rgba(33,241,168,0.6); }
          `}</style>

          <nav
            ref={navRef}
            aria-label="Admin"
            className="admin-nav-scroll h-full space-y-4 overflow-y-auto px-3 py-4"
          >
            {navSections.map((section, sectionIndex) => (
              <div key={section.label ?? `section-${sectionIndex}`}>
                {section.label && (
                  <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    {section.label}
                  </p>
                )}
                <div className="space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <NavLink
                      key={item.to}
                      ref={
                        sectionIndex === 0 && itemIndex === 0
                          ? firstLinkRef
                          : undefined
                      }
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      tabIndex={isHiddenDrawer ? -1 : undefined}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-[#21F1A8] ${
                          isActive
                            ? "bg-[#21F1A8]/10 text-[#21F1A8] border border-[#21F1A8]/30"
                            : "border border-transparent text-slate-600 hover:bg-slate-100 hover:text-[#171717] dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent transition-opacity duration-200 dark:from-[#171717] ${
              canScrollUp ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 dark:from-[#171717] ${
              canScrollDown ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        <div className="shrink-0 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#21F1A8]/10 text-xs font-bold text-[#21F1A8]">
              {getInitials(madrassaName)}
            </div>
            <div className="min-w-0">
              <p
                className="truncate text-xs text-slate-500 dark:text-slate-400"
                title={signedInLabel}
              >
                {signedInLabel}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            tabIndex={isHiddenDrawer ? -1 : undefined}
            className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-[#21F1A8] focus-visible:outline-2 focus-visible:outline-[#21F1A8] dark:text-slate-300 dark:hover:text-[#21F1A8]"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-3.5 w-3.5"
              aria-hidden="true"
            >
              <path
                d="M13 14.5v.75A1.75 1.75 0 0 1 11.25 17h-5.5A1.75 1.75 0 0 1 4 15.25v-10.5A1.75 1.75 0 0 1 5.75 3h5.5A1.75 1.75 0 0 1 13 4.75v.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 10H8m8.5 0-2.5-2.5m2.5 2.5-2.5 2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
