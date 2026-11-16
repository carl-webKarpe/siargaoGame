/**
 * Sugba Lagoon, Del Carmen — modelled on the aerial photo: a winding emerald
 * channel between steep rainforest hills, a small round forested islet in the
 * middle, a white floating cottage linked to the islet by a long dock, diving
 * boards and bangka boats.
 */
import { fbm, lerp, smooth } from '../terrain.js';
import { LOOKS, PALETTES, genPalms } from '../common.js';
import { genJungle } from '../vegetation.jsx';
import { Bangka, Birds, Deck, EcoBin, FloatingCottage, Kayak, Rock, Sign } from '../props.jsx';

const centerX = (z) => Math.sin(z * 0.022) * 12;
const halfWidth = (z) => 30 + Math.sin(z * 0.05 + 1) * 6;
const islet = { x: 6, z: 5, r: 9 };
const terrace = { x: -36, z: 5, r: 8 };

function height(x, z) {
  const d = Math.abs(x - centerX(z)) - halfWidth(z);
  let h;
  if (d < 0) {
    h = lerp(-4.2 - fbm(x * 0.05, z * 0.05) * 1.5, -0.5, smooth(-14, 0, d));
  } else {
    // limestone edge, then steep rainforest hills
    h = smooth(0, 3, d) * 1.4 + smooth(2, 34, d) * (34 + fbm(x * 0.03, z * 0.03) * 18);
  }
  // forested islet
  const id = Math.hypot(x - islet.x, z - islet.z);
  if (id < islet.r + 3) h = Math.max(h, lerp(-0.6, 8 * (1 - (id / islet.r) ** 2) + fbm(x * 0.3, z * 0.3) * 0.8, 1 - smooth(islet.r - 2, islet.r + 2, id)));
  // small landing terrace on the west shore
  const td = Math.hypot(x - terrace.x, z - terrace.z);
  h = lerp(h, 1.3 + fbm(x * 0.2, z * 0.2) * 0.2, 1 - smooth(terrace.r - 2, terrace.r + 2, td));
  // ends of the channel open to the sea
  return h;
}

const platforms = [
  { x: -14.5, z: 5, w: 12, d: 8, y: 1.3 }, // floating cottage deck
  { x: -5.5, z: 5, w: 6, d: 2.4, y: 1.3 }, // dock to the islet
  { x: -24.5, z: 5, w: 8, d: 2.4, y: 1.3 }, // walkway to the west terrace
  { x: -14.5, z: 12.5, w: 2.2, d: 7, y: 1.3 }, // diving board / kayak launch
  { x: -14.5, z: -2.5, w: 2.2, d: 7, y: 1.3 }, // second diving board
];

const checkpoints = [[-8, 30], [12, 34], [20, 14], [18, -14], [0, -30], [-16, -16]];

const layout = {
  key: 'sugba',
  size: 240,
  spawn: [-28, 5],
  spawnYaw: -Math.PI / 2 + 0.2,
  palette: { ...PALETTES.lagoon, sand: '#d9c9a0', under: '#b9c79a', rock: '#8f8a7c', grass: '#3d7f34', grass2: '#2a6a2c', sandTop: 1.0, rockSlope: 0.6 },
  water: { clear: '#a3f4e3', shallow: '#22d1c0', deep: '#0f8c94', wave: 0.18, depthScale: 5, clarity: 0.62 },
  height,
  platforms,
  cameraBlockers: [{ x: -14.5, z: 5, w: 13.6, d: 9.6, y0: 3.6, y1: 5.2 }],
  grass: false,
  obstacles: [],
  npcs: [
    { key: 'kapitan_doming', pos: [-18, 3], rotY: Math.PI / 2, look: LOOKS.leader, quiz: 'water_conservation' },
    { key: 'kayak_nene', pos: [-14.5, 11], rotY: Math.PI, look: { ...LOOKS.vendor, shirt: '#ffd166' } },
  ],
  info: {
    activity: 'explore_sugba',
    points: [
      { x: -10, z: 7.5, title: 'Sugba Lagoon', text: 'An emerald lagoon hidden between rainforest hills in Del Carmen. It stays calm because the hills and mangroves shelter it from ocean swells.' },
      { x: 2, z: 2, title: 'Mangrove Nursery', text: 'Mangrove roots are nurseries for fish, crabs and shrimp, and they protect villages from storm surges. Del Carmen replanted thousands after Typhoon Odette.' },
      { x: -38, z: 8, title: 'No Single-Use Plastic', text: 'Bring a reusable water bottle. A single plastic bottle in the lagoon can break into thousands of microplastics eaten by fish.' },
    ],
  },
  trashAreas: [
    { x0: -44, x1: -28, z0: -3, z1: 13 },
    { x0: -4, x1: 16, z0: -5, z1: 15 },
    { x0: -26, x1: 26, z0: -45, z1: 45, water: true },
  ],
  trashValid: (x, z, area) => {
    const h = height(x, z);
    const onDeck = platforms.some((p) => Math.abs(x - p.x) <= p.w / 2 + 2 && Math.abs(z - p.z) <= p.d / 2 + 2);
    if (area.water) return h < -1.2 && !onDeck;
    return h > 0.3 && h < 3 && !onDeck;
  },
  kayak: {
    activity: 'kayak_sugba',
    start: [-14.5, 18],
    startYaw: 0,
    radius: 40,
    checkpoints,
  },
  Features,
};

const avoid = [[islet.x, islet.z, 3], [terrace.x, terrace.z, 11]];
layout.jungle = genJungle(layout, { count: 900, min: 1.6, areas: [{ x0: -120, x1: 120, z0: -120, z1: 120 }], avoid, minDist: 3.3, scale: [3.5, 7.5] }).concat(
  genJungle({ ...layout, key: 'sugba-islet' }, { count: 26, min: 1.5, areas: [{ x0: islet.x - 8, x1: islet.x + 8, z0: islet.z - 8, z1: islet.z + 8 }], minDist: 2.2, scale: [2.2, 3.8] })
);
layout.palms = genPalms('sugba', 10, [{ x0: -6, x1: 18, z0: -6, z1: 16 }], layout, { min: 0.6, max: 9, minDist: 3 });

const shoreRocks = Array.from({ length: 16 }, (_, i) => {
  const z = -90 + i * 12;
  const side = i % 2 ? 1 : -1;
  return [centerX(z) + side * (halfWidth(z) + 0.5), z, 1.6 + (i % 3) * 0.8, 30 + i];
});

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      <FloatingCottage position={[-14.5, 0, 5]} w={12} d={8} />
      {platforms.slice(1).map((p, i) => (
        <Deck key={i} p={p} rails={i < 2 ? 'x' : ''} />
      ))}
      <Deck p={platforms[0]} posts={false} />
      {shoreRocks.map(([x, z, s, seed]) => (
        <Rock key={seed} position={[x, y(x, z) - 0.2, z]} scale={[s * 1.4, s, s]} seed={seed} color="#9a9486" moss />
      ))}
      <Kayak position={[-11.5, 0.15, 13]} rotation={0.1} color="#ff9f43" />
      <Kayak position={[-17.5, 0.15, 14]} rotation={-0.2} color="#00b4d8" />
      <Bangka position={[-22, 0.2, 28]} rotation={0.4} />
      <Bangka position={[16, 0.2, 26]} rotation={-0.3} color="#f5f5f5" />
      <Bangka position={[12, 0.2, -26]} rotation={0.2} color="#2e8b57" />
      <Sign position={[-38, y(-38, 2), 2]} rotation={Math.PI / 2} title="SUGBA LAGOON" subtitle="Del Carmen · Protect the mangroves" width={5.2} height={1.6} postHeight={2.2} accent="#5cd6b0" />
      <EcoBin position={[-11, 1.3, 2]} />
      <Birds center={[0, 0, 0]} radius={45} height={36} />
    </group>
  );
}

export default layout;
