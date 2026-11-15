import { fbm, lerp, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { Birds, Deck, EcoBin, Karst, Kayak, Mangrove, NipaHut, Sign } from '../props.jsx';

function height(x, z) {
  const r = Math.hypot(x, z * 1.1);
  let h = lerp(-3.8, -0.35, smooth(26, 44, r));
  h = lerp(h, 1.4 + fbm(x * 0.1, z * 0.1) * 0.6, smooth(44, 54, r));
  h += smooth(66, 100, r) * (6 + fbm(x * 0.04, z * 0.04) * 10);
  return h;
}

const platforms = [
  { x: 0, z: 40, w: 16, d: 9, y: 1.2 }, // floating cottage deck
  { x: 0, z: 49.5, w: 3, d: 11, y: 1.2 }, // pier to shore
  { x: 6.5, z: 33, w: 2, d: 6, y: 1.2 }, // diving board / kayak launch
];

const karsts = [
  [-70, -40, 26, 9, 1], [-40, -75, 30, 10, 2], [10, -85, 24, 8, 3], [55, -62, 28, 9, 4], [80, -10, 22, 8, 5],
  [-85, 15, 20, 7, 6], [70, 45, 18, 7, 7], [-60, 60, 22, 8, 8],
];

const mangroves = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2 + 0.2;
  if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.35) return null; // keep pier clear
  const r = 46 + (i % 3) * 1.5;
  return [Math.cos(a) * r, (Math.sin(a) * r) / 1.1, 0.9 + (i % 4) * 0.15, i];
}).filter(Boolean);

const checkpoints = Array.from({ length: 6 }, (_, i) => {
  const a = Math.PI / 2 - 0.5 - (i / 6) * Math.PI * 2;
  return [Math.cos(a) * 30, Math.sin(a) * 26];
});

const layout = {
  key: 'sugba',
  size: 220,
  spawn: [0, 52],
  spawnYaw: 0,
  palette: PALETTES.lagoon,
  water: { shallow: '#5cd6b0', deep: '#0b6e6a', wave: 0.25, depthScale: 4 },
  height,
  platforms,
  obstacles: [{ x: -6, z: 41, r: 2.6 }, ...karsts.map(([x, z, , r]) => ({ x, z, r: r * 0.9 }))],
  npcs: [
    { key: 'kapitan_doming', pos: [-2, 42.5], rotY: 0.2, look: LOOKS.leader, quiz: 'water_conservation' },
    { key: 'kayak_nene', pos: [5, 37.5], rotY: -0.6, look: { ...LOOKS.vendor, shirt: '#ffd166' } },
  ],
  info: {
    activity: 'explore_sugba',
    points: [
      { x: 6, z: 43.5, title: 'Sugba Lagoon', text: 'An emerald lagoon enclosed by limestone cliffs in Del Carmen. It is calm because the cliffs and mangroves shelter it from ocean swells.' },
      { x: -22, z: 48, title: 'Mangrove Nursery', text: 'Mangrove roots are nurseries for fish, crabs and shrimp, and they protect villages from storm surges. Del Carmen replanted thousands after Typhoon Odette.' },
      { x: 28, z: 44, title: 'No Single-Use Plastic', text: 'Bring a reusable water bottle. A single plastic bottle in the lagoon can break into thousands of microplastics eaten by fish.' },
    ],
  },
  trashAreas: [
    { x0: -55, x1: 55, z0: 42, z1: 58 },
    { x0: -36, x1: 36, z0: -30, z1: 28, water: true },
  ],
  trashValid: (x, z, area) => {
    const h = height(x, z);
    if (area.water) return h < -1 && Math.hypot(x, z) < 36;
    return h > 0.4 && h < 2.6 && Math.abs(x) > 3;
  },
  kayak: {
    activity: 'kayak_sugba',
    start: [6.5, 28],
    startYaw: Math.PI,
    radius: 42,
    checkpoints,
  },
  Features,
};
layout.palms = genPalms('sugba', 40, [{ x0: -100, x1: 100, z0: -100, z1: 100 }], layout, {
  min: 1.3, max: 6, avoid: [[0, 52, 6], ...karsts.map(([x, z, , r]) => [x, z, r + 3])],
});

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      {platforms.map((p, i) => (
        <Deck key={i} p={p} rails={i === 1 ? 'z' : ''} />
      ))}
      <NipaHut position={[-6, 0.4, 41]} rotation={0} stilts={0.8} wall="#c9a46a" />
      {karsts.map(([x, z, h, r, seed]) => (
        <Karst key={seed} position={[x, y(x, z) - 1, z]} height={h} radius={r} seed={seed} />
      ))}
      {mangroves.map(([x, z, s, i]) => (
        <Mangrove key={i} position={[x, y(x, z) - 0.3, z]} scale={s} seed={i} />
      ))}
      <Kayak position={[3.5, 0.15, 33]} rotation={0.1} color="#ff9f43" />
      <Kayak position={[9, 0.15, 35]} rotation={-0.2} color="#00b4d8" />
      <Sign position={[-7, y(-7, 56), 56]} rotation={0.5} title="SUGBA LAGOON" subtitle="Del Carmen · Protect the mangroves" width={5.2} height={1.6} postHeight={2.2} accent="#5cd6b0" />
      <EcoBin position={[5.5, 1.2, 42.5]} />
      <Birds center={[0, 0, 0]} radius={40} height={30} />
    </group>
  );
}

export default layout;
