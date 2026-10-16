/*
 * All the "content" of the page lives here, so changing the artist name, the
 * tracklist or the release date never means hunting through components.
 * Everything is fictional: this is a concept build, not a real release.
 */

export const RELEASE = {
  artist: "Halcyon Drift",
  title: "Afterglow",
  format: "Single",
  label: "Night Signal Records", // fictional label
  catalog: "NSR-014",
  releaseDate: "2026-11-06",
  releaseDateLabel: "6 Nov 2026",
  bpm: 124,
  key: "A minor",
  blurb:
    "Afterglow is the lead single from the forthcoming EP of the same name: a slow-opening, sidechained house record built around one chord loop and a lot of patience. Press play and watch the room breathe with it.",
};

export type Track = {
  id: string;
  n: number;
  title: string;
  duration: string;
  /* Every file is self-made: rendered by scripts/make-track.mjs, so there is no
     third-party license to worry about (see README → Audio credit). */
  src: string;
  meta: string; // shown under the title in the tracklist
};

export const TRACKS: Track[] = [
  { id: "afterglow", n: 1, title: "Afterglow", duration: "1:02", src: "/audio/afterglow.mp3", meta: "Lead single · 124 BPM · A minor" },
  { id: "low-tide", n: 2, title: "Low Tide", duration: "0:33", src: "/audio/low-tide.mp3", meta: "118 BPM · D minor" },
  { id: "neon-rain", n: 3, title: "Neon Rain", duration: "0:30", src: "/audio/neon-rain.mp3", meta: "128 BPM · F minor" },
  { id: "signal-fade", n: 4, title: "Signal Fade", duration: "0:35", src: "/audio/signal-fade.mp3", meta: "110 BPM · E minor" },
];

/** The track that loads first (the lead single). */
export const LEAD_TRACK = TRACKS[0];

export const ARTIST_BIO = [
  "Halcyon Drift is the studio alias of a producer working out of a converted radio room on the North Sea coast. The project started as a way to use up a drawer of broken hardware and became an obsession with slow builds and long decays.",
  "Afterglow follows two sold-out white-label 12″s and a handful of late-night radio sessions. It is the first release to pair the music with a reactive visual, built to be watched as much as heard.",
];

/* Section list: shared by the nav, the progress rail and the page, so they can
   never drift apart. Order = order on the page. */
export const SECTIONS = [
  { id: "hero", label: "Listen" },
  { id: "release", label: "Release" },
  { id: "tracklist", label: "Tracklist" },
  { id: "about", label: "Artist" },
  { id: "presave", label: "Pre-save" },
] as const;
