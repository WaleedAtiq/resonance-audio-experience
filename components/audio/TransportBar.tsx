"use client";

import { useEffect, useRef, useState } from "react";
import { audioEngine } from "./AudioEngine";
import { useAudio, formatTime } from "./useAudio";
import { RELEASE, TRACKS } from "@/lib/release";

/*
 * The persistent "now playing" bar at the bottom of the screen. Slides in once
 * the user has pressed Enter. Play/pause, seek, time, mute.
 *
 * Two kinds of updates, handled two different ways:
 *  • rare (play/pause, mute)   → React state via useAudio()
 *  • 60× per second (progress) → written straight to the DOM through refs.
 *    The time label is the exception: it only changes once a second, so a
 *    cheap state update there is fine.
 */
export default function TransportBar() {
  const { started, playing, loading, muted, duration, error, trackId } = useAudio();
  const track = TRACKS.find((t) => t.id === trackId) ?? TRACKS[0];
  const [timeLabel, setTimeLabel] = useState("0:00");
  const seekRef = useRef<HTMLInputElement>(null);
  const scrubbing = useRef(false); // true while the user drags the seek thumb
  const lastSecond = useRef(-1);

  useEffect(() => {
    return audioEngine.subscribeFrame((t, d) => {
      const input = seekRef.current;
      if (!input) return;
      const p = d > 0 ? t / d : 0;
      input.style.setProperty("--p", p.toFixed(4)); // paints the gradient fill
      if (!scrubbing.current) input.value = String(t);
      input.setAttribute("aria-valuetext", `${formatTime(t)} of ${formatTime(d)}`);
      const second = Math.floor(t);
      if (second !== lastSecond.current) {
        lastSecond.current = second;
        setTimeLabel(formatTime(t));
      }
    });
  }, []);

  // Keyboard shortcuts, once playback has started: Space = play/pause,
  // M = mute, ← / → = seek 5 s. Ignored while a text field has focus, and
  // Space is left alone when a button or link has focus (it activates that
  // control, and would otherwise toggle playback twice).
  useEffect(() => {
    if (!started) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.closest("input, select, textarea") || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case " ":
          if (el?.closest("button, a")) return;
          e.preventDefault(); // Space would scroll the page
          audioEngine.toggle();
          break;
        case "m":
        case "M":
          audioEngine.setMuted(!audioEngine.status.muted);
          break;
        case "ArrowLeft":
          audioEngine.seek(audioEngine.currentTime - 5);
          break;
        case "ArrowRight":
          audioEngine.seek(audioEngine.currentTime + 5);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started]);

  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-50 transition-transform duration-500 ease-out desktop:inset-x-auto desktop:bottom-6 desktop:left-1/2 desktop:w-[640px] desktop:-translate-x-1/2 ${
        started ? "translate-y-0" : "translate-y-[140%] desktop:translate-y-[140%]"
      }`}
      aria-hidden={!started}
    >
      <div className="glass px-4 py-3 desktop:px-5">
        {error && <p className="mb-2 text-[12px] text-accent">{error}</p>}
        <div className="flex items-center gap-3 desktop:gap-4">
          <button
            className="icon-btn icon-btn-primary shrink-0"
            onClick={() => audioEngine.toggle()}
            aria-label={loading ? "Loading" : playing ? "Pause" : "Play"}
            aria-busy={loading}
            aria-pressed={playing}
            tabIndex={started ? 0 : -1}
          >
            {loading ? <span className="spinner spinner-dark" aria-hidden="true" /> : playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-[13px]">
                <span className="font-semibold">{track.title}</span>
                <span className="text-muted"> — {RELEASE.artist}</span>
              </p>
              <p className="shrink-0 font-mono text-[12px] tabular-nums text-muted">
                {timeLabel} <span className="opacity-50">/ {formatTime(duration)}</span>
              </p>
            </div>
            <input
              ref={seekRef}
              type="range"
              className="seek mt-1 block"
              min={0}
              max={duration || 1}
              step={0.1}
              defaultValue={0}
              aria-label="Seek"
              tabIndex={started ? 0 : -1}
              onPointerDown={() => (scrubbing.current = true)}
              onPointerUp={() => (scrubbing.current = false)}
              onPointerCancel={() => (scrubbing.current = false)}
              // `input` fires continuously while dragging AND on arrow keys.
              onInput={(e) => audioEngine.seek(Number((e.target as HTMLInputElement).value))}
            />
          </div>

          <button
            className="icon-btn shrink-0"
            onClick={() => audioEngine.setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
            aria-pressed={muted}
            tabIndex={started ? 0 : -1}
          >
            {muted ? <MutedIcon /> : <SoundIcon />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Inline SVG icons: no icon library needed for four glyphs. */
function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  );
}
function SoundIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" stroke="none" />
      <path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" strokeLinecap="round" />
    </svg>
  );
}
function MutedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" stroke="none" />
      <path d="M16 9l5 6M21 9l-5 6" strokeLinecap="round" />
    </svg>
  );
}
