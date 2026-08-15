const listeners = new Set();

export function subscribeToast(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitToast(message, type = "error") {
  listeners.forEach((listener) => listener(message, type));
}
