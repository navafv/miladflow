import { useEffect, useState } from "react";
import { apiClient, ApiError } from "./apiClient.js";

export function usePublicResource(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError(null);

    apiClient
      .get(path, { skipAuth: true })
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err.message ?? "Something went wrong.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, loading, notFound, error };
}

const MAX_BACKOFF_MS = 120_000;

export function usePublicPoll(path, intervalMs = 15_000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return undefined;
    let cancelled = false;
    let timeoutId = null;
    let isPaused = false;
    const hasLoadedOnceRef = { current: false };
    let consecutiveFailures = 0;

    const load = async () => {
      try {
        const result = await apiClient.get(path, { skipAuth: true });
        if (cancelled) return;
        consecutiveFailures = 0;
        setData(result);
        setNotFound(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        consecutiveFailures += 1;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err.message ?? "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          if (!hasLoadedOnceRef.current) setLoading(false);
          hasLoadedOnceRef.current = true;
        }
      }
    };

    const clearPendingTimeout = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const scheduleNext = () => {
      clearPendingTimeout();
      const delay =
        consecutiveFailures > 0
          ? Math.min(intervalMs * 2 ** consecutiveFailures, MAX_BACKOFF_MS)
          : intervalMs;
      timeoutId = setTimeout(async () => {
        if (cancelled || isPaused) return;
        await load();
        if (!cancelled && !isPaused) scheduleNext();
      }, delay);
    };

    const startPolling = () => {
      isPaused = false;
      if (timeoutId !== null) return;
      scheduleNext();
    };

    const stopPolling = () => {
      isPaused = true;
      clearPendingTimeout();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopPolling();
      } else {
        load().then(() => {
          if (!cancelled) startPolling();
        });
      }
    };

    load().then(() => {
      if (!cancelled && document.visibilityState !== "hidden") {
        startPolling();
      }
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      clearPendingTimeout();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [path, intervalMs]);

  return { data, loading, notFound, error };
}
