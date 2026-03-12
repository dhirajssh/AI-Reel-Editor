"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { createProject, uploadProjectVideo } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export function UploadForm() {
  const router = useRouter();
  const { token, isSignedIn } = useAuth();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus("Select a video file first.");
      return;
    }

    setBusy(true);
    try {
      setStatus("Creating project…");
      const project = await createProject(title || file.name.replace(/\.[^/.]+$/, ""), {
        token,
      });
      setStatus("Uploading video…");
      await uploadProjectVideo(project.id, file, {
        token,
      });
      router.push(`/projects/${project.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass rounded-2xl p-7 shadow-panel"
    >
      <div className="grid gap-6">
        {/* Mode badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm">
          <p className="text-text-muted">
            {isSignedIn
              ? "Signed in — this project will be saved to your account."
              : "Guest mode — project available for 24 hours in this browser."}
          </p>
          <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${isSignedIn
            ? "bg-accent/20 text-accent"
            : "bg-white/10 text-text-muted"
            }`}>
            {isSignedIn ? "Account" : "Guest only"}
          </span>
        </div>

        {/* Title */}
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-text-primary">Project title</span>
          <input
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-text-primary placeholder:text-text-muted/50 transition-colors focus:border-accent/50 focus:bg-white/[0.06]"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="My Instagram Reel"
          />
        </label>

        {/* File drop zone */}
        <label
          className={`grid min-h-52 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragOver
            ? "border-accent bg-accent/10"
            : "border-white/15 bg-white/[0.02] hover:border-accent/40 hover:bg-white/[0.04]"
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const droppedFile = e.dataTransfer.files?.[0];
            if (droppedFile) setFile(droppedFile);
          }}
        >
          <input
            className="hidden"
            type="file"
            accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
          />
          <div className="grid gap-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="max-w-sm text-sm text-text-muted">
              Drag &amp; drop a video or click to browse. Supports MP4, MOV, and WEBM.
            </p>
            <span className="mx-auto rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-text-primary transition-colors hover:border-accent/40">
              {file ? "Change file" : "Choose file"}
            </span>
            {file ? (
              <span className="mx-auto rounded-lg bg-accent/10 px-4 py-2 text-xs text-accent">
                ✓ {file.name}
              </span>
            ) : null}
          </div>
        </label>

        {/* Submit */}
        <button
          className="btn-gradient rounded-full px-6 py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={busy}
          type="submit"
        >
          {busy ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing…
            </span>
          ) : (
            "Create Reel Job"
          )}
        </button>

        {/* Status */}
        <p className="rounded-lg bg-white/[0.04] px-4 py-3 text-sm text-text-muted">{status}</p>
      </div>
    </form>
  );
}
