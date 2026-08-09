import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient, ApiError } from "./apiClient.js";

const CACHE_TTL_MS = 30_000;

const DEFAULT_PAGE_SIZE = 500;

const resourceCache = new Map();

export function invalidateCache(path) {
  resourceCache.delete(path);
}

export function clearResourceCache() {
  resourceCache.clear();
}

function getCached(path) {
  const entry = resourceCache.get(path);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    resourceCache.delete(path);
    return null;
  }
  return entry.data;
}

function setCached(path, data) {
  resourceCache.set(path, { data, ts: Date.now() });
}

export function useApiResource(path, params = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const abortRef = useRef(null);

  const paramsWithPageSize =
    params && Object.prototype.hasOwnProperty.call(params, "page_size")
      ? params
      : { page_size: DEFAULT_PAGE_SIZE, ...params };
  const serializedParams = serializeParams(paramsWithPageSize);

  const fullPath = serializedParams ? `${path}?${serializedParams}` : path;

  const isDisabled = Object.values(paramsWithPageSize).some(
    (v) => v === "__none__",
  );

  const refresh = useCallback(
    async (force = false) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      if (isDisabled) {
        if (mountedRef.current) {
          setData([]);
          setLoading(false);
          setError(null);
        }
        return [];
      }

      const controller = new AbortController();
      abortRef.current = controller;

      if (!force) {
        const cached = getCached(fullPath);
        if (cached !== null) {
          if (mountedRef.current) {
            setData(cached);
            setLoading(false);
            setError(null);
          }
          return cached;
        }
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiClient.get(fullPath, {
          signal: controller.signal,
        });
        const list = Array.isArray(result) ? result : (result?.results ?? []);

        if (!controller.signal.aborted && mountedRef.current) {
          setCached(fullPath, list);
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
    },
    [fullPath, isDisabled],
  );

  useEffect(() => {
    refresh().catch(() => {});
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fullPath]);

  const create = useCallback(
    async (payload) => {
      setMutating(true);
      setError(null);
      try {
        const created = await apiClient.post(path, payload);
        invalidateCache(fullPath);
        if (mountedRef.current) setData((prev) => [...prev, created]);
        return created;
      } catch (err) {
        if (mountedRef.current) setError(toMessage(err));
        throw err;
      } finally {
        if (mountedRef.current) setMutating(false);
      }
    },
    [path, fullPath],
  );

  const update = useCallback(
    async (id, payload) => {
      setMutating(true);
      setError(null);
      try {
        const updated = await apiClient.patch(`${path}${id}/`, payload);
        invalidateCache(fullPath);
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
    },
    [path, fullPath],
  );

  const remove = useCallback(
    async (id) => {
      setMutating(true);
      setError(null);
      try {
        await apiClient.delete(`${path}${id}/`);
        invalidateCache(fullPath);
        if (mountedRef.current)
          setData((prev) => prev.filter((item) => item.id !== id));
      } catch (err) {
        if (mountedRef.current) setError(toMessage(err));
        throw err;
      } finally {
        if (mountedRef.current) setMutating(false);
      }
    },
    [path, fullPath],
  );

  const invalidate = useCallback(() => {
    invalidateCache(fullPath);
  }, [fullPath]);

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
    invalidate,
  };
}

function serializeParams(params) {
  if (!params || typeof params !== "object") return "";
  const entries = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => [k, String(v)])
    .sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return "";
  return new URLSearchParams(entries).toString();
}

function isAbortError(err) {
  return err?.name === "AbortError" || err?.code === 20;
}

function toMessage(err) {
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
