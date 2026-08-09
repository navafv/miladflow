import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { apiClient, ApiError } from "./apiClient.js";
import { invalidateCache } from "./useApiResource.js";

let leaderboardState = {
  data: [],
  loading: false,
  error: null,
};

const leaderboardListeners = new Set();

function setLeaderboardState(patch) {
  leaderboardState = { ...leaderboardState, ...patch };
  leaderboardListeners.forEach((l) => l());
}

function subscribeLeaderboard(listener) {
  leaderboardListeners.add(listener);
  return () => leaderboardListeners.delete(listener);
}

function getLeaderboardSnapshot() {
  return leaderboardState;
}

export async function fetchLeaderboard() {
  setLeaderboardState({ loading: true, error: null });
  try {
    const result = await apiClient.get("/results/leaderboard/");
    const data = Array.isArray(result) ? result : (result?.results ?? []);
    setLeaderboardState({ data, loading: false });
    return data;
  } catch (err) {
    const message =
      err instanceof ApiError ? err.message : "Could not load leaderboard.";
    setLeaderboardState({ loading: false, error: message });
    throw err;
  }
}

async function bustLeaderboard() {
  try {
    await fetchLeaderboard();
  } catch {}
}

export function useLeaderboard() {
  const snapshot = useSyncExternalStore(
    subscribeLeaderboard,
    getLeaderboardSnapshot,
    getLeaderboardSnapshot,
  );

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (
      !fetchedRef.current &&
      snapshot.data.length === 0 &&
      !snapshot.loading
    ) {
      fetchedRef.current = true;
      fetchLeaderboard();
    }
  }, [snapshot.data.length, snapshot.loading]);

  return {
    data: snapshot.data,
    loading: snapshot.loading,
    error: snapshot.error,
    refresh: fetchLeaderboard,
  };
}

export function usePlacements(eventId = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const path =
    eventId != null
      ? `/results/placements/?event=${eventId}`
      : "/results/placements/";

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get(path, { signal: controller.signal });
      const list = Array.isArray(result) ? result : (result?.results ?? []);
      if (!controller.signal.aborted && mountedRef.current) {
        setData(list);
      }
      return list;
    } catch (err) {
      if (isAbortError(err)) return;
      if (mountedRef.current) setError(toMessage(err));
      throw err;
    } finally {
      if (!controller.signal.aborted && mountedRef.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    refresh().catch(() => {});
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [path]);

  const create = useCallback(async (payload) => {
    setMutating(true);
    setError(null);
    try {
      const created = await apiClient.post("/results/placements/", payload);

      await bustLeaderboard();
      if (mountedRef.current) setData((prev) => [...prev, created]);
      return created;
    } catch (err) {
      if (mountedRef.current) setError(toMessage(err));
      throw err;
    } finally {
      if (mountedRef.current) setMutating(false);
    }
  }, []);

  const update = useCallback(async (id, payload) => {
    setMutating(true);
    setError(null);
    try {
      const updated = await apiClient.patch(
        `/results/placements/${id}/`,
        payload,
      );
      await bustLeaderboard();
      if (mountedRef.current) {
        setData((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
      }
      return updated;
    } catch (err) {
      if (mountedRef.current) setError(toMessage(err));
      throw err;
    } finally {
      if (mountedRef.current) setMutating(false);
    }
  }, []);

  const remove = useCallback(async (id) => {
    setMutating(true);
    setError(null);
    try {
      await apiClient.delete(`/results/placements/${id}/`);
      await bustLeaderboard();
      if (mountedRef.current)
        setData((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      if (mountedRef.current) setError(toMessage(err));
      throw err;
    } finally {
      if (mountedRef.current) setMutating(false);
    }
  }, []);

  return {
    data,
    setData,
    loading,
    mutating,
    error,
    setError,
    refresh,
    create,
    update,
    remove,
  };
}

export function useTeamBonusPoints() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const refresh = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get("/results/team-bonus-points/", {
        signal: controller.signal,
      });
      const list = Array.isArray(result) ? result : (result?.results ?? []);
      if (!controller.signal.aborted && mountedRef.current) setData(list);
      return list;
    } catch (err) {
      if (isAbortError(err)) return;
      if (mountedRef.current) setError(toMessage(err));
      throw err;
    } finally {
      if (!controller.signal.aborted && mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const create = useCallback(async (payload) => {
    setMutating(true);
    setError(null);
    try {
      const created = await apiClient.post(
        "/results/team-bonus-points/",
        payload,
      );

      await bustLeaderboard();
      if (mountedRef.current) setData((prev) => [...prev, created]);
      return created;
    } catch (err) {
      if (mountedRef.current) setError(toMessage(err));
      throw err;
    } finally {
      if (mountedRef.current) setMutating(false);
    }
  }, []);

  return { data, setData, loading, mutating, error, setError, refresh, create };
}

export async function getStudentWins(studentId) {
  const result = await apiClient.get(
    `/results/placements/?student=${studentId}&page_size=100`,
  );
  const list = Array.isArray(result) ? result : (result?.results ?? []);

  return list
    .filter((p) => {
      const rowStudentId = p.student?.id ?? p.student_id;
      if (rowStudentId != null && String(rowStudentId) === String(studentId)) {
        return true;
      }
      const groupMembers = p.group_entry?.students ?? [];
      return groupMembers.some((s) => String(s.id) === String(studentId));
    })
    .map((p) => ({
      placementId: p.id,
      eventId: p.event?.id ?? p.event_id,
      eventName: p.event?.name ?? p.event_name ?? "",
      place: p.place,
      isGroupWin: p.group_entry != null,
      groupName: p.group_entry?.display_name ?? null,
    }))
    .filter(
      (w, i, arr) =>
        arr.findIndex((x) => x.placementId === w.placementId) === i,
    )
    .sort((a, b) => a.place - b.place);
}

function isAbortError(err) {
  return err?.name === "AbortError" || err?.code === 20;
}

export function toMessage(err) {
  if (err instanceof ApiError) {
    if (err.status === null)
      return "Could not reach the server. Please check your connection.";
    const envelope = err.data?.error;
    if (envelope && typeof envelope === "object") {
      if (envelope.message) return String(envelope.message);
      if (Array.isArray(envelope.errors) && envelope.errors.length) {
        return String(envelope.errors[0]);
      }
      if (envelope.detail) {
        if (typeof envelope.detail === "string") return envelope.detail;
        const firstFieldError = Object.values(envelope.detail).find((v) => v);
        if (Array.isArray(firstFieldError)) return String(firstFieldError[0]);
        if (typeof firstFieldError === "string") return firstFieldError;
      }
    }

    if (err.data && typeof err.data === "object") {
      const firstFieldError = Object.values(err.data).find((v) => v);
      if (Array.isArray(firstFieldError)) return String(firstFieldError[0]);
      if (typeof firstFieldError === "string") return firstFieldError;
    }
    return err.message;
  }
  return "Something went wrong. Please try again.";
}
