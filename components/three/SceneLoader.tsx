"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Three.js needs a real browser (WebGL, window, canvas), so it can't render on
// the server. `ssr: false` loads the 3D code only in the browser, as a separate
// JavaScript chunk, so the page's text appears before Three.js has downloaded.
const Experience = dynamic(() => import("./Experience"), { ssr: false });

/*
 * Decides IF and WHEN to start the 3D (same approach as ECLIPSE / VOLT):
 *
 * 1. IF: on devices without hardware graphics acceleration, WebGL is emulated
 *    on the CPU and would crawl. `failIfMajorPerformanceCaveat: true` refuses
 *    to create a context in that case; those visitors get the CSS orb instead
 *    (the `no-3d` class on <html> shows .orb-poster, see globals.css).
 *
 * 2. WHEN: after the page has painted and the browser is idle, so the 3D set-up
 *    never delays the text appearing (good for users, and for Lighthouse's LCP).
 */
export default function SceneLoader() {
  const [start, setStart] = useState(false);

  useEffect(() => {
    const probe = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!probe) {
      document.documentElement.classList.add("no-3d");
      return;
    }
    probe.getExtension("WEBGL_lose_context")?.loseContext(); // free the test context right away

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setStart(true), { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setStart(true), 300); // Safari has no requestIdleCallback
    return () => window.clearTimeout(id);
  }, []);

  return start ? <Experience /> : null;
}
