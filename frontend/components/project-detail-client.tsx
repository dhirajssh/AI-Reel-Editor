"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { deleteProject, getProject } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toMediaUrl } from "@/lib/media";
import type { ProjectDetail } from "@/types";

export function ProjectDetailClient({ projectId, initialProject }: { projectId: number; initialProject: ProjectDetail }) {
  const router = useRouter();
  const { token, isSignedIn } = useAuth();
  const [project, setProject] = useState(initialProject);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!project.latest_job || !["queued", "processing"].includes(project.latest_job.status)) {
      return;
    }

    const timer = window.setInterval(async () => {
      const nextProject = await getProject(projectId, {
        token,
      });
      setProject(nextProject);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [project.latest_job, projectId, token]);

  async function onDelete() {
    await deleteProject(projectId, {
      token,
    });
    router.push(isSignedIn ? "/dashboard" : "/upload");
  }

  async function onDownloadReel() {
    const processedUrl = toMediaUrl(project.processed_file_path);
    if (!processedUrl || isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      const response = await fetch(processedUrl);
      if (!response.ok) {
        throw new Error("Failed to download reel");
      }

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = (project.title || "reel").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "");
      link.href = objectUrl;
      link.download = `${safeTitle || "reel"}-processed.mp4`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } finally {
      setIsDownloading(false);
    }
  }

  const originalUrl = toMediaUrl(project.original_file_path);
  const processedUrl = toMediaUrl(project.processed_file_path);

  return (
    <div className="grid gap-8 animate-fade-in-up">
      {/* Video comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl p-6 shadow-panel">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Original</h2>
          {originalUrl ? (
            <video controls className="aspect-[9/16] w-full rounded-xl object-cover" src={originalUrl} />
          ) : (
            <div className="grid aspect-[9/16] place-items-center rounded-xl bg-surface-raised text-text-muted">
              No original video
            </div>
          )}
        </div>
        <div className="glass rounded-2xl p-6 shadow-panel">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Processed Reel</h2>
          {processedUrl ? (
            <video controls className="aspect-[9/16] w-full rounded-xl object-cover" src={processedUrl} />
          ) : (
            <div className="grid aspect-[9/16] place-items-center rounded-xl bg-surface-raised">
              <div className="text-center">
                {project.latest_job?.status === "processing" ? (
                  <div className="flex flex-col items-center gap-3">
                    <svg className="h-8 w-8 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-text-muted">{project.latest_job?.progress_message || "Processing…"}</p>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">{project.latest_job?.progress_message || project.status}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project info */}
      <section className="glass rounded-2xl p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{project.title}</h1>
            <p className="mt-1 text-sm text-text-muted">
              Status: {project.latest_job?.status || project.status}
              {project.latest_job?.progress_message ? ` · ${project.latest_job.progress_message}` : ""}
            </p>
          </div>
          <div className="flex gap-3">
            {processedUrl ? (
              <button
                type="button"
                className="btn-gradient rounded-full px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onDownloadReel}
                disabled={isDownloading}
              >
                {isDownloading ? "Preparing download..." : "Download Reel"}
              </button>
            ) : null}
            <button className="btn-ghost rounded-full px-5 py-2.5 text-sm text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50" onClick={onDelete}>
              Delete
            </button>
          </div>
        </div>
        <p className="mt-6 text-sm leading-7 text-text-muted">
          {project.transcript?.full_text || "Transcript will appear here after transcription finishes."}
        </p>
      </section>
    </div>
  );
}
