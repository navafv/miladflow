import { useSyncExternalStore } from "react";
import { apiClient, tokenStorage, ApiError } from "./apiClient.js";
import { clearResourceCache } from "./useApiResource.js";

let state = {
  hasRefresh: Boolean(tokenStorage.getRefreshToken()),
  me: null,
  status: "idle",
};

const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return state;
}

tokenStorage.onTokenChange(() => {
  setState({ hasRefresh: Boolean(tokenStorage.getRefreshToken()) });
});

export async function login(email, password) {
  const data = await apiClient.post(
    "/auth/login/",
    { email, password },
    { skipAuth: true },
  );
  const access = data?.access;
  const refresh = data?.refresh;
  if (!access || !refresh) {
    throw new ApiError("Login response missing tokens", { status: 500, data });
  }

  tokenStorage.setTokens({ access, refresh });
  setState({
    hasRefresh: true,
    me: data?.user ?? null,
    status: "ready",
  });
  return data;
}

export async function logout() {
  const refresh = tokenStorage.getRefreshToken();
  try {
    if (refresh) {
      await apiClient.post("/auth/logout/", { refresh });
    }
  } catch {
  } finally {
    tokenStorage.clearTokens();
    clearResourceCache();
    setState({ hasRefresh: false, me: null, status: "ready" });
  }
}

export async function hydrate() {
  if (!tokenStorage.getRefreshToken()) {
    setState({ status: "ready", me: null });
    return;
  }
  setState({ status: "loading" });
  try {
    const me = await apiClient.get("/auth/me/");
    setState({ me, status: "ready" });
  } catch {
    setState({ me: null, status: "error" });
  }
}

export function useAuth() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const subscriptionStatus = snapshot.me?.madrassa?.subscription_status ?? null;
  return {
    authed: snapshot.status === "ready" && snapshot.me !== null,
    hasRefresh: snapshot.hasRefresh,
    me: snapshot.me,
    status: snapshot.status,
    isHydrating: snapshot.status === "idle" || snapshot.status === "loading",
    subscriptionStatus,
    isSubscriptionActive: subscriptionStatus === "active",
  };
}
