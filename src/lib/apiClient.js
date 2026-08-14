const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.error("VITE_API_BASE_URL is not set — check your .env file.");
}

export class ApiError extends Error {
  constructor(message, { status = null, data = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const REFRESH_KEY = "mm_refresh_token";

let _accessToken = null;

function getAccessToken() {
  return _accessToken;
}

function getRefreshToken() {
  try {
    return window.localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

function setTokens({ access, refresh } = {}) {
  if (access !== undefined) _accessToken = access ?? null;
  try {
    if (refresh !== undefined && refresh !== null) {
      window.localStorage.setItem(REFRESH_KEY, refresh);
    } else if (refresh === null) {
      window.localStorage.removeItem(REFRESH_KEY);
    }
  } catch {}
}

function clearTokens() {
  _accessToken = null;
  try {
    window.localStorage.removeItem(REFRESH_KEY);
  } catch {}
}

const tokenListeners = new Set();
function emitTokenChange() {
  tokenListeners.forEach((listener) => listener());
}
function onTokenChange(listener) {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

const forcedLogoutListeners = new Set();
function emitForcedLogout() {
  forcedLogoutListeners.forEach((listener) => listener());
}
export function onForcedLogout(listener) {
  forcedLogoutListeners.add(listener);
  return () => forcedLogoutListeners.delete(listener);
}

const globalErrorListeners = new Set();
function notifyGlobalError(error) {
  globalErrorListeners.forEach((listener) => listener(error));
}
export function onApiError(listener) {
  globalErrorListeners.add(listener);
  return () => globalErrorListeners.delete(listener);
}

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) {
      throw new ApiError("No refresh token available", { status: 401 });
    }

    const res = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      const errData = await safeJson(res);
      throw new ApiError("Session expired", {
        status: res.status,
        data: errData,
      });
    }

    const data = await safeJson(res);
    const access = data?.access;
    if (!access) {
      throw new ApiError("Refresh response missing access token", {
        status: 500,
      });
    }

    setTokens({ access, refresh: data?.refresh ?? refresh });
    emitTokenChange();
    return access;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const REQUEST_TIMEOUT_MS = 15_000;

function withTimeoutSignal(callerSignal, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

async function request(path, options = {}) {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const doFetch = async () => {
    const headers = new Headers(customHeaders);
    const isFormData = rest.body instanceof FormData;
    if (!isFormData && rest.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (!skipAuth) {
      const access = getAccessToken();
      if (access) headers.set("Authorization", `Bearer ${access}`);
    }

    const { signal, cleanup } = withTimeoutSignal(
      rest.signal,
      REQUEST_TIMEOUT_MS,
    );

    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...rest, headers, signal });
    } catch (err) {
      if (err?.name === "AbortError") {
        if (rest.signal?.aborted) throw err;
        throw new ApiError("Request timed out. Please try again.", {
          status: null,
          data: err,
        });
      }
      throw new ApiError("Network error — please check your connection.", {
        status: null,
        data: err,
      });
    } finally {
      cleanup();
    }
    return res;
  };

  let res = await doFetch();

  if (res.status === 401 && !skipAuth && getRefreshToken()) {
    let refreshError = null;
    try {
      await refreshAccessToken();
    } catch (err) {
      refreshError = err;
    }

    if (refreshError) {
      clearTokens();
      emitTokenChange();
      emitForcedLogout();

      throw new ApiError("Session expired. Please log in again.", {
        status: 401,
        data: refreshError instanceof ApiError ? refreshError.data : null,
      });
    }

    res = await doFetch();
  }

  if (!res.ok) {
    const data = await safeJson(res);
    const message =
      data?.error?.message ||
      data?.error?.detail ||
      data?.detail ||
      data?.message ||
      `Request failed with status ${res.status}`;
    const apiError = new ApiError(message, { status: res.status, data });
    if (res.status >= 500 || res.status === 403) {
      notifyGlobalError(apiError);
    }
    throw apiError;
  }

  if (res.status === 204) return null;
  return safeJson(res);
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    request(path, {
      ...options,
      method: "POST",
      body: body != null ? JSON.stringify(body) : undefined,
    }),
  put: (path, body, options) =>
    request(path, {
      ...options,
      method: "PUT",
      body: body != null ? JSON.stringify(body) : undefined,
    }),
  patch: (path, body, options) =>
    request(path, {
      ...options,
      method: "PATCH",
      body: body != null ? JSON.stringify(body) : undefined,
    }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),

  raw: request,
  refreshAccessToken,
};

export const tokenStorage = {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  onTokenChange,
  onForcedLogout,
};
