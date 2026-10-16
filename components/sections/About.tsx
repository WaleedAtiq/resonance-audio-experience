import { ARTIST_BIO, RELEASE } from "@/lib/release";

export default function About() {
  return (
    <section id="about" className="section">
      <div className="grid items-center gap-12 desktop:grid-cols-[0.8fr_1.2fr] desktop:gap-20">
        {/* "Portrait": a gradient panel rather than a stock photo of a person
            who doesn't exist. Keeps the page honest about being a concept. */}
        <div className="reveal relative mx-auto aspect-[4/5] w-full max-w-[380px] overflow-hidden rounded-[28px] border border-line">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgb(255_92_168_/_0.55),transparent_50%),radial-gradient(circle_at_75%_80%,rgb(92_225_255_/_0.45),transparent_55%),linear-gradient(160deg,#141026,#06060a)]" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="label">Artist</p>
            <p className="font-display text-[26px] font-extrabold">{RELEASE.artist}</p>
          </div>
        </div>

        <div>
          <div className="eyebrow reveal">03 — The artist</div>
          <h2 className="heading reveal">Slow builds, long decays.</h2>
          {ARTIST_BIO.map((p) => (
            <p key={p} className="lead reveal mb-5">
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
