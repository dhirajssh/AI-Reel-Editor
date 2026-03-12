import { UploadForm } from "@/components/upload-form";

export default function UploadPage() {
  return (
    <section className="relative overflow-hidden">
      {/* Background orb */}
      <div className="orb orb-purple absolute -right-40 top-0 h-[400px] w-[400px] animate-pulse-glow" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-5 animate-fade-in-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Upload
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-text-primary md:text-5xl">
            Upload your video,{" "}
            <span className="gradient-text">get a reel</span>
          </h1>
          <p className="max-w-xl text-text-muted">
            No account required — just drop your clip. Guest projects stay available for 24 hours.
            Sign in to keep permanent history across devices.
          </p>
          <UploadForm />
        </div>
        <aside className="glass animate-fade-in-up delay-200 rounded-2xl p-7 shadow-glow">
          <h2 className="mb-5 text-lg font-semibold text-text-primary">What this run includes</h2>
          <ul className="grid gap-4 text-sm text-text-muted">
            {[
              "Word-level highlighted captions burned into the final export.",
              "Fixed intro zoom from 0 to 2 seconds.",
              "Vertical 1080×1920 H.264 and AAC output for Reels.",
              "Async processing with live status updates in project detail.",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs text-accent">✓</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
