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

    let res;
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...rest, headers });
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      throw new ApiError("Network error — please check your connection.", {
        status: null,
        data: err,
      });
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
    throw new ApiError(message, { status: res.status, data });
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
};

export const tokenStorage = {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  onTokenChange,
};
