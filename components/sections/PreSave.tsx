import { RELEASE } from "@/lib/release";

/* Demo call-to-action band. The buttons are intentionally non-functional (no
   real stores are linked and no real brands are named: this is a concept). */
const OPTIONS = [
  { label: "Pre-save", note: "Streaming" },
  { label: "Pre-order", note: "Lossless download" },
  { label: "Limited vinyl", note: "300 copies" },
];

export default function PreSave() {
  return (
    <section id="presave" className="section">
      <div className="glass reveal relative overflow-hidden px-7 py-12 text-center desktop:px-16 desktop:py-20">
        <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-accent-2/20 blur-3xl" aria-hidden="true" />

        <div className="relative">
          <div className="eyebrow">04 — Pre-save</div>
          <h2 className="heading">Have it on release day.</h2>
          <p className="lead mx-auto">
            {RELEASE.title} lands {RELEASE.releaseDateLabel}. Pre-save it and the whole EP turns up in your library the moment it is out.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {OPTIONS.map((o, i) => (
              <button key={o.label} type="button" className={i === 0 ? "btn" : "btn-outline py-[14px]"} aria-describedby="presave-note">
                {o.label}
                <span className="opacity-70">· {o.note}</span>
              </button>
            ))}
          </div>
          <p id="presave-note" className="mt-6 text-[12px] text-muted">
            Demo buttons: nothing is linked. Concept build.
          </p>
        </div>
      </div>
    </section>
  );
}
