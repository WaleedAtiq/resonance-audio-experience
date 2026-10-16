"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { audioData } from "@/lib/audioData";

/*
 * The visual: a sphere whose surface is pushed in and out by noise, with the
 * amount of push driven by the music, plus a cloud of "dust" particles around
 * it that flare on the hi-hats and expand on beats.
 *
 * HOW THE MUSIC GETS IN: every frame (useFrame below) we copy the four numbers
 * from lib/audioData into shader UNIFORMS. A uniform is a variable the GPU can
 * read while drawing. The vertex shader then does the actual deforming, for
 * all ~19,000 vertices in parallel. Nothing is recomputed on the CPU and no
 * geometry is re-uploaded; we only change a few numbers per frame.
 *
 *   bass → how far the big slow swells push out, and a subtle overall scale
 *   high → the fine fast ripples, particle brightness
 *   mid  → colour shift between the two accent colours
 *   beat → a short extra "punch" outward and a particle burst
 */

// 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT). Gives smooth,
// organic "random" values from a position: the standard tool for blobs.
const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

const ORB_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uBass;
uniform float uHigh;
uniform float uBeat;
uniform float uMotion; // 1 = normal, lower when the user prefers reduced motion
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vDisp;
${NOISE}

// How far to push the surface out at direction n (a point on the unit sphere).
float displacement(vec3 n) {
  float t = uTime;
  float slow = snoise(n * 1.7 + vec3(0.0, t * 0.22, t * 0.1));   // big, lazy swells
  float fast = snoise(n * 5.5 + vec3(t * 0.8, 0.0, t * 0.5));    // fine ripples
  float swell  = (0.14 + 0.55 * uBass) * slow;
  float ripple = (0.015 + 0.16 * uHigh) * fast;
  float punch  = 0.10 * uBeat;
  return (swell + ripple + punch) * uMotion;
}

void main() {
  vec3 n = normalize(position);
  float radius = 1.0 + 0.06 * uBass * uMotion;

  // Displace the vertex AND two neighbours a tiny step away along the surface,
  // then take the cross product of the two edges: that gives the normal of the
  // displaced surface, which is what makes the bumps actually look lit.
  vec3 tangent = normalize(cross(n, abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 bitangent = cross(n, tangent);
  float eps = 0.02;
  vec3 n1 = normalize(n + tangent * eps);
  vec3 n2 = normalize(n + bitangent * eps);
  float d0 = displacement(n);
  vec3 p0 = n * (radius + d0);
  vec3 p1 = n1 * (radius + displacement(n1));
  vec3 p2 = n2 * (radius + displacement(n2));
  vec3 displacedNormal = normalize(cross(p1 - p0, p2 - p0));

  vDisp = d0;
  vNormal = normalize(normalMatrix * displacedNormal);
  vec4 mv = modelViewMatrix * vec4(p0, 1.0);
  vViewPos = mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const ORB_FRAGMENT = /* glsl */ `
uniform vec3 uColorA; // deep base
uniform vec3 uColorB; // accent (pink)
uniform vec3 uColorC; // accent 2 (cyan)
uniform float uMid;
uniform float uHigh;
uniform float uFade;
varying vec3 vNormal;
varying vec3 vViewPos;
varying float vDisp;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vViewPos);
  vec3 L1 = normalize(vec3(0.6, 0.8, 0.6));
  vec3 L2 = normalize(vec3(-0.8, -0.4, 0.3));
  float d1 = max(dot(N, L1), 0.0);
  float d2 = max(dot(N, L2), 0.0);

  // Fresnel: edges facing away from the camera glow. The classic "energy orb" look.
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.6);

  // Peaks (pushed out) take the warm accent, valleys stay deep; mids tint toward cyan.
  float ridge = smoothstep(-0.15, 0.45, vDisp);
  vec3 base = mix(uColorA, uColorB, ridge);
  base = mix(base, uColorC, uMid * 0.55);

  vec3 col = base * (0.18 + 0.8 * d1) + uColorC * d2 * 0.22;
  col += fresnel * mix(uColorB, uColorC, uHigh) * (0.7 + 0.9 * uHigh);
  col += pow(max(dot(reflect(-L1, N), V), 0.0), 48.0) * 0.45; // small highlight

  gl_FragColor = vec4(col * uFade, 1.0);
}
`;

const DUST_VERTEX = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uBass;
uniform float uHigh;
uniform float uBeat;
uniform float uMotion;
uniform float uPixelRatio;
varying float vAlpha;

void main() {
  float a = uTime * (0.04 + 0.08 * aSeed) * uMotion; // each particle orbits at its own speed
  float c = cos(a), s = sin(a);
  vec3 p = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c);
  p *= 1.0 + (0.12 * uBass + 0.22 * uBeat) * uMotion; // the cloud breathes with the kick
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.5 + 0.5 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 50.0);
  gl_PointSize = (1.2 + 2.2 * aSeed + 3.5 * uHigh * twinkle) * uPixelRatio * (4.5 / -mv.z);
  vAlpha = 0.18 + 0.82 * twinkle * (0.25 + 0.75 * uHigh);
}
`;

const DUST_FRAGMENT = /* glsl */ `
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uHigh;
uniform float uFade;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - 0.5);
  float soft = smoothstep(0.5, 0.08, d); // round, soft-edged dot
  vec3 col = mix(uColorC, uColorB, uHigh * 0.8);
  gl_FragColor = vec4(col, soft * vAlpha * uFade);
}
`;

const DUST_COUNT = 1400;

/*
 * Created ONCE at module level, deliberately outside React. These objects are
 * mutated every frame by useFrame, and React (plus its compiler lint rules)
 * must never own per-frame data. This file is only ever loaded in the browser
 * (SceneLoader imports it with ssr: false), so it is safe to build Three.js
 * objects here.
 */
const uniforms = {
  uTime: { value: 0 },
  uBass: { value: 0 },
  uMid: { value: 0 },
  uHigh: { value: 0 },
  uBeat: { value: 0 },
  uFade: { value: 1 },
  uMotion: { value: 1 }, // 1 = normal, 0.3 when the user prefers reduced motion
  uPixelRatio: { value: 1 },
  uColorA: { value: new THREE.Color("#2a1650") },
  uColorB: { value: new THREE.Color("#ff5ca8") },
  uColorC: { value: new THREE.Color("#5ce1ff") },
};

// Particles: random points in a shell around the orb, each with a random "seed".
function makeDust() {
  const positions = new Float32Array(DUST_COUNT * 3);
  const seeds = new Float32Array(DUST_COUNT);
  for (let i = 0; i < DUST_COUNT; i++) {
    const dir = new THREE.Vector3().randomDirection();
    const r = 1.45 + Math.random() * 1.6;
    dir.multiplyScalar(r).toArray(positions, i * 3);
    seeds[i] = Math.random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geometry;
}
const dust = makeDust();

/*
 * Scroll position, updated by a passive listener. Reading window.scrollY inside
 * the frame loop would force the browser to recompute layout every frame
 * ("forced reflow", flagged by Lighthouse) because other code has just written
 * to the DOM. A listener gives us the number for free.
 */
let scrollProgress = 0;
const onScroll = () => {
  scrollProgress = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

export default function Visualizer() {
  const group = useRef<THREE.Group>(null);
  const reducedMotion = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  // Fit the orb to the screen: on a narrow phone the visible width (in 3D
  // units) is small, so scale the orb down. `viewport` only changes on resize.
  const viewport = useThree((state) => state.viewport);
  const fit = Math.min(1, viewport.width / 2.9);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const motion = reducedMotion ? 0.3 : 1; // calmer, still reactive
    uniforms.uMotion.value = motion;

    // Scroll: as the hero scrolls away, the orb drifts up, shrinks and dims,
    // then stays as a faint reactive presence behind the rest of the page.
    const progress = scrollProgress;
    const ease = progress * progress * (3 - 2 * progress); // smoothstep
    g.position.y = 0.22 + ease * 1.1; // 0.22 = a little above centre, behind the Enter button
    g.scale.setScalar(fit * 0.92 * (1 - 0.45 * ease));
    uniforms.uFade.value = 1 - 0.75 * ease;

    // Copy the live audio numbers into the shaders (the whole point of the page).
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uBass.value = audioData.bass;
    uniforms.uMid.value = audioData.mid;
    uniforms.uHigh.value = audioData.high;
    uniforms.uBeat.value = audioData.beat;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    // Slow idle turn that speeds up with the hi-hats.
    g.rotation.y += delta * (0.06 + 0.25 * audioData.high) * motion;
    g.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.12 * motion;
  });

  return (
    <group ref={group}>
      <mesh>
        {/* 160×120 segments ≈ 19k vertices: smooth enough for the ripples, cheap on phones */}
        <sphereGeometry args={[1, 160, 120]} />
        <shaderMaterial uniforms={uniforms} vertexShader={ORB_VERTEX} fragmentShader={ORB_FRAGMENT} />
      </mesh>
      <points geometry={dust}>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={DUST_VERTEX}
          fragmentShader={DUST_FRAGMENT}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
