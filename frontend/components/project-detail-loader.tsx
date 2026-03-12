"use client";

import { useEffect, useState } from "react";

import { ProjectDetailClient } from "@/components/project-detail-client";
import { getProject } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ProjectDetail } from "@/types";

export function ProjectDetailLoader({ projectId }: { projectId: number }) {
  const { token } = useAuth();
  const [project, setProject] = useState<ProjectDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getProject(projectId, { token });
      setProject(data);
    };

    void load();
  }, [projectId, token]);

  if (!project) {
    return (
      <div className="flex items-center gap-3 py-20 text-text-muted">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">Loading project…</span>
      </div>
    );
  }

  return <ProjectDetailClient initialProject={project} projectId={projectId} />;
}
