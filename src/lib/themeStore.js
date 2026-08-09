import { useSyncExternalStore } from "react";

const STORAGE_KEY = "miladflow:theme";

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function getStoredTheme() {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

function applyThemeToDocument(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
}

let state = {
  theme: getStoredTheme() ?? (systemPrefersDark() ? "dark" : "light"),
};

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return { theme: "light" };
}

export function setTheme(theme) {
  state = { theme };
  applyThemeToDocument(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  emit();
}

export function toggleTheme() {
  setTheme(state.theme === "dark" ? "light" : "dark");
}

export function initTheme() {
  applyThemeToDocument(state.theme);

  if (typeof window === "undefined" || !window.matchMedia) return;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleSystemChange = (event) => {
    if (getStoredTheme()) return;
    setTheme(event.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handleSystemChange);
}

export function useTheme() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return snapshot.theme;
}
