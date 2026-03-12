import Link from "next/link";

import { LandingAuthActions } from "@/lib/auth";

export default function HomePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background orbs */}
        <div className="orb orb-purple absolute -left-40 -top-40 h-[500px] w-[500px] animate-pulse-glow" />
        <div className="orb orb-cyan absolute -right-32 top-20 h-[400px] w-[400px] animate-pulse-glow delay-200" />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-24">
          <div className="space-y-8 animate-fade-in-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              AI-Powered Video Editor
            </p>
            <h1 className="max-w-2xl text-5xl font-bold leading-[1.1] tracking-tight text-text-primary md:text-6xl lg:text-7xl">
              Transform your videos into{" "}
              <span className="gradient-text">viral reels</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-text-muted">
              Upload once. AI transcribes with WhisperX, burns word-level captions,
              applies intro zoom, and delivers a 1080×1920 reel-ready MP4.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="btn-gradient rounded-full px-7 py-3.5 text-sm"
                href="/upload"
              >
                Start Creating — It&apos;s Free
              </Link>
              <LandingAuthActions />
            </div>
          </div>

          {/* Feature card */}
          <div className="animate-fade-in-up delay-200">
            <div className="glass rounded-3xl p-1 shadow-glow">
              <div className="rounded-[1.35rem] bg-surface-raised p-8">
                <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  What ships
                </p>
                <ul className="grid gap-5">
                  {[
                    {
                      icon: "💬",
                      title: "AI Captions",
                      desc: "Word-level highlighted captions burned into the final video.",
                    },
                    {
                      icon: "🔍",
                      title: "Intro Zoom",
                      desc: "Fixed 2-second zoom in/out effect to hook viewers instantly.",
                    },
                    {
                      icon: "⚡",
                      title: "Instant Processing",
                      desc: "Async pipeline with live progress polling every 10 seconds.",
                    },
                    {
                      icon: "👤",
                      title: "Flexible Access",
                      desc: "Use as guest (24h) or sign in for permanent project history.",
                    },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-lg">
                        {item.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                        <p className="mt-0.5 text-sm text-text-muted">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative border-t border-white/[0.06] bg-surface-raised/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-3">
          {[
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
              title: "AI Captions",
              desc: "WhisperX transcribes your audio with word-level timestamps, then burns stylized captions directly into the video.",
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-cyan">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                  <path d="M11 8v6" />
                  <path d="M8 11h6" />
                </svg>
              ),
              title: "Intro Zoom Effect",
              desc: "Automatic zoom-in from 0–1s and zoom-out from 1–2s to create a dynamic, attention-grabbing intro.",
            },
            {
              icon: (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-ember">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              ),
              title: "Instant Export",
              desc: "Get a polished 1080×1920 H.264/AAC MP4 optimized for Instagram Reels, TikTok, and YouTube Shorts.",
            },
          ].map((card, i) => (
            <div
              key={card.title}
              className={`glass rounded-2xl p-8 transition-all duration-300 hover:shadow-glow hover:-translate-y-1 animate-fade-in-up delay-${(i + 1) * 100}`}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
                {card.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">{card.title}</h3>
              <p className="text-sm leading-relaxed text-text-muted">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">How it works</p>
            <h2 className="text-3xl font-bold text-text-primary md:text-4xl">Three steps to your reel</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { step: "01", title: "Upload", desc: "Drop your MP4, MOV, or WEBM clip — no account required." },
              { step: "02", title: "Process", desc: "AI transcribes, applies intro zoom, and burns captions." },
              { step: "03", title: "Download", desc: "Grab your 1080×1920 reel-ready MP4 and post it." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <span className="gradient-text text-5xl font-bold">{item.step}</span>
                <h3 className="mt-4 text-lg font-semibold text-text-primary">{item.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
