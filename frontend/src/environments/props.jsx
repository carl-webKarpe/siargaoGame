/**
 * Stylized low-poly props built from primitives. Each one is a small,
 * self-contained component so it can later be swapped for a Blender GLB
 * (see README: "Replacing placeholder models").
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rng } from './terrain.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { detailMaterial } from './materials.js';
import { signTexture, stripeTexture, thatchTexture, woodTexture } from './textures.js';

const C = {
  trunk: '#8b6a45',
  leaf: '#2e8b57',
  leaf2: '#3fa55f',
  wood: '#8a5a32',
  darkWood: '#5b3a1e',
  bamboo: '#c8a165',
  rock: '#7d7a73',
  white: '#ffffff',
};

// Palms live in vegetation.jsx (re-exported here for existing imports).
export { Palms } from './vegetation.jsx';

// ------------------------------------------------------------------ Structures
export function Deck({ p, rails = '', posts = true, color }) {
  const tex = useMemo(() => {
    const t = woodTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(1, p.w / 3), Math.max(1, p.d / 3));
    if (p.w > p.d) t.rotation = Math.PI / 2;
    return t;
  }, [p.w, p.d]);
  const postList = useMemo(() => {
    if (!posts) return [];
    const out = [];
    const nx = Math.max(1, Math.round(p.w / 4));
    const nz = Math.max(1, Math.round(p.d / 4));
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
      if (i > 0 && i < nx && j > 0 && j < nz) continue;
      out.push([p.x - p.w / 2 + (i / nx) * p.w, p.z - p.d / 2 + (j / nz) * p.d]);
    }
    return out;
  }, [p, posts]);
  const postH = p.y + 3;
  return (
    <group>
      <mesh position={[p.x, p.y - 0.12, p.z]} castShadow receiveShadow>
        <boxGeometry args={[p.w, 0.24, p.d]} />
        <meshStandardMaterial map={tex} color={color || '#ffffff'} roughness={0.9} />
      </mesh>
      {postList.map(([x, z], i) => (
        <mesh key={i} position={[x, p.y - postH / 2, z]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, postH, 6]} />
          <meshStandardMaterial color={C.darkWood} roughness={1} />
        </mesh>
      ))}
      {rails.includes('x') && [-1, 1].map((s) => (
        <Rail key={`x${s}`} from={[p.x - p.w / 2, p.y, p.z + (s * p.d) / 2]} to={[p.x + p.w / 2, p.y, p.z + (s * p.d) / 2]} />
      ))}
      {rails.includes('z') && [-1, 1].map((s) => (
        <Rail key={`z${s}`} from={[p.x + (s * p.w) / 2, p.y, p.z - p.d / 2]} to={[p.x + (s * p.w) / 2, p.y, p.z + p.d / 2]} />
      ))}
    </group>
  );
}

function Rail({ from, to }) {
  const [x1, y, z1] = from;
  const [x2, , z2] = to;
  const len = Math.hypot(x2 - x1, z2 - z1);
  const n = Math.max(1, Math.round(len / 2.5));
  const ang = Math.atan2(x2 - x1, z2 - z1);
  return (
    <group>
      <mesh position={[(x1 + x2) / 2, y + 1, (z1 + z2) / 2]} rotation-y={ang} castShadow>
        <boxGeometry args={[0.12, 0.12, len]} />
        <meshStandardMaterial color={C.wood} />
      </mesh>
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={i} position={[x1 + ((x2 - x1) * i) / n, y + 0.5, z1 + ((z2 - z1) * i) / n]}>
          <boxGeometry args={[0.12, 1, 0.12]} />
          <meshStandardMaterial color={C.darkWood} />
        </mesh>
      ))}
    </group>
  );
}

export function NipaHut({ position = [0, 0, 0], rotation = 0, scale = 1, wall = C.bamboo, stilts = 0.8 }) {
  const thatch = thatchTexture();
  return (
    <group position={position} rotation-y={rotation} scale={scale}>
      {[[-1.6, -1.3], [1.6, -1.3], [-1.6, 1.3], [1.6, 1.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, stilts / 2 - 0.5, z]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, stilts + 1, 5]} />
          <meshStandardMaterial color={C.darkWood} />
        </mesh>
      ))}
      <mesh position={[0, stilts, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.2, 3]} />
        <meshStandardMaterial color={C.wood} />
      </mesh>
      <mesh position={[0, stilts + 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2, 2.6]} />
        <meshStandardMaterial color={wall} roughness={1} />
      </mesh>
      <mesh position={[0, stilts + 0.9, 1.31]}>
        <planeGeometry args={[0.9, 1.5]} />
        <meshStandardMaterial color="#4a2f17" />
      </mesh>
      <mesh position={[0, stilts + 3.1, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[3.3, 2.2, 4]} />
        <meshStandardMaterial map={thatch} color="#e0c08a" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

export function House({ position = [0, 0, 0], rotation = 0, color = '#f4d6a0', roof = '#c0392b' }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.2, 2.8, 3.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, 3.3, 0]} rotation-y={Math.PI / 4} scale={[1, 0.6, 1]} castShadow>
        <coneGeometry args={[3.4, 2, 4]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      <mesh position={[0, 1, 1.71]}>
        <planeGeometry args={[1, 2]} />
        <meshStandardMaterial color="#5b3a1e" />
      </mesh>
      {[-1.3, 1.3].map((x) => (
        <mesh key={x} position={[x, 1.7, 1.71]}>
          <planeGeometry args={[0.8, 0.7]} />
          <meshStandardMaterial color="#87ceeb" emissive="#2a5a6a" emissiveIntensity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

export function Stall({ position = [0, 0, 0], rotation = 0, color = '#ff6b6b', sign }) {
  const stripes = stripeTexture(color, '#ffffff');
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.1, 1.4]} />
        <meshStandardMaterial color={C.wood} />
      </mesh>
      {[[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.4, z]}>
          <cylinderGeometry args={[0.06, 0.06, 2.8, 5]} />
          <meshStandardMaterial color={C.darkWood} />
        </mesh>
      ))}
      <mesh position={[0, 2.85, 0]} rotation-x={-0.15} castShadow>
        <boxGeometry args={[3.4, 0.1, 2]} />
        <meshStandardMaterial map={stripes} />
      </mesh>
      {sign && (
        <mesh position={[0, 2.25, 0.75]}>
          <planeGeometry args={[2.6, 0.8]} />
          <meshBasicMaterial map={signTexture(sign, '', { bg: '#fff7e6', fg: '#102a43', accent: color })} toneMapped={false} />
        </mesh>
      )}
      {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
        <mesh key={x} position={[x, 1.25, 0.2]}>
          <sphereGeometry args={[0.18, 6, 5]} />
          <meshStandardMaterial color={['#ffd166', '#06d6a0', '#ef476f', '#8ac926'][i]} />
        </mesh>
      ))}
    </group>
  );
}

export function Sign({ position, rotation = 0, title, subtitle, width = 4, height = 1.5, bg, accent, postHeight = 2 }) {
  const tex = signTexture(title, subtitle, { bg, accent });
  return (
    <group position={position} rotation-y={rotation}>
      {[-width / 2 + 0.2, width / 2 - 0.2].map((x) => (
        <mesh key={x} position={[x, postHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, postHeight, 5]} />
          <meshStandardMaterial color={C.darkWood} />
        </mesh>
      ))}
      <mesh position={[0, postHeight + height / 2 - 0.2, 0]} castShadow>
        <boxGeometry args={[width, height, 0.12]} />
        <meshStandardMaterial color={C.darkWood} />
      </mesh>
      <mesh position={[0, postHeight + height / 2 - 0.2, 0.07]}>
        <planeGeometry args={[width - 0.15, height - 0.15]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh position={[0, postHeight + height / 2 - 0.2, -0.07]} rotation-y={Math.PI}>
        <planeGeometry args={[width - 0.15, height - 0.15]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Lumpy, smooth-shaded rock geometry deformed by layered noise. */
function rockGeometry(seed, { detail = 3, squash = 1, lumps = 0.28, flatBottom = true } = {}) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const m = mergeVertices(g);
  const p = m.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    const n =
      Math.sin(v.x * 2.1 + seed) * Math.sin(v.y * 1.7 + seed * 2.3) * Math.sin(v.z * 2.4 - seed) * 0.6 +
      Math.sin(v.x * 5.3 - seed) * Math.sin(v.y * 4.9 + seed) * Math.sin(v.z * 5.1) * 0.25;
    v.multiplyScalar(1 + n * lumps);
    v.y *= squash;
    if (flatBottom && v.y < -0.55 * squash) v.y = -0.55 * squash + (v.y + 0.55 * squash) * 0.2;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  m.computeVertexNormals();
  return m;
}

const rockMats = new Map();
function rockMaterial(color) {
  if (!rockMats.has(color)) rockMats.set(color, detailMaterial('rock', { material: { color, roughness: 0.97 } }));
  return rockMats.get(color);
}
const mossMat = () => rockMaterial('#4e7a2c');

export function Rock({ position, scale = 1, color = '#8f897d', seed = 1, rotation = 0, moss = false }) {
  const geo = useMemo(() => rockGeometry(seed), [seed]);
  const mossGeo = useMemo(() => (moss ? rockGeometry(seed + 50, { detail: 2, squash: 0.35, lumps: 0.4 }) : null), [moss, seed]);
  const sc = Array.isArray(scale) ? scale : [scale, scale, scale];
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={geo} material={rockMaterial(color)} scale={sc} castShadow receiveShadow />
      {moss && <mesh geometry={mossGeo} material={mossMat()} position-y={sc[1] * 0.78} scale={[sc[0] * 0.92, sc[1] * 0.9, sc[2] * 0.92]} castShadow />}
    </group>
  );
}

/**
 * Magpupungko-style "mushroom" rock: a wide, undercut limestone boulder
 * balanced on an eroded pedestal, with vegetation on top.
 */
export function MushroomRock({ position, size = 5, seed = 1, rotation = 0, pedestal = 0.45, green = true }) {
  const top = useMemo(() => rockGeometry(seed, { squash: 0.72, lumps: 0.32 }), [seed]);
  const base = useMemo(() => rockGeometry(seed + 9, { squash: 1, lumps: 0.25 }), [seed]);
  const cap = useMemo(() => rockGeometry(seed + 21, { detail: 2, squash: 0.3, lumps: 0.55 }), [seed]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={base} material={rockMaterial('#6f665a')} position-y={size * 0.25} scale={[size * pedestal, size * 0.4, size * pedestal * 0.85]} castShadow receiveShadow />
      <mesh geometry={top} material={rockMaterial('#7d7466')} position-y={size * 0.95} scale={[size * 0.85, size * 0.7, size * 0.75]} castShadow receiveShadow />
      {green && <mesh geometry={cap} material={mossMat()} position-y={size * 1.42} scale={[size * 0.7, size * 0.5, size * 0.62]} castShadow />}
    </group>
  );
}

/** Limestone karst tower with a green cap, as seen around Sugba and Sohoton. */
export function Karst({ position, height = 18, radius = 6, seed = 1, rotation = 0 }) {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(radius * 0.7, radius, height, 9, 5);
    const r = rng(seed);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const k = 0.8 + r() * 0.4 + Math.sin(y * 0.6 + seed) * 0.1;
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k);
    }
    g.computeVertexNormals();
    return g;
  }, [height, radius, seed]);
  return (
    <group position={position} rotation-y={rotation}>
      <mesh geometry={geo} material={rockMaterial('#9a9488')} position-y={height / 2 - 2} castShadow receiveShadow />
      <mesh position-y={height - 1.5} scale={[radius * 0.85, radius * 0.5, radius * 0.85]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2f7a3f" flatShading />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1 + seed) * radius * 0.75, height * (0.45 + i * 0.12), Math.sin(i * 2.1 + seed) * radius * 0.75]} scale={radius * 0.3}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#3d8b4a" flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function Mangrove({ position, scale = 1, seed = 1 }) {
  const r = useMemo(() => rng(seed), [seed]);
  const roots = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ a: (i / 6) * Math.PI * 2 + r() * 0.4, l: 1.2 + r() * 0.5 })), [r]);
  return (
    <group position={position} scale={scale}>
      {roots.map((rt, i) => (
        <mesh key={i} position={[Math.cos(rt.a) * 0.6, 0.6, Math.sin(rt.a) * 0.6]} rotation={[Math.sin(rt.a) * 0.6, 0, -Math.cos(rt.a) * 0.6]}>
          <cylinderGeometry args={[0.05, 0.08, rt.l * 1.6, 4]} />
          <meshStandardMaterial color="#5a4630" />
        </mesh>
      ))}
      <mesh position-y={2} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 2.4, 5]} />
        <meshStandardMaterial color="#5a4630" />
      </mesh>
      <mesh position-y={3.6} scale={[2.2, 1.4, 2.2]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2b6e3a" flatShading />
      </mesh>
      <mesh position={[0.8, 3.2, 0.5]} scale={[1.4, 1, 1.4]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#357f45" flatShading />
      </mesh>
    </group>
  );
}

export function Bush({ position, scale = 1, color = '#3a8f4f' }) {
  return (
    <group position={position} scale={scale}>
      <mesh position-y={0.5} castShadow>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position={[0.6, 0.4, 0.2]} scale={0.7}>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial color="#4aa35c" flatShading />
      </mesh>
    </group>
  );
}

/** Traditional bangka outrigger boat. */
export function Bangka({ position, rotation = 0, color = '#1f6fb2', bob = true }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (bob && ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.3 + position[0]) * 0.08;
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.1 + position[2]) * 0.03;
    }
  });
  return (
    <group ref={ref} position={position} rotation-y={rotation}>
      <mesh rotation-z={Math.PI / 2} scale={[0.7, 1, 0.55]} castShadow>
        <capsuleGeometry args={[0.8, 5, 4, 8]} />
        <meshStandardMaterial color={color} flatShading />
      </mesh>
      <mesh position-y={0.42} scale={[1, 1, 1]}>
        <boxGeometry args={[5.4, 0.08, 0.9]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh>
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} position={[x, 0.6, 0]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.05, 0.05, 6, 4]} />
          <meshStandardMaterial color={C.bamboo} />
        </mesh>
      ))}
      {[-3, 3].map((z) => (
        <mesh key={z} position={[0, 0.2, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.1, 0.1, 6, 5]} />
          <meshStandardMaterial color={C.bamboo} />
        </mesh>
      ))}
      <mesh position={[0.5, 1, 0]}>
        <boxGeometry args={[2, 0.08, 1.2]} />
        <meshStandardMaterial color="#ff9f43" />
      </mesh>
    </group>
  );
}

export function Umbrella({ position, color = '#ff9f43' }) {
  const stripes = stripeTexture(color, '#ffffff');
  return (
    <group position={position}>
      <mesh position-y={1.2}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 4]} />
        <meshStandardMaterial color="#eee" />
      </mesh>
      <mesh position-y={2.3} castShadow>
        <coneGeometry args={[1.6, 0.6, 8, 1, true]} />
        <meshStandardMaterial map={stripes} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.6, 0.15, 0.7]} rotation-y={0.3}>
        <boxGeometry args={[0.8, 0.12, 1.8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

export function Surfboard({ position, rotation = [0, 0, 0], color = '#00b4d8', length = 2.4 }) {
  return (
    <mesh position={position} rotation={rotation} scale={[0.32, 0.05, length / 2]} castShadow>
      <sphereGeometry args={[1, 10, 6]} />
      <meshStandardMaterial color={color} roughness={0.4} />
    </mesh>
  );
}

export function SurfRack({ position, rotation = 0 }) {
  const colors = ['#00b4d8', '#ff9f43', '#ffd166', '#ef476f', '#2e8b57', '#ffffff'];
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={0.8}>
        <boxGeometry args={[3.6, 0.1, 0.3]} />
        <meshStandardMaterial color={C.wood} />
      </mesh>
      {colors.map((c, i) => (
        <Surfboard key={i} position={[-1.5 + i * 0.6, 1.2, 0]} rotation={[Math.PI / 2 - 0.15, 0, 0]} color={c} />
      ))}
    </group>
  );
}

export function Buoy({ position, color = '#ffd166', active = false }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.1;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.6, 10, 8]} />
        <meshStandardMaterial color={color} emissive={active ? color : '#000'} emissiveIntensity={active ? 0.6 : 0} />
      </mesh>
      <mesh position-y={0.9}>
        <cylinderGeometry args={[0.05, 0.05, 1.2, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {active && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.05}>
          <ringGeometry args={[2.6, 3.2, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

export function EcoBin({ position, rotation = 0 }) {
  return (
    <group position={position} rotation-y={rotation}>
      {[['#2e8b57', -0.45], ['#00b4d8', 0.45]].map(([c, x]) => (
        <group key={x} position-x={x}>
          <mesh position-y={0.5} castShadow>
            <cylinderGeometry args={[0.38, 0.32, 1, 8]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <mesh position-y={1.03}>
            <cylinderGeometry args={[0.42, 0.42, 0.08, 8]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Animated waterfall sheet. */
export function Waterfall({ position, width = 6, height = 14, rotation = 0 }) {
  const mat = useRef();
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
  });
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={height / 2}>
        <planeGeometry args={[width, height, 1, 1]} />
        <shaderMaterial
          ref={mat}
          transparent
          uniforms={uniforms}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `}
          fragmentShader={`
            uniform float uTime; varying vec2 vUv;
            float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
            void main(){
              float x = floor(vUv.x * 28.0);
              float s = fract(vUv.y * 2.5 + uTime * (1.2 + h(vec2(x,1.0)) * 0.8) + h(vec2(x,3.0)));
              float streak = smoothstep(0.0, 0.5, s) * (1.0 - smoothstep(0.5, 1.0, s));
              vec3 col = mix(vec3(0.6,0.85,0.95), vec3(1.0), streak);
              float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x);
              gl_FragColor = vec4(col, (0.55 + streak * 0.4) * edge);
            }`}
        />
      </mesh>
      <mesh position={[0, 0.15, 1.2]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[width * 0.7, 16]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

/** Stingless jellyfish (Sohoton) — observe only. */
export function Jellyfish({ position, seed = 0 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime + seed;
    ref.current.position.y = position[1] + Math.sin(t * 0.8) * 0.3;
    ref.current.position.x = position[0] + Math.sin(t * 0.2) * 1.5;
    ref.current.scale.y = 1 + Math.sin(t * 3) * 0.12;
  });
  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffd6a5" transparent opacity={0.7} emissive="#ffb070" emissiveIntensity={0.25} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.57) * 0.2, -0.4, Math.sin(i * 1.57) * 0.2]}>
          <cylinderGeometry args={[0.03, 0.01, 0.8, 3]} />
          <meshStandardMaterial color="#ffe0bd" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Low distant islands on the horizon. */
export function DistantIslands({ items }) {
  return items.map((it, i) => (
    <group key={i} position={[it.x, -1, it.z]} scale={[it.s, it.h ?? it.s * 0.35, it.s]}>
      <mesh>
        <sphereGeometry args={[1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={it.color || '#3b7d4f'} flatShading />
      </mesh>
    </group>
  ));
}

/** Seagulls circling overhead. */
export function Birds({ count = 5, center = [0, 0, 0], radius = 40, height = 25 }) {
  const refs = useRef([]);
  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({ ph: i * 1.3, r: radius * (0.6 + (i % 3) * 0.2), h: height + (i % 4) * 3 })), [count, radius, height]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.25;
    data.forEach((d, i) => {
      const b = refs.current[i];
      if (!b) return;
      const a = t + d.ph;
      b.position.set(center[0] + Math.cos(a) * d.r, d.h + Math.sin(a * 3) * 1.5, center[2] + Math.sin(a) * d.r);
      b.rotation.y = -a;
      b.children[0].rotation.z = 0.4 + Math.sin(clock.elapsedTime * 6 + i) * 0.35;
      b.children[1].rotation.z = -0.4 - Math.sin(clock.elapsedTime * 6 + i) * 0.35;
    });
  });
  return data.map((_, i) => (
    <group key={i} ref={(r) => (refs.current[i] = r)}>
      <mesh position={[0, 0, -0.5]}>
        <boxGeometry args={[0.08, 0.04, 1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0, 0.5]}>
        <boxGeometry args={[0.08, 0.04, 1]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  ));
}

/** Tall Cloud 9-style viewing tower. */
export function ViewingTower({ position, title = 'CLOUD 9', subtitle = 'SURFING AREA' }) {
  const thatch = thatchTexture();
  const sign = signTexture(title, subtitle, { bg: '#ffffff', fg: '#102a43', accent: '#00b4d8' });
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      {[[-5, -4], [5, -4], [-5, 4], [5, 4], [0, -4], [0, 4]].map(([px, pz], i) => (
        <mesh key={i} position={[px, 2.6, pz]} castShadow>
          <cylinderGeometry args={[0.18, 0.2, 5.2, 6]} />
          <meshStandardMaterial color="#5b3a1e" />
        </mesh>
      ))}
      <mesh position={[0, 4.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[10.8, 0.25, 8.8]} />
        <meshStandardMaterial map={woodTexture()} />
      </mesh>
      {[[-5.3, 0, 0.1, 8.8], [5.3, 0, 0.1, 8.8], [0, -4.3, 10.8, 0.1], [0, 4.3, 10.8, 0.1]].map(([px, pz, w, d], i) => (
        <mesh key={i} position={[px, 5.45, pz]}>
          <boxGeometry args={[w || 0.1, 1.1, d || 0.1]} />
          <meshStandardMaterial color="#8a5a32" transparent opacity={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 8.2, 0]} rotation-y={Math.PI / 4} castShadow>
        <coneGeometry args={[8.5, 3, 4]} />
        <meshStandardMaterial map={thatch} color="#d8b47a" flatShading />
      </mesh>
      <mesh position={[0, 6.5, 4.42]}>
        <planeGeometry args={[7, 2.4]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      <mesh position={[0, 6.5, -4.42]} rotation-y={Math.PI}>
        <planeGeometry args={[7, 2.4]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {[[-4.8, -3.8], [4.8, 3.8]].map(([px, pz], i) => (
        <group key={i} position={[px, 9, pz]}>
          <mesh position-y={0.8}>
            <cylinderGeometry args={[0.04, 0.04, 2.6, 4]} />
            <meshStandardMaterial color="#ddd" />
          </mesh>
          <mesh position={[0.45, 1.6, 0]}>
            <planeGeometry args={[0.9, 1.3]} />
            <meshStandardMaterial color={i ? '#ff9f43' : '#00b4d8'} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function CaveArch({ position, rotation = 0, radius = 7 }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh castShadow>
        <torusGeometry args={[radius, radius * 0.45, 6, 12, Math.PI]} />
        <meshStandardMaterial color="#8d877b" flatShading roughness={1} />
      </mesh>
      <mesh position-y={radius * 0.9} scale={[radius * 1.1, radius * 0.35, radius * 0.6]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2f7a3f" flatShading />
      </mesh>
    </group>
  );
}

export function Bench({ position, rotation = 0 }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={0.45} castShadow>
        <boxGeometry args={[2, 0.12, 0.6]} />
        <meshStandardMaterial color={C.wood} />
      </mesh>
      {[-0.8, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.22, 0]}>
          <boxGeometry args={[0.12, 0.45, 0.5]} />
          <meshStandardMaterial color={C.darkWood} />
        </mesh>
      ))}
    </group>
  );
}

export function Kayak({ position, rotation = 0, color = '#ff9f43' }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh scale={[0.45, 0.25, 1.9]} castShadow>
        <sphereGeometry args={[1, 10, 6]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position-y={0.2} scale={[0.3, 0.1, 0.5]}>
        <sphereGeometry args={[1, 8, 4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

/** Thick hip roof of layered thatch. */
function ThatchRoof({ w, d, h, y, color = '#7a5a36', overhang = 0.9 }) {
  const thatch = thatchTexture();
  const geo = useMemo(() => {
    const W = w / 2 + overhang;
    const D = d / 2 + overhang;
    const ridge = Math.max(0.2, W - D) ;
    const g = new THREE.BufferGeometry();
    // hip roof: 4 eaves corners + 2 ridge points
    const v = [
      [-W, 0, -D], [W, 0, -D], [W, 0, D], [-W, 0, D],
      [-ridge, h, 0], [ridge, h, 0],
    ];
    const faces = [[0, 1, 5], [0, 5, 4], [2, 3, 4], [2, 4, 5], [1, 2, 5], [3, 0, 4]];
    const pos = [];
    const uv = [];
    faces.forEach((f) => f.forEach((i) => {
      pos.push(...v[i]);
      uv.push(v[i][0] * 0.4, v[i][1] * 0.8 + v[i][2] * 0.4);
    }));
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }, [w, d, h, overhang]);
  return (
    <group position-y={y}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial map={thatch} color={color} roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo} position-y={-0.25} scale={[1.02, 1, 1.02]}>
        <meshStandardMaterial map={thatch} color={color} roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** White-walled beach resort with a thick thatched roof and veranda (Pacifico). */
export function ResortHouse({ position, rotation = 0, w = 9, d = 6, sign }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={0.25} receiveShadow castShadow>
        <boxGeometry args={[w + 2.4, 0.5, d + 2.4]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.9} />
      </mesh>
      <mesh position-y={2.2} castShadow receiveShadow>
        <boxGeometry args={[w, 3.4, d]} />
        <meshStandardMaterial color="#f4f1ea" roughness={0.85} />
      </mesh>
      {[-w / 3, 0, w / 3].map((x) => (
        <mesh key={x} position={[x, 2.4, d / 2 + 0.01]}>
          <planeGeometry args={[1.4, 1.3]} />
          <meshStandardMaterial color="#2d6f8f" roughness={0.2} metalness={0.2} />
        </mesh>
      ))}
      <mesh position={[0, 1.6, d / 2 + 0.02]}>
        <planeGeometry args={[1.1, 2.2]} />
        <meshStandardMaterial color="#6b4a2b" />
      </mesh>
      {[-w / 2 - 0.9, w / 2 + 0.9].flatMap((x) => [-d / 2 - 0.9, d / 2 + 0.9].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 2.2, z]} castShadow>
          <cylinderGeometry args={[0.13, 0.15, 3.6, 7]} />
          <meshStandardMaterial color="#5b3a1e" />
        </mesh>
      )))}
      <ThatchRoof w={w + 1.8} d={d + 1.8} h={3.2} y={3.9} />
      {sign && (
        <mesh position={[0, 3.6, d / 2 + 1.15]}>
          <planeGeometry args={[3.4, 0.7]} />
          <meshBasicMaterial map={signTexture(sign, '', { bg: '#2a6f97', fg: '#ffffff', accent: '#ffffff' })} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** Small open beach cabana / kubo with a thatched roof. */
export function Cabana({ position, rotation = 0, size = 3, color = '#8a6a40' }) {
  return (
    <group position={position} rotation-y={rotation}>
      <mesh position-y={0.55} castShadow receiveShadow>
        <boxGeometry args={[size, 0.15, size]} />
        <meshStandardMaterial map={woodTexture()} />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <mesh key={`${sx}${sz}`} position={[(sx * size) / 2.2, 1.3, (sz * size) / 2.2]} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 2.6, 6]} />
          <meshStandardMaterial color="#5b3a1e" />
        </mesh>
      )))}
      <ThatchRoof w={size} d={size} h={1.5} y={2.5} color={color} overhang={0.5} />
    </group>
  );
}

/** Floating cottage on bamboo pontoons with a white roof (Sugba Lagoon). */
export function FloatingCottage({ position, rotation = 0, w = 12, d = 8 }) {
  return (
    <group position={position} rotation-y={rotation}>
      {[-d / 2 + 0.6, d / 2 - 0.6].map((z) => (
        <mesh key={z} position={[0, 0.2, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.45, 0.45, w, 10]} />
          <meshStandardMaterial color="#c9b48a" roughness={0.8} />
        </mesh>
      ))}
      {[-w / 2 + 0.4, 0, w / 2 - 0.4].flatMap((x) => [-d / 2 + 0.4, d / 2 - 0.4].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 2.6, z]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 2.9, 6]} />
          <meshStandardMaterial color="#f2efe8" />
        </mesh>
      )))}
      <mesh position={[0, 4.1, 0]} castShadow>
        <boxGeometry args={[w + 0.8, 0.25, d + 0.8]} />
        <meshStandardMaterial color="#f7f7f2" roughness={0.6} />
      </mesh>
      <mesh position={[0, 4.45, 0]} castShadow>
        <boxGeometry args={[w - 2, 0.45, d - 2.5]} />
        <meshStandardMaterial color="#f0f0ea" roughness={0.6} />
      </mesh>
      <mesh position={[-w / 4, 2.0, -d / 2 + 0.5]}>
        <boxGeometry args={[w / 2, 1.6, 0.15]} />
        <meshStandardMaterial color="#e9e4d8" />
      </mesh>
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 1.6, 0]} castShadow>
          <boxGeometry args={[1.6, 0.1, 0.9]} />
          <meshStandardMaterial map={woodTexture()} />
        </mesh>
      ))}
    </group>
  );
}

/** Low picket / bamboo fence segment between two points. */
export function Fence({ from, to, groundAt, color = '#7a5a36' }) {
  const posts = useMemo(() => {
    const [x1, z1] = from;
    const [x2, z2] = to;
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / 1.2));
    return Array.from({ length: n + 1 }, (_, i) => [x1 + ((x2 - x1) * i) / n, z1 + ((z2 - z1) * i) / n]);
  }, [from, to]);
  return posts.map(([x, z], i) => (
    <mesh key={i} position={[x, groundAt(x, z) + 0.45, z]} castShadow>
      <boxGeometry args={[0.1, 0.9, 0.1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  ));
}
