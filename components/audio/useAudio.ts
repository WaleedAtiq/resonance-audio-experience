"use client";

import { useEffect, useState } from "react";
import { audioEngine, type EngineStatus } from "./AudioEngine";
import { LEAD_TRACK } from "@/lib/release";

/*
 * React's window onto the engine. Components that need to know "is it
 * playing?" or "is it muted?" use this. Those values change a handful of
 * times per session, so React state is the right tool for them.
 *
 * Per-frame data (current time, band levels) is deliberately NOT here: see
 * audioEngine.subscribeFrame() and lib/audioData.ts.
 */
export function useAudio(): EngineStatus {
  const [status, setStatus] = useState<EngineStatus>(audioEngine.status);

  useEffect(() => {
    audioEngine.preload(LEAD_TRACK); // start the download early; harmless to repeat
    return audioEngine.subscribe(setStatus);
  }, []);

  return status;
}

/** Formats seconds as m:ss for the transport bar. */
export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
