"use client";

const STORAGE_KEY = "ai-reel-guest-session-id";

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function createGuestSessionId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }

  if (c && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, toHex).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  const time = Date.now().toString(16);
  const random = Math.random().toString(16).slice(2);
  return `guest-${time}-${random}`;
}

export function getGuestSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      return existing;
    }
  } catch {
    // Ignore storage access errors and generate a fresh guest id.
  }

  const created = createGuestSessionId();
  try {
    window.localStorage.setItem(STORAGE_KEY, created);
  } catch {
    // Ignore storage write errors and still continue with cookie.
  }
  document.cookie = `guest_session_id=${created}; path=/; max-age=${60 * 60 * 24}`;
  return created;
}
