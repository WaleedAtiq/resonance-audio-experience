import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollEffects from "@/components/ScrollEffects";
import SectionProgress from "@/components/SectionProgress";
import SceneLoader from "@/components/three/SceneLoader";
import TransportBar from "@/components/audio/TransportBar";
import Hero from "@/components/sections/Hero";
import ReleaseInfo from "@/components/sections/ReleaseInfo";
import Tracklist from "@/components/sections/Tracklist";
import About from "@/components/sections/About";
import PreSave from "@/components/sections/PreSave";
import Footer from "@/components/sections/Footer";

/*
 * This page is a Server Component: the section text is rendered to plain HTML
 * on the server, which is fast and SEO-friendly. Only the interactive pieces
 * (3D scene, audio, scroll, nav) are "use client" components.
 *
 * Section order must match SECTIONS in lib/release.ts (nav + progress rail).
 */
export default function Home() {
  return (
    <>
      <SmoothScroll />
      <ScrollEffects />
      <SceneLoader />
      {/* CSS fallback orb, only shown when WebGL is unavailable (see SceneLoader) */}
      <div className="orb-poster" aria-hidden="true" />
      <Nav />
      <SectionProgress />

      <main>
        <Hero />
        <ReleaseInfo />
        <Tracklist />
        <About />
        <PreSave />
      </main>

      <Footer />
      <TransportBar />
    </>
  );
}
