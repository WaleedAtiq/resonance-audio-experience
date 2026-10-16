# CLAUDE.md — Project Context for Claude Code

## What this project is
**RESONANCE** is an **audio-reactive music release page** for a fictional electronic artist/track.
A Three.js visual reacts in real time to the music via the Web Audio API, wrapped in a scrollable
single-release page. It is a **portfolio piece** for Waleed Atiq (front-end developer) to showcase on
Upwork — aimed at artists, record labels, and event sites.

**Important:** Concept build, not a real release. Fictional artist and track. Footer credits
"Designed & developed by Waleed Atiq."

## Where this fits (read this)
Waleed already has ECLIPSE (3D watch), PULSE (SaaS), and VOLT (EV configurator) finished. RESONANCE
is a fourth piece. **The portfolio is already very strong. After this, the priority is deploying all
pieces and sending proposals — not building more.** Keep this one focused and don't let it sprawl.

## Owner's skill level & how to help
- Newer to development; must be able to **explain and maintain** everything. Favor clear, commented code.
- Explain *why* as you build, especially the Web Audio wiring — it's the part clients will ask about.

## Tech stack (reuse the ECLIPSE/VOLT patterns)
- **Next.js (App Router) + TypeScript + Tailwind v4 + React Three Fiber + GSAP ScrollTrigger + Lenis.**
- Reuse: fixed full-screen `<Canvas>` loaded client-only; perf setup (adaptive dpr, shader warm-up,
  no-GPU static fallback); smooth scroll (Lenis↔GSAP ticker); `.reveal` + `[data-count]` effects;
  section progress rail. Write per-frame data to refs/uniforms — **no React re-renders from audio or scroll.**

## The audio engine (the core — get this right first)
- **Web Audio graph:** `<audio>` element → `MediaElementAudioSourceNode` → `AnalyserNode` → destination.
  Read `analyser.getByteFrequencyData()` (spectrum) and/or `getByteTimeDomainData()` (waveform) each frame.
- **Autoplay is blocked by browsers.** Audio can only start after a user gesture. So the Hero has a
  clear **"Enter" / Play** button that (a) creates/resumes the `AudioContext` and (b) starts playback.
  Never try to autoplay with sound. Show a muted/idle visual before the user presses play.
- **Band split:** reduce the spectrum to a few meaningful values — bass, low-mid, high — plus overall
  level, and smooth them (ease toward the new value) so the visual pulses instead of jittering.
- Feed those values into the 3D as **uniforms** (shader) or transform/scale targets, read in `useFrame`.
- Provide transport UI: play/pause, a seek bar, current time, mute. Keep it accessible (keyboard + labels).

## The visual (pick one, keep it performant)
- A **displaced sphere/blob** (vertex shader pushes the surface out by bass + noise), or
- a **GPU particle field** that pulses/expands on beats, or
- a **reactive waveform/ribbon**.
Start simple and make it *feel* locked to the music (smoothing + beat emphasis) before adding polish.
Colors shift subtly with the music. Respect `prefers-reduced-motion` (calmer motion, or a static state).

## Audio licensing (hard requirement)
- Use **only royalty-free, Creative Commons, or self-made** audio. Good sources: Free Music Archive,
  ccMixter, Pixabay Music, or a track Waleed made. **Record the track title, artist, source URL and
  license in the README**, and credit as the license requires. **Never use copyrighted commercial music.**
- Keep the file small (a short loop or trimmed clip, compressed, e.g. 128–192 kbps MP3/AAC).

## Page sections (in order)
1. **Hero** — the audio-reactive visual full-bleed, artist + track title, the **Enter/Play** button.
2. **Now playing / transport** — play-pause, seek, time, mute (can live in a persistent bar).
3. **Track / release info** — release date, label (fictional), a short blurb; count-up stats optional.
4. **Tracklist** — a few tracks (clicking one could swap the loaded audio — stretch goal).
5. **About the artist** — short bio, fictional.
6. **Pre-save / CTA** — a demo "Pre-save" / "Listen on…" band (buttons are non-functional demo).
7. **Footer** — links + audio credit + Waleed Atiq credit.

## Suggested structure
```
app/            layout, page, globals.css (@theme tokens)
components/
  three/   SceneLoader, Experience, Visualizer (the reactive mesh/particles + shader)
  audio/   AudioEngine.ts (graph + analyser + band split), useAudio hook, TransportBar.tsx
  sections/  Hero, ReleaseInfo, Tracklist, About, PreSave, Footer
  SmoothScroll, ScrollEffects, SectionProgress, Nav
lib/
  audioData.ts   shared live band values (bass/mid/high/level) read by the 3D each frame
  release.ts     track + artist + tracklist data
public/audio/    the royalty-free track (credited in README)
```

## Build order
1. Scaffold Next.js. Get a basic reactive visual working from a test tone/track first.
2. Build the audio engine (graph + analyser + smoothed band split) behind an Enter/Play gesture.
3. Wire bands → shader uniforms; make the visual feel locked to the beat.
4. Transport bar (play/pause/seek/mute), accessible.
5. Build the page sections + scroll reveals.
6. Reduced-motion path, responsive pass, `npm run build`, Lighthouse, no-GPU fallback.

## Guardrails
- **Only royalty-free / CC / self-made audio**, credited in the README. No copyrighted music, ever.
- Fictional artist/label; no real brand names or logos.
- Audio only starts on a user gesture; never autoplay with sound.
- No analytics/tracking/external calls beyond the audio file.
- Keep it fast (judged on mobile); write audio/scroll data via refs/uniforms, not React state.
- Explain changes so the owner can defend the code in a client call.
