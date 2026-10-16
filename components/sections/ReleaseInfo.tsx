import { RELEASE, TRACKS } from "@/lib/release";

const FACTS = [
  { label: "Release date", value: RELEASE.releaseDateLabel },
  { label: "Label", value: RELEASE.label },
  { label: "Catalogue", value: RELEASE.catalog },
  { label: "Key", value: RELEASE.key },
];

// Numbers count up from 0 when scrolled into view ([data-count], see ScrollEffects.tsx).
const STATS = [
  { value: RELEASE.bpm, unit: "BPM", label: "Tempo" },
  { value: 32, unit: "bars", label: "One chord loop" },
  { value: TRACKS.length, unit: "tracks", label: "On the EP" },
];

export default function ReleaseInfo() {
  return (
    <section id="release" className="section">
      <div className="grid gap-12 desktop:grid-cols-[1.1fr_1fr] desktop:gap-20">
        <div>
          <div className="eyebrow reveal">01 — The release</div>
          <h2 className="heading reveal">
            One chord loop.
            <br />
            <span className="font-normal text-muted">Sixty-two seconds of build.</span>
          </h2>
          <p className="lead reveal">{RELEASE.blurb}</p>

          <div className="reveal mt-10 flex flex-wrap gap-8 desktop:gap-12">
            {STATS.map((s) => (
              <div key={s.label}>
                <b className="font-display block text-[30px] font-bold">
                  <span data-count={s.value}>{s.value}</span>
                  <span className="ml-1 text-[15px] font-medium text-muted">{s.unit}</span>
                </b>
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass reveal self-start p-7 desktop:p-9">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-7">
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt className="label mb-1.5">{f.label}</dt>
                <dd className="font-display text-[18px] font-bold">{f.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-7 border-t border-line pt-6 text-[13px] text-muted">
            Lead single · {RELEASE.format} · stereo master
          </p>
        </div>
      </div>
    </section>
  );
}
