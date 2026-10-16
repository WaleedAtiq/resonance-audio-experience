"use client";

import { audioEngine } from "@/components/audio/AudioEngine";
import { useAudio } from "@/components/audio/useAudio";
import { RELEASE, TRACKS } from "@/lib/release";

/*
 * The EP tracklist. Every row is a real play button wired to the same engine
 * as the hero and the transport bar. Clicking a different track swaps the file
 * in the <audio> element (see AudioEngine.playTrack); clicking the current one
 * toggles play/pause. Only the chosen file is ever downloaded.
 */
export default function Tracklist() {
  const { playing, loading, trackId } = useAudio();

  return (
    <section id="tracklist" className="section">
      <div className="eyebrow reveal">02 — Tracklist</div>
      <h2 className="heading reveal">{RELEASE.title} EP</h2>
      <p className="lead reveal mb-10">Four tracks. Preview any of them here; the full EP lands {RELEASE.releaseDateLabel}.</p>

      <ol className="reveal divide-y divide-line border-y border-line">
        {TRACKS.map((t) => {
          const isCurrent = t.id === trackId;
          const isLive = isCurrent && playing;
          const isLoading = isCurrent && loading;
          return (
            <li key={t.id} className={`flex items-center gap-4 py-4 transition-colors desktop:gap-6 desktop:py-5 ${isCurrent ? "text-ink" : ""}`}>
              <span className={`w-6 font-mono text-[12px] tabular-nums ${isCurrent ? "text-accent" : "text-muted"}`}>
                {String(t.n).padStart(2, "0")}
              </span>

              <button
                className={`icon-btn shrink-0 border ${isCurrent ? "border-accent/60" : "border-line"}`}
                onClick={() => audioEngine.playTrack(t)}
                aria-label={isLive ? `Pause ${t.title}` : `Play ${t.title}`}
                aria-pressed={isLive}
              >
                {isLoading ? (
                  <span className="spinner" aria-hidden="true" />
                ) : isLive ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="font-display text-[17px] font-bold">{t.title}</p>
                <p className="text-[12px] text-muted">{isLive ? "Now playing" : isLoading ? "Loading…" : t.meta}</p>
              </div>

              {/* Tiny "equaliser" that only animates while this track plays */}
              {isLive && (
                <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="eq-bar w-[3px] rounded-sm bg-accent-2" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </span>
              )}

              <span className="font-mono text-[12px] tabular-nums text-muted">{t.duration}</span>
            </li>
          );
        })}
      </ol>
      <p className="reveal mt-4 text-[12px] text-muted">Short loop previews. Space = play/pause · M = mute · ← → = seek.</p>
    </section>
  );
}
