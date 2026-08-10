import { useSyncExternalStore } from "react";
import { apiClient, ApiError } from "./apiClient.js";

let currentEventId = null;
let byStudentId = new Map();
let loading = false;
let loadError = null;

const listeners = new Set();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let cached = { currentEventId, byStudentId, loading, loadError };
function getState() {
  return cached;
}
function setState(patch) {
  if ("currentEventId" in patch) currentEventId = patch.currentEventId;
  if (patch.byStudentId) byStudentId = patch.byStudentId;
  if ("loading" in patch) loading = patch.loading;
  if ("loadError" in patch) loadError = patch.loadError;
  cached = { currentEventId, byStudentId, loading, loadError };
  emit();
}

export function useEventRoster() {
  return useSyncExternalStore(subscribe, getState, getState);
}

function patchStudent(studentId, patch) {
  const next = new Map(byStudentId);
  const existing = next.get(studentId) ?? {};
  next.set(studentId, { ...existing, ...patch });
  setState({ byStudentId: next });
}

function removeStudent(studentId) {
  const next = new Map(byStudentId);
  next.delete(studentId);
  setState({ byStudentId: next });
}

export async function loadEventRoster(eventId) {
  setState({
    currentEventId: eventId,
    byStudentId: new Map(),
    loading: true,
    loadError: null,
  });

  try {
    const result = await apiClient.get(
      `/registrations/?event=${eventId}&page_size=500`,
    );
    const rows = Array.isArray(result) ? result : (result?.results ?? []);

    const next = new Map();
    rows.forEach((row) => {
      const studentId = row.student?.id ?? row.student_id;
      if (studentId == null) return;
      next.set(studentId, { status: "registered", registrationId: row.id });
    });

    if (currentEventId === eventId) {
      setState({ byStudentId: next, loading: false });
    }
    return next;
  } catch (err) {
    if (currentEventId === eventId) {
      setState({
        loading: false,
        loadError: err.message ?? "Failed to load this event's roster.",
      });
    }
    throw err;
  }
}

async function reconcileStudent(studentId, eventId) {
  try {
    const result = await apiClient.get(
      `/registrations/?event=${eventId}&student=${studentId}`,
    );
    const rows = Array.isArray(result) ? result : (result?.results ?? []);
    if (currentEventId !== eventId) return;
    if (rows.length > 0) {
      patchStudent(studentId, {
        status: "registered",
        registrationId: rows[0].id,
        error: null,
      });
    } else {
      removeStudent(studentId);
    }
  } catch {
    if (currentEventId === eventId) {
      patchStudent(studentId, {
        status: "error",
        error: "Couldn't confirm registration status — please refresh.",
      });
    }
  }
}

export async function registerStudent(studentId, eventId) {
  patchStudent(studentId, { status: "saving", error: null });

  let response;
  try {
    response = await apiClient.post("/registrations/bulk/", {
      assignments: [{ student_id: studentId, event_id: eventId }],
    });
  } catch (err) {
    const hasBucketShape =
      err instanceof ApiError &&
      err.data &&
      typeof err.data === "object" &&
      ("rejected" in err.data || "created" in err.data);
    if (!hasBucketShape) {
      await reconcileStudent(studentId, eventId);
      const entry = byStudentId.get(studentId);
      if (entry?.status === "registered") return { ok: true };
      return {
        ok: false,
        error:
          err.message ??
          "Could not confirm this registration — please check and retry.",
      };
    }
    response = err.data;
  }

  const created = response?.created ?? [];
  const skipped = response?.skipped_existing ?? [];
  const rejected = response?.rejected ?? [];

  if (currentEventId !== eventId) {
    return { ok: true, stale: true };
  }

  if (created.length) {
    const row = created[0];
    patchStudent(studentId, {
      status: "registered",
      registrationId: row.id,
      error: null,
    });
    return { ok: true };
  }

  if (skipped.length) {
    await loadEventRoster(eventId);
    return { ok: true };
  }

  const failure = rejected[0];
  const message =
    failure?.errors?.[0] ||
    (Array.isArray(failure?.errors) ? failure.errors.join("; ") : null) ||
    "Could not be saved.";
  removeStudent(studentId);
  return { ok: false, error: message };
}

export async function unregisterStudent(studentId, registrationId, eventId) {
  const previous = byStudentId.get(studentId);
  removeStudent(studentId);

  try {
    await apiClient.delete(`/registrations/${registrationId}/?force=true`);

    if (currentEventId !== eventId) {
      return { ok: true, stale: true };
    }
    return { ok: true };
  } catch (err) {
    if (previous && currentEventId === eventId) {
      patchStudent(studentId, previous);
    }
    return {
      ok: false,
      error: err.message ?? "Could not remove this registration.",
    };
  }
}

export async function registerStudentsBulk(studentIds, eventId) {
  const idsToRegister = studentIds.filter((id) => {
    const entry = byStudentId.get(id);
    return !entry || entry.status !== "registered";
  });

  if (idsToRegister.length === 0) {
    return { registeredIds: studentIds, failures: [] };
  }

  idsToRegister.forEach((id) =>
    patchStudent(id, { status: "saving", error: null }),
  );

  let response;
  try {
    response = await apiClient.post("/registrations/bulk/", {
      assignments: idsToRegister.map((student_id) => ({
        student_id,
        event_id: eventId,
      })),
    });
  } catch (err) {
    const hasBucketShape =
      err instanceof ApiError &&
      err.data &&
      typeof err.data === "object" &&
      ("rejected" in err.data || "created" in err.data);
    if (!hasBucketShape) {
      const refreshed =
        currentEventId === eventId
          ? await loadEventRoster(eventId).catch(() => null)
          : null;
      const registeredIds = [];
      const failures = [];
      idsToRegister.forEach((id) => {
        if (refreshed?.get(id)) {
          registeredIds.push(id);
        } else {
          if (currentEventId === eventId) removeStudent(id);
          failures.push({
            studentId: id,
            error:
              err.message ??
              "Could not confirm this registration — please check and retry.",
          });
        }
      });
      return { registeredIds, failures };
    }
    response = err.data;
  }

  const created = response?.created ?? [];
  const skipped = response?.skipped_existing ?? [];
  const rejected = response?.rejected ?? [];

  const registeredIds = [];
  const failures = [];

  if (currentEventId !== eventId) {
    created.forEach((row) => {
      const studentId = row.student?.id ?? row.student_id;
      if (studentId != null) registeredIds.push(studentId);
    });
    skipped.forEach((row) => {
      if (row.student_id != null) registeredIds.push(row.student_id);
    });
    rejected.forEach((row) => {
      if (row.student_id != null) {
        const message =
          row.errors?.[0] ||
          (Array.isArray(row.errors) ? row.errors.join("; ") : null) ||
          "Could not be saved.";
        failures.push({ studentId: row.student_id, error: message });
      }
    });
    return { registeredIds, failures, stale: true };
  }

  created.forEach((row) => {
    const studentId = row.student?.id ?? row.student_id;
    if (studentId == null) return;
    patchStudent(studentId, {
      status: "registered",
      registrationId: row.id,
      error: null,
    });
    registeredIds.push(studentId);
  });

  skipped.forEach((row) => {
    if (row.student_id != null) registeredIds.push(row.student_id);
  });

  rejected.forEach((row) => {
    const message =
      row.errors?.[0] ||
      (Array.isArray(row.errors) ? row.errors.join("; ") : null) ||
      "Could not be saved.";
    if (row.student_id != null) {
      removeStudent(row.student_id);
      failures.push({ studentId: row.student_id, error: message });
    }
  });

  if (skipped.length) {
    await loadEventRoster(eventId);
  }

  return { registeredIds, failures };
}
