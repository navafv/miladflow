import { useCallback, useEffect, useState } from "react";
import { subscribeToast } from "../../lib/toastBus.js";

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = "error") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    return subscribeToast((message, type) => {
      setToast({ message, type, key: Date.now() });
    });
  }, []);

  return { toast, showToast, dismiss: () => setToast(null) };
}

export function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onDismiss?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toast, onDismiss]);

  if (!toast) return null;
  const isError = toast.type === "error";

  return (
    <div
      key={toast.key}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      className={`fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm ${
        isError
          ? "border-rose-300 bg-rose-50/95 text-rose-700 dark:border-rose-500/40 dark:bg-[#262626] dark:text-rose-400"
          : "border-[#21F1A8]/40 bg-[#21F1A8]/10 text-[#0f8f66] dark:border-[#21F1A8]/40 dark:bg-[#262626] dark:text-[#21F1A8]"
      }`}
    >
      <span className="mt-0.5 text-sm font-semibold">{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-auto rounded p-0.5 text-xs font-bold opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-[#21F1A8]"
      >
        ✕
      </button>
    </div>
  );
}
