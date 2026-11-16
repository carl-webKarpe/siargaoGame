/**
 * Magpupungko Rock Pools, Pilar — modelled on the photos: a big turquoise tidal
 * pool enclosed by a rough brown limestone shelf, mushroom-shaped boulders with
 * green tops (including the famous balancing rock), a jungle-covered cliff on
 * the west side and Pacific swell crashing on the outer edge of the shelf.
 */
import { fbm, lerp, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { genJungle } from '../vegetation.jsx';
import { Birds, EcoBin, MushroomRock, NipaHut, Rock, Sign, Stall } from '../props.jsx';

// The main lagoon-like pool is the union of a few blobs.
const pool = [
  [-2, -4, 15],
  [10, -16, 12],
  [-10, -18, 9],
  [4, 8, 7],
];
const smallPools = [[-24, 4, 3.5], [24, 6, 3], [30, -20, 4], [-18, -34, 3], [18, -36, 3.5], [-30, -14, 2.5], [36, 0, 2.2]];

function poolMask(x, z) {
  let m = 0;
  for (const [px, pz, r] of pool) {
    const n = fbm(x * 0.15 + px, z * 0.15) * 3;
    m = Math.max(m, 1 - smooth(r * 0.7, r + n, Math.hypot(x - px, z - pz)));
  }
  return m;
}

function height(x, z) {
  // land and jungle cliff to the south and west
  const cliff = smooth(-26, -42, x) * (10 + fbm(x * 0.05, z * 0.05) * 8);
  const land = smooth(34, 48, z) * (1.2 + smooth(48, 100, z) * (12 + fbm(x * 0.03, z * 0.03) * 10));
  // rough limestone shelf
  let h = 0.3 + fbm(x * 0.22, z * 0.22) * 0.5 + fbm(x * 0.9, z * 0.9) * 0.12;
  h = Math.max(h, land) + cliff;
  // outer edge drops to the open ocean (north)
  h = lerp(h, -7, smooth(-46, -60, z) * (1 - smooth(-30, -44, x)));
  // tidal pools
  h = lerp(h, -2.4 - fbm(x * 0.2, z * 0.2) * 0.6, poolMask(x, z));
  for (const [px, pz, r] of smallPools) h = lerp(h, -0.5, 1 - smooth(r * 0.5, r, Math.hypot(x - px, z - pz)));
  return h;
}

// [x, z, size, seed, pedestal, green]
const mushrooms = [
  [-1, -5, 4.6, 1, 0.75, true], // big flat-topped rock in the middle of the pool
  [-20, -13, 5.5, 2, 0.5, true],
  [-21, 6, 4.2, 3, 0.55, true],
  [9, -42, 6.5, 4, 0.34, true], // the balancing rock on the outer shelf
  [26, -28, 3.6, 5, 0.45, false],
  [17, 12, 3.2, 6, 0.5, true],
];
const boulders = [[34, -38, 2.2, 11], [-8, -40, 1.6, 12], [28, 18, 1.4, 13], [40, -14, 1.8, 14], [-12, 22, 1.2, 15], [6, 26, 1, 16]];

const layout = {
  key: 'magpupungko',
  size: 220,
  spawn: [2, 26],
  spawnYaw: 0,
  palette: { ...PALETTES.rocky, sand: '#74644f', wet: '#564b3e', rock: '#4f483e', under: '#cfc19c', sandTop: 1.3, rockSlope: 0.7, grass: '#4c8a3c', grass2: '#2f6d30' },
  water: { clear: '#a9f3e6', shallow: '#21cfc2', deep: '#0a5d8c', wave: 1.2, depthScale: 7, clarity: 0.68 },
  height,
  platforms: [],
  grassCount: 500,
  obstacles: [
    ...mushrooms.map(([x, z, s, , p]) => ({ x, z, r: Math.max(1.5, s * p * 1.1) })),
    ...boulders.map(([x, z, s]) => ({ x, z, r: s })),
    { x: -30, z: 40, r: 3 },
    { x: 26, z: 38, r: 2.4 },
  ],
  npcs: [
    { key: 'lola_pacing', pos: [-12, 28], rotY: 0.5, look: LOOKS.elder },
    { key: 'tour_guide_ben', pos: [12, 24], rotY: -0.3, look: LOOKS.guide, quiz: 'tidal_pools' },
  ],
  info: {
    activity: 'explore_magpupungko',
    points: [
      { x: -8, z: 17, title: 'How the Pools Formed', text: 'Over thousands of years, waves carved hollows into the limestone shelf. At low tide the sea retreats and the hollows stay filled — natural tidal pools.' },
      { x: 26, z: -6, title: 'Life in the Pools', text: 'Sea urchins, small fish, crabs and anemones survive heat and salt changes in the pools. Look, but never take them home.' },
      { x: 2, z: -34, title: 'The Balancing Rock', text: 'Waves slowly undercut these boulders, leaving huge rocks on narrow pedestals. Never climb them — and always check the tide: high tide waves crash over this shelf.' },
    ],
  },
  trashAreas: [{ x0: -24, x1: 46, z0: -44, z1: 32 }],
  trashValid: (x, z) => {
    const h = height(x, z);
    return h > 0.25 && h < 2 && !mushrooms.some(([rx, rz, s]) => Math.hypot(x - rx, z - rz) < s * 0.6 + 1) && !boulders.some(([rx, rz, s]) => Math.hypot(x - rx, z - rz) < s + 1);
  },
  Features,
};

const avoid = [[-30, 40, 6], [26, 38, 5], [2, 26, 5]];
layout.palms = genPalms('magpupungko', 50, [{ x0: -105, x1: 105, z0: 36, z1: 105 }, { x0: -105, x1: -34, z0: -60, z1: 40 }], layout, { min: 1.2, max: 25, avoid });
layout.jungle = genJungle(layout, { count: 520, min: 3, areas: [{ x0: -110, x1: -28, z0: -80, z1: 110 }, { x0: -110, x1: 110, z0: 44, z1: 110 }], avoid, scale: [3, 6.5] });

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      {mushrooms.map(([x, z, s, seed, p, g]) => (
        <MushroomRock key={seed} position={[x, Math.min(y(x, z), 0.4) - s * 0.15, z]} size={s} seed={seed} pedestal={p} green={g} rotation={seed * 1.3} />
      ))}
      {boulders.map(([x, z, s, seed]) => (
        <Rock key={seed} position={[x, y(x, z) + s * 0.3, z]} scale={[s * 1.3, s, s]} seed={seed} color="#6a6155" rotation={seed} />
      ))}
      <Sign position={[-8, y(-8, 34), 34]} rotation={0.4} title="MAGPUPUNGKO" subtitle="Rock Pools · Pilar" width={5} height={1.6} postHeight={2.2} accent="#ff9f43" />
      <Sign position={[16, y(16, 30), 30]} rotation={-0.3} title="DO NOT TAKE SHELLS" subtitle="Leave creatures in the pools" width={4.2} height={1.2} bg="#7a2e1f" accent="#f4d6a0" />
      <NipaHut position={[-30, y(-30, 40), 40]} rotation={0.3} />
      <Stall position={[26, y(26, 38), 38]} rotation={-0.3} color="#00b4d8" sign="GUIDE DESK" />
      <EcoBin position={[4, y(4, 31), 31]} />
      <Birds center={[0, 0, -10]} radius={40} height={28} />
    </group>
  );
}

export default layout;
