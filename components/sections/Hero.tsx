"use client";

import { audioEngine } from "@/components/audio/AudioEngine";
import { useAudio } from "@/components/audio/useAudio";
import { RELEASE, TRACKS } from "@/lib/release";

/*
 * The hero is one full screen. The orb (3D canvas, fixed behind the page) sits
 * in the middle; the title sits along the bottom; the Enter button floats over
 * the orb's centre.
 *
 * The Enter button is the ONLY way sound starts. Browsers require a user
 * gesture before audio can play, so this click both creates the AudioContext
 * and starts playback (see AudioEngine.start). Before the click, the orb
 * idles silently: a slow, muted version of the same animation.
 */
export default function Hero() {
  const { started, loading, error, trackId } = useAudio();
  const track = TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];

  return (
    <header id="hero" className="relative z-10 flex min-h-[100svh] flex-col px-[22px] pb-20 pt-[72px] text-center desktop:pb-24">
      {/* Top: the Enter button, centred in whatever space is left above the title.
          The orb is nudged up in 3D (Visualizer.tsx) so it sits behind this. */}
      <div className="flex flex-1 items-center justify-center">
        <div
          className={`flex flex-col items-center gap-5 transition-opacity duration-500 ${
            started ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <button
            className="enter-btn"
            onClick={() => audioEngine.start()}
            aria-label={`Enter and play ${RELEASE.title}`}
            aria-busy={loading}
            tabIndex={started ? -1 : 0}
          >
            {loading ? (
              <span className="spinner spinner-lg" aria-hidden="true" />
            ) : (
              <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8.5 5.5v13l10-6.5z" />
              </svg>
            )}
          </button>
          <span className="label">{loading ? "Loading…" : "Enter · sound on"}</span>
        </div>
      </div>

      {/* Bottom: the title block */}
      <div>
        <div className="eyebrow">
          {RELEASE.artist} — New {RELEASE.format.toLowerCase()}
        </div>
        <h1 className="font-display text-[clamp(30px,8vw,140px)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em]">
          {RELEASE.title}
        </h1>
        <p className="mx-auto mt-5 max-w-[460px] text-[15px] text-muted desktop:text-[17px]">
          Out {RELEASE.releaseDateLabel} on {RELEASE.label}. The visual is driven live by the music through the Web Audio API.
        </p>
        <p className="label mt-6 min-h-[1.5em]" aria-live="polite">
          {error ? <span className="text-accent">{error}</span> : started ? `Now playing: ${track.title} · scroll to explore` : "Headphones recommended"}
        </p>
      </div>
    </header>
  );
}
