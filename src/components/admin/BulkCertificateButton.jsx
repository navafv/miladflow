// src/components/admin/BulkCertificateButton.jsx
//
// Self-contained "Generate Bulk Certificates" action: button + progress
// overlay + the off-screen render portal, all driven by
// useBulkCertificateGenerator. Drop it into StudentsPage's toolbar next to
// the existing "Print ID Cards" / "Bulk upload" buttons.

import { useEffect } from "react";
import { useBulkCertificateGenerator } from "./BulkCertificateGenerator.jsx";

function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M22 12a10 10 0 0 1-10 10v-3a7 7 0 0 0 7-7h3Z" />
    </svg>
  );
}

export default function BulkCertificateButton({
  students,
  madrassaName,
  onDone,
  onError,
}) {
  const { state, generate, reset, portal } = useBulkCertificateGenerator({ madrassaName });

  const isBusy = state.status === "running" || state.status === "zipping";
  const disabled = isBusy || students.length === 0;

  // Surface a toast once the job settles, then return to idle so the
  // button is reusable without a page refresh.
  useEffect(() => {
    if (state.status === "done") {
      const failedCount = state.failed.length;
      onDone?.(
        failedCount > 0
          ? `Generated ${state.total - failedCount} of ${state.total} certificates (${failedCount} failed).`
          : `Generated ${state.total} certificate${state.total === 1 ? "" : "s"}.`,
      );
      reset();
    } else if (state.status === "error") {
      onError?.("Couldn't generate any certificates. Please try again.");
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  const handleClick = () => {
    if (disabled) return;
    generate(students);
  };

  const progressPct = state.total > 0 ? Math.round((state.current / state.total) * 100) : 0;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        aria-busy={isBusy}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#262626] px-3 py-2 text-xs font-semibold text-[#171717] dark:text-[#21F1A8] transition hover:border-[#21F1A8] hover:text-[#21F1A8] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M6 2.5h8L16 5v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z"
              strokeLinejoin="round"
            />
            <path d="M7 9.5l2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        Generate Bulk Certificates
      </button>

      {portal}

      {isBusy && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-500/80 px-4"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-[#262626]">
            <div className="flex items-center gap-2.5">
              <Spinner className="h-5 w-5 text-[#21F1A8]" />
              <p className="text-sm font-semibold text-[#171717] dark:text-white">
                {state.status === "zipping"
                  ? "Packaging certificates into a zip…"
                  : "Generating certificates…"}
              </p>
            </div>

            {state.status === "running" && (
              <p className="mt-2 truncate text-xs text-slate-500 dark:text-slate-400">
                {state.current} of {state.total} &middot; {state.currentName}
              </p>
            )}

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-[#21F1A8] transition-[width] duration-200"
                style={{
                  width: state.status === "zipping" ? "100%" : `${progressPct}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
