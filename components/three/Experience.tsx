"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Visualizer from "./Visualizer";

/*
 * The 3D layer: ONE full-screen <canvas>, fixed BEHIND the page. The HTML
 * sections scroll on top of it. One canvas = one WebGL context and one render
 * loop, which is much lighter on phones than a canvas per section.
 *
 * The canvas is transparent (alpha), so the page background shows through and
 * the orb appears to float on the page rather than inside a black box.
 */
export default function Experience() {
  // Phones/tablets get a lower pixel-ratio cap: dense screens, weaker GPUs.
  const maxDpr = window.matchMedia("(pointer: coarse)").matches ? 1.5 : 1.75;

  // Don't draw a single frame until the shaders are compiled (ShaderWarmup),
  // so the first frame never freezes the page.
  const [compiled, setCompiled] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, maxDpr]}
        frameloop={compiled ? "always" : "never"}
        camera={{ position: [0, 0, 4.4], fov: 35, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Visualizer />
        <AdaptiveQuality />
        <ShaderWarmup onDone={() => setCompiled(true)} />
      </Canvas>
    </div>
  );
}

/**
 * Safety net for slow devices (same as ECLIPSE / VOLT): if the real frame rate
 * stays below 45 fps, render at 1× pixel ratio (roughly half the pixels on a
 * retina screen). The first 3 seconds are ignored (still warming up).
 */
function AdaptiveQuality() {
  const setDpr = useThree((state) => state.setDpr);
  const stats = useRef({ elapsed: 0, time: 0, frames: 0, lowered: false });

  useFrame((_, delta) => {
    const s = stats.current;
    if (s.lowered) return;
    s.elapsed += delta;
    if (s.elapsed < 3) return;
    s.time += delta;
    s.frames += 1;
    if (s.time >= 2) {
      if (s.frames / s.time < 45) {
        setDpr(1);
        s.lowered = true;
      }
      s.time = 0;
      s.frames = 0;
    }
  });

  return null;
}

/** Compile every shader in the background before the first frame. */
function ShaderWarmup({ onDone }: { onDone: () => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    let cancelled = false;
    gl.compileAsync(scene, camera).then(() => {
      if (!cancelled) onDone();
    });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, onDone]);

  return null;
}
