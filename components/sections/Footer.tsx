import { RELEASE, SECTIONS } from "@/lib/release";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-line bg-bg/80 px-[22px] pb-28 pt-10 text-[13px] text-muted backdrop-blur desktop:px-8 desktop:pb-32">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 desktop:flex-row desktop:items-end desktop:justify-between">
        <div>
          <div className="font-display text-[15px] font-bold tracking-[0.35em] text-ink">
            RES<span className="text-accent">O</span>NANCE
          </div>
          <nav aria-label="Footer" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="hover:text-ink">
                {s.label}
              </a>
            ))}
          </nav>
          <p className="mt-4">
            Concept build. {RELEASE.artist} and {RELEASE.label} are fictional.
          </p>
          <p className="mt-1">
            Designed &amp; developed by <span className="text-ink">Waleed Atiq</span>.
          </p>
        </div>

        <p className="max-w-[460px] text-[12px] leading-relaxed desktop:text-right">
          Audio: &ldquo;{RELEASE.title}&rdquo; was written and rendered entirely in code for this concept (see{" "}
          <code className="text-ink/80">scripts/make-track.mjs</code>). No samples, no third-party music. Visual built with Three.js and the
          Web Audio API.
        </p>
      </div>
    </footer>
  );
}
