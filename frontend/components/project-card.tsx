"use client";

import { useState } from "react";
import Link from "next/link";

import { toMediaUrl } from "@/lib/media";
import type { Project } from "@/types";

function statusClass(status: Project["status"]): string {
  if (status === "completed") {
    return "bg-emerald-500/15 text-emerald-400";
  }
  if (status === "failed") {
    return "bg-red-500/15 text-red-400";
  }
  if (status === "processing") {
    return "bg-accent/15 text-accent";
  }
  return "bg-amber-500/15 text-amber-400";
}

export function ProjectCard({ project }: { project: Project }) {
  const downloadUrl = toMediaUrl(project.processed_file_path);
  const expiresLabel = project.expires_at ? new Date(project.expires_at).toLocaleString() : null;
  const isGuest = Boolean(project.guest_session_id);
  const [isDownloading, setIsDownloading] = useState(false);

  async function onDownloadReel() {
    if (!downloadUrl || isDownloading) {
      return;
    }

    try {
      setIsDownloading(true);
      const response = await fetch(downloadUrl);
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

  return (
    <article className="glass group rounded-2xl p-6 shadow-panel transition-all duration-300 hover:shadow-glow hover:-translate-y-1">
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{project.title}</h3>
          <p className="mt-1 text-sm text-text-muted">{project.original_filename}</p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${statusClass(project.status)}`}>
          {project.status}
        </span>
      </div>
      <div className="grid gap-2 text-sm text-text-muted">
        <p>Created: {new Date(project.created_at).toLocaleString()}</p>
        {isGuest && expiresLabel ? <p>Guest expiry: {expiresLabel}</p> : <p>Owner mode: account</p>}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/projects/${project.id}`}
          className="btn-ghost rounded-full px-4 py-2 text-sm"
        >
          View Project
        </Link>
        {downloadUrl ? (
          <button
            type="button"
            className="btn-gradient rounded-full px-4 py-2 text-sm"
            onClick={onDownloadReel}
            disabled={isDownloading}
          >
            {isDownloading ? "Preparing..." : "Download Reel"}
          </button>
        ) : null}
      </div>
    </article>
  );
}
