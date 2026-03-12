"use client";

const STORAGE_KEY = "ai-reel-guest-session-id";

export function getGuestSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, created);
  document.cookie = `guest_session_id=${created}; path=/; max-age=${60 * 60 * 24}`;
  return created;
}

