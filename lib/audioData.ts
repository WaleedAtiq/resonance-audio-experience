/*
 * The live audio values, shared between the audio engine (the only WRITER) and
 * the 3D visual (the READER). This is deliberately a plain mutable object and
 * NOT React state.
 *
 * Why: the analyser produces new numbers 60 times a second. Putting them in
 * React state would re-render components 60 times a second, which is exactly
 * what makes pages like this stutter. Instead, the engine overwrites these
 * fields each frame and the visual reads them inside its own render loop
 * (useFrame) and copies them straight into shader uniforms. No React involved.
 *
 * All values are 0–1 and already smoothed (fast attack, slow release), so the
 * visual swells and relaxes instead of flickering.
 */
export const audioData = {
  bass: 0, // ~30–160 Hz: kick drum + bass line. Drives the big swells.
  mid: 0, // ~160–1200 Hz: chords, claps, the "body" of the music. Shifts colour.
  high: 0, // ~2–9 kHz: hi-hats, air. Drives the fine ripples and the particles.
  level: 0, // overall loudness.
  beat: 0, // jumps to 1 on a detected beat, then decays over ~0.25 s. For "punch".
  playing: false,
};

export type AudioData = typeof audioData;
