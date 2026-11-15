import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from '../../characters/Humanoid.jsx';
import { Surfboard } from '../../environments/props.jsx';
import { useGame } from '../../game/store.js';

const vertex = /* glsl */ `
  uniform float uCurl;
  uniform float uHeight;
  uniform float uTime;
  varying float vH;
  varying float vX;
  varying float vZ;
  float sm(float a, float b, float x) { float t = clamp((x - a) / (b - a), 0.0, 1.0); return t * t * (3.0 - 2.0 * t); }
  void main() {
    vec3 p = position;
    float zl = p.z;
    float prof = zl < 0.0 ? exp(-pow(zl / 5.5, 2.0)) : exp(-pow(zl / 1.5, 2.0));
    float ahead = sm(uCurl - 1.0, uCurl + 3.0, p.x) * (1.0 - 0.55 * sm(uCurl + 18.0, uCurl + 50.0, p.x));
    float behind = 1.0 - sm(uCurl - 1.0, uCurl + 1.0, p.x);
    float lateral = ahead + behind * 0.45;
    float h = uHeight * prof * lateral;
    h += sin(p.x * 0.7 + uTime * 3.0) * 0.06 * behind * prof;
    // lip throws forward near the curl
    float lip = sm(uCurl, uCurl + 2.0, p.x) * (1.0 - sm(uCurl + 2.0, uCurl + 8.0, p.x));
    p.z += lip * prof * 0.9;
    p.y += h;
    vH = h / max(uHeight, 0.001);
    vX = p.x - uCurl;
    vZ = zl;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform float uTime;
  varying float vH;
  varying float vX;
  varying float vZ;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec3 deep = vec3(0.02, 0.45, 0.6);
    vec3 face = vec3(0.2, 0.82, 0.82);
    vec3 col = mix(deep, face, smoothstep(0.1, 0.9, vH));
    float foamBehind = (1.0 - smoothstep(-1.0, 1.0, vX)) * smoothstep(0.15, 0.5, vH);
    float n = hash(floor(vec2(vX * 3.0, vZ * 3.0 + uTime * 6.0)));
    float crest = smoothstep(0.85, 1.0, vH) * (0.4 + 0.6 * n);
    float spray = foamBehind * (0.65 + 0.35 * n);
    col = mix(col, vec3(1.0), clamp(spray + crest * 0.8, 0.0, 1.0));
    float alpha = smoothstep(0.03, 0.22, vH);
    gl_FragColor = vec4(col, alpha * 0.95);
  }
`;

/**
 * A breaking, peeling wave. In scenic mode it loops on its own with two
 * background surfers; when `engine` is provided it follows the surf session.
 */
export default function SurfBreak({ layout, engine }) {
  const mode = useGame((st) => st.mode);
  const hidden = !engine && mode === 'surf';
  const surf = layout.surf;
  const length = surf.peelEnd - surf.peelStart + 40;
  const uniforms = useMemo(() => ({ uCurl: { value: surf.peelStart }, uHeight: { value: 2.2 }, uTime: { value: 0 } }), [surf]);
  const wave = useRef();
  const surfers = useRef([]);
  const scenic = useRef({ t: Math.random() * 10 });
  const anims = useRef([{ current: { pose: 'surf', lean: 0 } }, { current: { pose: 'surf', lean: 0 } }]);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(length, 22, 90, 36);
    g.rotateX(-Math.PI / 2);
    g.translate(surf.peelStart - 20 + length / 2, 0, -5);
    return g;
  }, [length, surf]);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    let z;
    let curl;
    let height = 2.2;
    if (engine?.current) {
      const s = engine.current;
      z = s.wave.z;
      curl = s.wave.curlX;
      height = s.phase === 'paddle' ? 1.2 + Math.min(1, Math.max(0, (s.wave.z - (surf.lineupZ - 32)) / 30)) * 1.1 : 2.3;
      if (s.phase === 'paddle' && !s.wave.active) height *= Math.max(0, s.wave.cooldown / 2.2);
    } else {
      const period = 16;
      scenic.current.t = (scenic.current.t + dt) % period;
      const k = scenic.current.t / period;
      z = THREE.MathUtils.lerp(surf.lineupZ - 12, surf.endZ, k);
      curl = THREE.MathUtils.lerp(surf.peelStart - 5, surf.peelEnd, k);
      height = 2.2 * Math.sin(Math.PI * Math.min(1, k * 1.15));
      surfers.current.forEach((s, i) => {
        if (!s) return;
        const visible = k > 0.08 + i * 0.1 && k < 0.92;
        s.visible = visible;
        const x = curl + 4 + i * 9 + Math.sin(scenic.current.t * (1.2 + i * 0.3)) * 2;
        s.position.set(x, height * 0.55, z - 1.1);
        s.rotation.set(0, Math.PI / 2 + Math.sin(scenic.current.t * 1.4 + i) * 0.35, 0);
        anims.current[i].current.lean = Math.sin(scenic.current.t * 1.4 + i) * 0.6;
      });
    }
    uniforms.uCurl.value = curl;
    uniforms.uHeight.value = Math.max(0.01, height);
    if (wave.current) wave.current.position.z = z;
  });

  return (
    <group visible={!hidden}>
      <mesh ref={wave} geometry={geo} renderOrder={2}>
        <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {!engine &&
        [0, 1].map((i) => (
          <group key={i} ref={(r) => (surfers.current[i] = r)}>
            <Surfboard position={[0, 0.05, 0]} rotation={[0, 0, 0]} color={i ? '#ff9f43' : '#ffffff'} />
            <group position-y={0.05}>
              <Humanoid look={{ shirt: i ? '#102a43' : '#ef476f', shorts: '#222', skin: '#a8703f' }} anim={anims.current[i]} castShadow={false} />
            </group>
          </group>
        ))}
    </group>
  );
}
