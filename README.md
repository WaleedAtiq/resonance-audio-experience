# RESONANCE — Audio-Reactive Music Release Page

A single-release page **concept** for a fictional electronic artist. A Three.js orb reacts in real
time to the music through the Web Audio API, inside a scrollable release page.

**Designed & developed by Waleed Atiq.** Concept build to showcase front-end development:
the artist (Halcyon Drift), the label (Night Signal Records) and the release are fictional.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Three.js via React Three Fiber ·
Web Audio API · GSAP ScrollTrigger · Lenis

**Live:** https://resonance-audio-experience.vercel.app

## Run locally

```bash
npm install
npm run dev
```

Other scripts: `npm run build` (production build), `npm run typecheck`, `npm run lint`,
`npm run make-track` (re-renders the audio file, needs `ffmpeg` on the PATH).

## Audio credit

| | |
|---|---|
| Tracks | **Afterglow** (62 s, 124 BPM, A minor) · **Low Tide** (33 s, 118 BPM, D minor) · **Neon Rain** (30 s, 128 BPM, F minor) · **Signal Fade** (35 s, 110 BPM, E minor) |
| Artist | Fictional: *Halcyon Drift* |
| Source | **Self-made.** All four are synthesised from scratch by `scripts/make-track.mjs` (one preset per track: kick, clap, hats, bass, pad, arp, stabs, riser). No samples, no third-party audio. |
| License | Owned by Waleed Atiq. No attribution required. |

The shipped files live in `public/audio/` (160 kbps MP3, 0.6–1.2 MB each; only the chosen track
is downloaded). If you ever swap one for a third-party track, use only royalty-free / Creative
Commons audio and record its title, artist, source URL and license here.

## How the audio drives the visual

```
<audio> ──▶ MediaElementAudioSourceNode ──▶ AnalyserNode ──▶ GainNode (mute) ──▶ speakers
                                                 │
                                                 └──▶ getByteFrequencyData() every frame
                                                      ──▶ bass / mid / high / level (0–1, smoothed)
                                                      ──▶ beat (onset detector on 30–110 Hz)
                                                      ──▶ lib/audioData.ts ──▶ shader uniforms
```

1. **Nothing plays until the user presses Enter.** Browsers block sound until a user gesture,
   so the Hero's button creates the `AudioContext`, resumes it and calls `audio.play()` inside
   the click handler (`components/audio/AudioEngine.ts` → `start()`).
2. **The analyser reads the spectrum 60× a second** and reduces 512 bins to four numbers
   (bass, mid, high, level). Each is smoothed with a fast attack and slow release, so the visual
   swells and relaxes instead of flickering.
3. **Beats are onsets**: a sudden rise in the 30–110 Hz band. A held bass note stays flat; a
   kick jumps. The thresholds were tuned by rendering the track offline and counting hits
   against the known kick pattern.
4. **The values go into shader uniforms** (`components/three/Visualizer.tsx`), never React
   state: no re-renders happen because of audio or scroll. The vertex shader displaces a sphere
   with 3D simplex noise, scaled by bass (big swells), high (fine ripples) and beat (punch);
   the fragment shader blends the two accent colours by the mid band; a particle cloud flares
   on hi-hats and expands on beats.
5. **Mute is a GainNode at the END of the graph**, so the analyser keeps receiving signal and
   the visual keeps reacting while the speakers are silent.
6. **Switching tracks swaps the file, not the graph.** The source node is attached to the
   `<audio>` element, so `playTrack()` only changes `audio.src`; analyser, mute and seek bar keep
   working untouched.

## Project structure

```
app/                 layout, page, globals.css (@theme tokens, components, seek-bar styles)
components/
  audio/             AudioEngine.ts (graph + band split + beat detector), useAudio.ts, TransportBar.tsx
  three/             SceneLoader (WebGL check, idle start), Experience (canvas, warm-up, adaptive dpr), Visualizer (shaders)
  sections/          Hero, ReleaseInfo, Tracklist, About, PreSave, Footer
  Nav, SmoothScroll (Lenis ↔ GSAP), ScrollEffects (.reveal, [data-count]), SectionProgress
lib/
  audioData.ts       the live band values (written by the engine, read by the 3D each frame)
  release.ts         artist / track / tracklist / section data
public/audio/        the track
scripts/             make-track.mjs (renders the track)
```

## Accessibility & performance notes

- Transport controls are real buttons and a native `<input type="range">` (keyboard + screen
  reader friendly, with `aria-valuetext` time announcements). Once playing: Space = play/pause,
  M = mute, ← / → = seek 5 s.
- Buffering shows a spinner on the Enter button, the transport bar and the tracklist row.
- `prefers-reduced-motion`: smooth scroll and reveal animations are disabled, the orb's
  displacement is reduced to 30% (still reactive, much calmer).
- Devices without hardware WebGL get a static CSS orb instead of the 3D scene.
- The 3D starts after the page has painted (idle callback); shaders are compiled before the
  first frame; pixel ratio drops to 1× automatically if the frame rate stays under 45 fps.
- No analytics, no tracking, no external requests beyond the fonts bundled at build time.
- Lighthouse (mobile preset, production build, three runs): performance 89–94, accessibility 100,
  best practices 100, SEO 100. The main lesson from tuning it: never read `window.scrollY`
  inside the frame loop after writing to the DOM; that forced a layout every frame and cost
  seconds of blocking time under CPU throttling. The orb reads a value kept by a passive scroll
  listener instead.

## Deploy

Hosted on Vercel and connected to the GitHub repo: every push to `main` deploys automatically.
No build settings needed.
