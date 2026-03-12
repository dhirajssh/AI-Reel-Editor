import type { ReactNode } from "react";
import Link from "next/link";

import { HeaderAuthControls } from "@/lib/auth";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-50 border-b border-slate-300/60 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-sm font-bold tracking-wide text-text-primary">AI Reel Editor</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              className="rounded-full px-4 py-2 text-sm text-text-muted transition-colors hover:bg-slate-800/6 hover:text-text-primary"
              href="/upload"
            >
              Upload
            </Link>
            <Link
              className="rounded-full px-4 py-2 text-sm text-text-muted transition-colors hover:bg-slate-800/6 hover:text-text-primary"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <div className="ml-2 flex items-center gap-2">
              <HeaderAuthControls />
            </div>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-slate-300/60 bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <p className="text-xs text-text-muted/60">
            © 2025 AI Reel Editor. All rights reserved.
          </p>
          <p className="text-xs text-text-muted/60">
            Guest history lasts 24 hours. Create an account for permanent access.
          </p>
        </div>
      </footer>
    </div>
  );
}
