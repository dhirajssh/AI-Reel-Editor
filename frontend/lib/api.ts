"use client";

import { getGuestSessionId } from "@/lib/guest-session";
import type { Job, Project, ProjectDetail } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                       */
/* ------------------------------------------------------------------ */

export interface AuthTokenContext {
  token?: string | null;
}

function headers(auth?: AuthTokenContext): HeadersInit {
  const base: HeadersInit = {};

  if (auth?.token) {
    base["Authorization"] = `Bearer ${auth.token}`;
    return base;
  }

  base["X-Guest-Session-Id"] = getGuestSessionId();
  return base;
}

async function parseResponse<T>(response: Response): Promise<T> {
  let payload: any;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(response.statusText || "Request failed");
    }
    throw new Error("Invalid response from server");
  }
  if (!response.ok) {
    throw new Error(payload.detail || payload.message || "Request failed");
  }
  return payload as T;
}

/* ------------------------------------------------------------------ */
/*  Auth API                                                           */
/* ------------------------------------------------------------------ */

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
      signal: controller.signal,
    });
    return parseResponse<AuthResponse>(response);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      signal: controller.signal,
    });
    return parseResponse<AuthResponse>(response);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getMe(token: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return parseResponse<AuthUser>(response);
}

export async function deleteAccount(token: string): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE}/api/auth/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    await parseResponse(response);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/* ------------------------------------------------------------------ */
/*  Project API                                                        */
/* ------------------------------------------------------------------ */

export async function createProject(title: string, auth?: AuthTokenContext): Promise<Project> {
  const response = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers(auth),
    },
    body: JSON.stringify({ title }),
  });
  return parseResponse<Project>(response);
}

export async function uploadProjectVideo(projectId: number, file: File, auth?: AuthTokenContext): Promise<{ job_id: number; project: Project }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/api/projects/${projectId}/upload`, {
    method: "POST",
    headers: headers(auth),
    body: formData,
  });
  return parseResponse<{ job_id: number; project: Project }>(response);
}

export async function listProjects(auth?: AuthTokenContext): Promise<Project[]> {
  const response = await fetch(`${API_BASE}/api/projects`, {
    headers: headers(auth),
    cache: "no-store",
  });
  const payload = await parseResponse<{ items: Project[] }>(response);
  return payload.items;
}

export async function getProject(projectId: number, auth?: AuthTokenContext): Promise<ProjectDetail> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
    headers: headers(auth),
    cache: "no-store",
  });
  return parseResponse<ProjectDetail>(response);
}

export async function getJob(jobId: number): Promise<Job> {
  const response = await fetch(`${API_BASE}/api/jobs/${jobId}`, { cache: "no-store" });
  return parseResponse<Job>(response);
}

export async function deleteProject(projectId: number, auth?: AuthTokenContext): Promise<void> {
  const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
    method: "DELETE",
    headers: headers(auth),
  });
  await parseResponse(response);
}

export async function attachGuestProjects(auth: AuthTokenContext): Promise<void> {
  const response = await fetch(`${API_BASE}/api/projects/0/attach-guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers(auth),
    },
    body: JSON.stringify({ guest_session_id: getGuestSessionId() }),
  });
  await parseResponse(response);
}
