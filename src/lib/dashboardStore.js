import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, ApiError } from "./apiClient.js";

const POLL_MS = 30_000;

function toMessage(err) {
  if (err instanceof ApiError) {
    if (err.status === null)
      return "Could not reach the server. Please check your connection.";
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

function isAbortError(err) {
  return err?.name === "AbortError" || err?.code === 20;
}

export function useDashboardStats({ poll = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const refresh = useCallback(async (silent = false) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!silent) setLoading(true);
    setError(null);

    try {
      const result = await apiClient.get("/admin/dashboard-stats/", {
        signal: controller.signal,
      });
      if (!controller.signal.aborted && mountedRef.current) {
        setData(result);
      }
      return result;
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
    if (!poll) return undefined;

    const interval = setInterval(() => {
      refresh(true).catch(() => {});
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [refresh, poll]);

  return { data, loading, error, refresh };
}
