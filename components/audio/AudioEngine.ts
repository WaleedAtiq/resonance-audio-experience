import { audioData } from "@/lib/audioData";

/*
 * AudioEngine — the Web Audio graph and the "band split".
 *
 * THE GRAPH (what a client will ask about):
 *
 *   <audio> element ──▶ MediaElementAudioSourceNode ──▶ AnalyserNode ──▶ GainNode ──▶ speakers
 *                                                            │
 *                                                            └──▶ we READ the spectrum from here, 60×/s
 *
 *  • The <audio> element does the hard work: streaming the MP3, decoding it,
 *    seeking, looping. We don't decode anything ourselves.
 *  • MediaElementAudioSourceNode takes the element's sound and hands it to the
 *    graph as a signal we can route anywhere.
 *  • AnalyserNode does NOT change the sound. It passes it through untouched and,
 *    on request, gives us a snapshot of the frequency content (an FFT).
 *  • GainNode is our mute. If we muted the <audio> element instead, the analyser
 *    would go silent too and the visual would stop reacting. Muting at the END
 *    of the graph keeps the data flowing while the speakers stay quiet.
 *
 * THE RULE THAT SHAPES EVERYTHING: browsers block sound until the user interacts
 * with the page. An AudioContext created before a click starts "suspended",
 * and audio.play() is rejected. So `start()` must be called from a click
 * handler (the Hero's Enter button), and nothing is created before that.
 */

export type EngineStatus = {
  started: boolean; // the user has pressed Enter at least once
  playing: boolean;
  loading: boolean; // true while the browser is still buffering the file
  muted: boolean;
  duration: number; // seconds, 0 until the file's metadata has loaded
  trackId: string | null; // which entry of lib/release.ts TRACKS is loaded
  error: string | null;
};

export type TrackSource = { id: string; src: string };

type StatusListener = (status: EngineStatus) => void;
type FrameListener = (currentTime: number, duration: number) => void;

// How much of each 0–255 analyser value counts as "full". Hi-hats are quiet in
// the spectrum compared to a kick drum, so the high band gets more gain.
const BAND_GAIN = { bass: 1.0, mid: 1.05, high: 1.35, level: 1.0 };

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gain: GainNode | null = null;
  private spectrum = new Uint8Array(0); // reused every frame: no per-frame allocation

  private raf = 0;
  private lastFrame = 0;
  private bassHistory: number[] = []; // recent bass energy, for beat detection
  private lastBeatAt = 0;

  private statusListeners = new Set<StatusListener>();
  private frameListeners = new Set<FrameListener>();

  status: EngineStatus = { started: false, playing: false, loading: false, muted: false, duration: 0, trackId: null, error: null };

  /* ---------- Setup ---------- */

  /**
   * Create the <audio> element and start downloading the file. Safe to call
   * before any click: downloading is allowed, only PLAYING needs a gesture.
   * Called once from the useAudio hook.
   */
  preload(track: TrackSource) {
    if (this.audio || typeof window === "undefined") return;
    const audio = new Audio();
    audio.src = track.src;
    audio.preload = "auto";
    audio.loop = true; // every track is a loop: keep the visual going
    audio.addEventListener("play", () => this.setStatus({ playing: true }));
    audio.addEventListener("pause", () => this.setStatus({ playing: false }));
    audio.addEventListener("durationchange", () => this.setStatus({ duration: audio.duration || 0 }));
    // Buffering: "waiting" fires when playback stalls for data, "playing" /
    // "canplay" when there is enough again. Drives the spinners in the UI.
    audio.addEventListener("waiting", () => this.setStatus({ loading: true }));
    audio.addEventListener("playing", () => this.setStatus({ loading: false }));
    audio.addEventListener("canplay", () => this.setStatus({ loading: false }));
    audio.addEventListener("error", () => this.setStatus({ loading: false, error: "The audio file could not be loaded." }));
    this.audio = audio;
    this.status = { ...this.status, trackId: track.id };

    // Dev only: lets you inspect the live numbers from the browser console with
    // `__resonance.audioData` (handy when tuning BAND_GAIN or the beat detector).
    if (process.env.NODE_ENV === "development") Object.assign(window, { __resonance: { audioData, engine: this } });
  }

  /** Builds the graph above. Runs once, inside the first user gesture. */
  private buildGraph() {
    if (!this.audio || this.ctx) return;
    const ctx = new AudioContext();
    // NOTE: createMediaElementSource may only be called ONCE per element. After
    // this, the element's sound exists only inside the graph.
    const source = ctx.createMediaElementSource(this.audio);
    const analyser = ctx.createAnalyser();
    // fftSize 1024 → 512 frequency "bins", each ≈ 43 Hz wide at 44.1 kHz.
    // Plenty for bass/mid/high, and cheap to compute.
    analyser.fftSize = 1024;
    // The analyser's own smoothing (0–1). Kept low: we do nicer, asymmetric
    // smoothing ourselves below.
    analyser.smoothingTimeConstant = 0.3;
    // getByteFrequencyData maps decibels onto 0–255 between these two values.
    // The defaults (-100 … -30 dB) are tuned for quiet signals; a modern,
    // loud master pins everything at 255. This window keeps the kicks and the
    // gaps between them distinguishable. (Measured on the shipped track.)
    analyser.minDecibels = -85;
    analyser.maxDecibels = -15;
    const gain = ctx.createGain();

    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(ctx.destination);

    this.ctx = ctx;
    this.analyser = analyser;
    this.gain = gain;
    this.spectrum = new Uint8Array(analyser.frequencyBinCount);
  }

  /* ---------- Transport ---------- */

  /** Call from a click. Creates the graph (first time) and starts playback. */
  async start() {
    if (!this.audio) return;
    try {
      this.buildGraph();
      // Both of these must happen INSIDE the click (not after an await), or
      // iOS forgets that the user ever tapped and blocks the sound.
      const resumed = this.ctx!.state === "suspended" ? this.ctx!.resume() : Promise.resolve();
      const played = this.audio.play();
      await Promise.all([resumed, played]);
      this.setStatus({ started: true, error: null });
      this.startLoop();
    } catch (err) {
      console.error("RESONANCE: playback failed", err);
      this.setStatus({ error: "Playback was blocked. Tap play to try again." });
    }
  }

  toggle() {
    if (!this.audio) return;
    if (!this.status.started || this.audio.paused) void this.start();
    else this.audio.pause();
  }

  /**
   * Switch to another track (the tracklist rows). Clicking the track that is
   * already loaded just toggles play/pause. Otherwise the <audio> element gets
   * the new file: the graph stays as it is, because the MediaElementSourceNode
   * is attached to the ELEMENT, not to the file. Everything (analyser, mute,
   * seek bar) keeps working with zero re-wiring.
   *
   * Call this from a click handler: the first play of a new file counts as a
   * new playback for iOS, which wants it inside a gesture.
   */
  playTrack(track: TrackSource) {
    if (!this.audio) return;
    if (this.status.trackId === track.id) {
      this.toggle();
      return;
    }
    this.audio.src = track.src;
    this.audio.load(); // start fetching right away
    this.bassHistory.length = 0;
    this.setStatus({ trackId: track.id, duration: 0, loading: true, error: null });
    this.notifyFrame(); // reset the seek bar to 0:00
    void this.start();
  }

  pause() {
    this.audio?.pause();
  }

  seek(seconds: number) {
    if (!this.audio || !Number.isFinite(seconds)) return;
    this.audio.currentTime = Math.max(0, Math.min(seconds, this.status.duration || seconds));
    this.notifyFrame(); // move the seek bar immediately, even while paused
  }

  setMuted(muted: boolean) {
    if (this.gain && this.ctx) {
      // A tiny ramp (15 ms) instead of an instant jump avoids an audible click.
      this.gain.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.015);
    }
    this.setStatus({ muted });
  }

  get currentTime() {
    return this.audio?.currentTime ?? 0;
  }

  /* ---------- The per-frame analysis ---------- */

  private startLoop() {
    if (this.raf) return;
    this.lastFrame = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  private loop = (now: number) => {
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000); // seconds since last frame, capped
    this.lastFrame = now;

    this.analyse(dt);
    this.notifyFrame();

    audioData.playing = this.status.playing;
    // Keep running while there is sound, and a little longer so the values
    // can decay to zero after a pause instead of freezing mid-swell.
    const energy = audioData.bass + audioData.mid + audioData.high + audioData.beat;
    if (this.status.playing || energy > 0.003) {
      this.raf = requestAnimationFrame(this.loop);
    } else {
      this.raf = 0;
      audioData.bass = audioData.mid = audioData.high = audioData.level = audioData.beat = 0;
    }
  };

  /**
   * The band split. Reads the spectrum and reduces 512 numbers to four:
   * bass / mid / high / level, each 0–1 and smoothed. Then detects beats.
   */
  private analyse(dt: number) {
    const { analyser, ctx } = this;
    if (!analyser || !ctx || !this.status.playing) {
      // Paused: ease everything back to rest.
      audioData.bass = ease(audioData.bass, 0, dt, 6);
      audioData.mid = ease(audioData.mid, 0, dt, 6);
      audioData.high = ease(audioData.high, 0, dt, 6);
      audioData.level = ease(audioData.level, 0, dt, 6);
      audioData.beat = Math.max(0, audioData.beat - dt * 4);
      return;
    }

    // Fills `spectrum` with 0–255 loudness values, one per frequency bin.
    analyser.getByteFrequencyData(this.spectrum);

    const binHz = ctx.sampleRate / analyser.fftSize; // ≈ 43 Hz per bin
    const bass = this.average(30, 160, binHz) * BAND_GAIN.bass;
    const kick = this.average(30, 110, binHz); // narrower sub band, for the beat detector only
    const mid = this.average(160, 1200, binHz) * BAND_GAIN.mid;
    const high = this.average(2000, 9000, binHz) * BAND_GAIN.high;
    const level = this.average(30, 10000, binHz) * BAND_GAIN.level;

    // Asymmetric smoothing: jump up fast (so hits land on time), fall slowly
    // (so the visual relaxes instead of jittering).
    audioData.bass = smooth(audioData.bass, bass, dt);
    audioData.mid = smooth(audioData.mid, mid, dt);
    audioData.high = smooth(audioData.high, high, dt);
    audioData.level = smooth(audioData.level, level, dt);

    // Beat detection = ONSET detection: a kick is a sudden RISE in low energy.
    // We compare the current value with the lowest of the last few frames
    // (≈100 ms). A sustained bass note stays flat and never triggers; a kick
    // jumps by 0.12+ in a frame or two. The thresholds were tuned by rendering
    // the track offline and counting hits against the known kick pattern
    // (16 per 4 bars in the full sections, 0 in the intro).
    const history = this.bassHistory;
    history.push(kick);
    if (history.length > 6) history.shift();
    const recentMin = Math.min(...history);
    const now = performance.now();
    const isOnset = kick > 0.45 && kick - recentMin > 0.12;
    if (isOnset && now - this.lastBeatAt > 220) {
      // 220 ms minimum gap = max ~270 BPM, so one kick never counts twice
      this.lastBeatAt = now;
      audioData.beat = 1;
    } else {
      audioData.beat = Math.max(0, audioData.beat - dt * 4); // fades out over 0.25 s
    }
  }

  /** Average spectrum value between two frequencies, scaled to 0–1. */
  private average(fromHz: number, toHz: number, binHz: number) {
    const from = Math.max(0, Math.floor(fromHz / binHz));
    const to = Math.min(this.spectrum.length - 1, Math.ceil(toHz / binHz));
    let sum = 0;
    for (let i = from; i <= to; i++) sum += this.spectrum[i];
    return Math.min(1, sum / (to - from + 1) / 255);
  }

  /* ---------- Listeners (how React finds out) ---------- */

  /** Status changes are rare (play/pause/mute…), so these may set React state. */
  subscribe(listener: StatusListener) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /** Called every frame while playing: for DOM writes through refs ONLY. */
  subscribeFrame(listener: FrameListener) {
    this.frameListeners.add(listener);
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  private setStatus(patch: Partial<EngineStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach((l) => l(this.status));
  }

  private notifyFrame() {
    const t = this.currentTime;
    const d = this.status.duration;
    this.frameListeners.forEach((l) => l(t, d));
  }
}

/** Fast attack / slow release. `dt` makes it frame-rate independent. */
function smooth(current: number, target: number, dt: number) {
  const speed = target > current ? 28 : 7; // higher = snappier
  return ease(current, target, dt, speed);
}

function ease(current: number, target: number, dt: number, speed: number) {
  return current + (target - current) * (1 - Math.exp(-speed * dt));
}

// One engine for the whole page (one <audio>, one AudioContext).
export const audioEngine = new AudioEngine();
