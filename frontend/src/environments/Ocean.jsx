import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uWave;
  varying vec3 vWorld;
  varying vec3 vNormal2;
  float waves(vec2 p) {
    return sin(p.x * 0.18 + uTime * 1.1) * 0.35
         + sin(p.y * 0.23 - uTime * 0.9) * 0.3
         + sin((p.x + p.y) * 0.41 + uTime * 1.7) * 0.12;
  }
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    float h = waves(world.xz) * uWave;
    float e = 0.6;
    float hx = waves(world.xz + vec2(e, 0.0)) * uWave;
    float hz = waves(world.xz + vec2(0.0, e)) * uWave;
    vNormal2 = normalize(vec3(h - hx, e, h - hz));
    world.y += h;
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uDeep;
  uniform vec3 uMurk;
  uniform float uMurkAmount;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform sampler2D uDepth;
  uniform float uSize;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vWorld;
  varying vec3 vNormal2;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), u.x), u.y);
  }

  void main() {
    vec2 uv = vWorld.xz / uSize + 0.5;
    float depth = 1.0;
    if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) depth = texture2D(uDepth, uv).r;
    vec3 col = mix(uShallow, uDeep, smoothstep(0.02, 0.65, depth));
    col = mix(col, uMurk, uMurkAmount * (1.0 - depth * 0.6));

    // shoreline foam
    float n = noise(vWorld.xz * 0.6 + uTime * 0.4);
    float shore = smoothstep(0.07, 0.0, depth) * (0.55 + 0.45 * sin(uTime * 2.0 + depth * 80.0 + n * 3.0));
    // sparkles / whitecaps
    float caps = smoothstep(0.82, 0.95, noise(vWorld.xz * 0.15 + vec2(uTime * 0.15, 0.0))) * 0.25 * depth;

    vec3 viewDir = normalize(cameraPosition - vWorld);
    vec3 n3 = normalize(vNormal2);
    float fres = pow(1.0 - max(dot(viewDir, n3), 0.0), 3.0);
    float diff = max(dot(n3, uSunDir), 0.0);
    vec3 h = normalize(uSunDir + viewDir);
    float spec = pow(max(dot(n3, h), 0.0), 120.0) * 1.4;

    col = col * (0.55 + 0.5 * diff) + fres * vec3(0.55, 0.7, 0.8) * 0.35 + spec * uSunColor;
    col = mix(col, vec3(1.0), clamp(shore + caps, 0.0, 1.0));

    float alpha = mix(0.6, 0.94, smoothstep(0.0, 0.4, depth));
    alpha = max(alpha, shore);

    float dist = length(cameraPosition - vWorld);
    float fog = smoothstep(uFogNear, uFogFar, dist);
    col = mix(col, uFogColor, fog);
    gl_FragColor = vec4(col, alpha);
  }
`;

/** Bake a depth map (0 = shore, 1 = deep) from the layout height function. */
function bakeDepth(layout, res = 128) {
  const data = new Uint8Array(res * res * 4);
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const x = (i / (res - 1) - 0.5) * layout.size;
      const z = (j / (res - 1) - 0.5) * layout.size;
      const h = layout.height(x, z);
      const d = Math.min(1, Math.max(0, -h / (layout.water?.depthScale ?? 6)));
      const k = (j * res + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = d * 255;
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, res, res, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export default function Ocean({ layout, segments = 110, cleanliness = 100, sunDir, sunColor, fog }) {
  const mat = useRef();
  const depthTex = useMemo(() => bakeDepth(layout), [layout]);
  useEffect(() => () => depthTex.dispose(), [depthTex]);
  const w = layout.water || {};
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWave: { value: w.wave ?? 1 },
      uShallow: { value: new THREE.Color(w.shallow || '#4fe3e0') },
      uDeep: { value: new THREE.Color(w.deep || '#0077b6') },
      uMurk: { value: new THREE.Color('#6b7f4a') },
      uMurkAmount: { value: 0 },
      uSunDir: { value: new THREE.Vector3(0.3, 0.6, -0.7).normalize() },
      uSunColor: { value: new THREE.Color('#fff2d0') },
      uDepth: { value: depthTex },
      uSize: { value: layout.size },
      uFogColor: { value: new THREE.Color('#bfe3f0') },
      uFogNear: { value: 120 },
      uFogFar: { value: 420 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [depthTex]
  );

  useEffect(() => {
    // Dirtier destinations get visibly murkier water.
    uniforms.uMurkAmount.value = Math.max(0, (85 - cleanliness) / 100) * 0.9;
  }, [cleanliness, uniforms]);
  useEffect(() => {
    if (sunDir) uniforms.uSunDir.value.copy(sunDir).normalize();
    if (sunColor) uniforms.uSunColor.value.set(sunColor);
    if (fog) {
      uniforms.uFogColor.value.set(fog.color);
      uniforms.uFogNear.value = fog.near;
      uniforms.uFogFar.value = fog.far;
    }
  }, [sunDir, sunColor, fog, uniforms]);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
  });

  return (
    <mesh rotation-x={-Math.PI / 2} position-y={w.level ?? 0} renderOrder={1}>
      <planeGeometry args={[900, 900, segments, segments]} />
      <shaderMaterial ref={mat} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}
