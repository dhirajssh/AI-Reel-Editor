"use client";

import { useEffect, useState } from "react";

import { attachGuestProjects, listProjects } from "@/lib/api";
import { ProjectCard } from "@/components/project-card";
import { SignInUpgradeButton, useAuth } from "@/lib/auth";
import type { Project } from "@/types";

export default function DashboardPage() {
  const { token, user, isSignedIn } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isSignedIn && token) {
          await attachGuestProjects({ token });
          const items = await listProjects({ token });
          if (active) {
            setProjects(items);
          }
          return;
        }

        const guestItems = await listProjects();
        if (active) {
          setProjects(guestItems);
        }
      } catch (loadError) {
        if (active) {
          const msg = loadError instanceof Error ? loadError.message : "Failed to load projects";
          const isNetworkError = msg.toLowerCase().includes("failed to fetch") || msg.toLowerCase().includes("network");
          setError(
            isNetworkError
              ? "Cannot reach the backend server. Make sure the API is running and try again."
              : msg
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [isSignedIn, token]);

  const completedCount = projects.filter((project) => project.status === "completed").length;
  const introTitle = isSignedIn ? "Your Projects" : "Guest History";
  const introBody = isSignedIn
    ? "Your guest projects are attached at sign-in and remain in your account history."
    : "Guest projects are visible here for 24 hours. Sign in to keep them permanently.";

  return (
    <section className="relative overflow-hidden">
      {/* Background orb */}
      <div className="orb orb-cyan absolute -left-40 top-0 h-[400px] w-[400px] animate-pulse-glow" />

      <div className="relative mx-auto max-w-6xl px-6 pb-20 pt-12">
        {/* Header card */}
        <div className="glass mb-8 rounded-2xl p-7 shadow-panel animate-fade-in-up">
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-start">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Dashboard
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-text-primary md:text-4xl">{introTitle}</h1>
              <p className="mt-3 max-w-2xl text-text-muted">{introBody}</p>
            </div>
            <div className="grid gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Projects</span>
                <span className="text-lg font-bold text-text-primary">{projects.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Completed</span>
                <span className="text-lg font-bold text-text-primary">{completedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">{isSignedIn ? "Storage mode" : "Guest expiry"}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${isSignedIn ? "bg-accent/20 text-accent" : "bg-white/10 text-text-muted"
                  }`}>
                  {isSignedIn ? "Persistent" : "24 hours"}
                </span>
              </div>
            </div>
          </div>
          {!isSignedIn ? (
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-accent/20 bg-accent/[0.06] p-4">
              <p className="text-sm text-text-muted">
                Create an account to keep history permanently across devices and sessions.
              </p>
              <SignInUpgradeButton
                label="Sign in to save history"
                className="btn-gradient rounded-full px-4 py-2 text-sm"
              />
            </div>
          ) : null}
        </div>

        {/* Error */}
        {error ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-sm text-amber-300">{error}</p>
          </div>
        ) : null}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-text-muted">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading projects…
          </div>
        ) : null}

        {/* Empty state */}
        {!loading && projects.length === 0 ? (
          <div className="glass rounded-2xl border-dashed border-white/10 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary">No projects yet</h2>
            <p className="mt-2 text-sm text-text-muted">Upload a talking-head clip and your reels will appear here.</p>
          </div>
        ) : null}

        {/* Project grid */}
        {!loading && projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
