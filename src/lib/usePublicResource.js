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

export function usePublicPoll(path, intervalMs = 15_000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) return undefined;
    let cancelled = false;
    let intervalId = null;
    const hasLoadedOnceRef = { current: false };

    const load = async () => {
      try {
        const result = await apiClient.get(path, { skipAuth: true });
        if (cancelled) return;
        setData(result);
        setNotFound(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
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

    const startInterval = () => {
      if (intervalId !== null) return;
      intervalId = setInterval(load, intervalMs);
    };

    const stopInterval = () => {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopInterval();
      } else {
        load();
        startInterval();
      }
    };

    load();
    if (document.visibilityState !== "hidden") {
      startInterval();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [path, intervalMs]);

  return { data, loading, notFound, error };
}
