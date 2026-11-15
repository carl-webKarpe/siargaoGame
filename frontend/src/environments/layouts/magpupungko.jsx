import { fbm, lerp, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { Birds, DistantIslands, EcoBin, NipaHut, Rock, Sign, Stall } from '../props.jsx';

const pools = [
  [-12, -10, 7],
  [10, -18, 9],
  [24, -3, 5],
  [-27, -24, 6],
  [0, 2, 4],
];

const shore = (x) => 12 + Math.sin(x * 0.05) * 3;

function height(x, z) {
  const d = z - shore(x);
  let h;
  if (d >= 0) {
    h = Math.min(1.1, 0.5 + d * 0.08) + smooth(20, 60, d) * (3 + fbm(x * 0.03, z * 0.03) * 7);
  } else {
    // rock shelf
    const shelf = 0.45 + fbm(x * 0.12, z * 0.12) * 0.55;
    const shelfMask = smooth(52, 40, Math.abs(x)) * smooth(-48, -36, z);
    h = lerp(-5.5, shelf, shelfMask);
    for (const [px, pz, r] of pools) {
      const k = 1 - smooth(r * 0.55, r, Math.hypot(x - px, z - pz));
      h = lerp(h, -0.9, k * shelfMask);
    }
  }
  return h;
}

const rocks = [
  [-35, -30, 6, 1], [36, -26, 7, 2], [-4, -36, 5, 3], [30, -38, 4, 4], [-40, -8, 4.5, 5],
  [42, -6, 4, 6], [16, -32, 3, 7], [-20, -38, 3.5, 8],
];

const layout = {
  key: 'magpupungko',
  size: 200,
  spawn: [0, 20],
  spawnYaw: 0,
  palette: { ...PALETTES.rocky, sand: '#b8ab92', wet: '#9a8f78', rock: '#6f6a61' },
  water: { shallow: '#58e8e0', deep: '#0369a1', wave: 1.1, depthScale: 6 },
  height,
  platforms: [],
  obstacles: rocks.map(([x, z, s]) => ({ x, z, r: s * 0.95 })).concat([{ x: -30, z: 30, r: 3 }, { x: 28, z: 28, r: 2.4 }]),
  npcs: [
    { key: 'lola_pacing', pos: [-18, 16], rotY: 0.5, look: LOOKS.elder },
    { key: 'tour_guide_ben', pos: [9, 14], rotY: -0.3, look: LOOKS.guide, quiz: 'tidal_pools' },
  ],
  info: {
    activity: 'explore_magpupungko',
    points: [
      { x: -6, z: -3, title: 'How the Pools Formed', text: 'Over thousands of years, waves carved hollows into the limestone shelf. At low tide the sea retreats and the hollows stay filled — natural tidal pools.' },
      { x: 18, z: -10, title: 'Life in the Pools', text: 'Sea urchins, small fish, crabs and anemones survive heat and salt changes in the pools. Look, but never take them home.' },
      { x: -22, z: -16, title: 'Check the Tide', text: 'The pools are only safe at low tide. At high tide, waves crash over the rocks. Always ask a local guide for the tide schedule.' },
    ],
  },
  trashAreas: [{ x0: -45, x1: 45, z0: -34, z1: 22 }],
  trashValid: (x, z) => height(x, z) > 0.15 && height(x, z) < 1.8 && !rocks.some(([rx, rz, s]) => Math.hypot(x - rx, z - rz) < s + 1),
  islands: [{ x: -200, z: -260, s: 50 }],
  Features,
};
layout.palms = genPalms('magpupungko', 55, [{ x0: -95, x1: 95, z0: 20, z1: 95 }], layout, {
  avoid: [[-30, 30, 6], [28, 28, 5], [0, 20, 4], [-18, 16, 3], [9, 14, 3]],
});

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      {rocks.map(([x, z, s, seed]) => (
        <Rock key={seed} position={[x, y(x, z) + s * 0.25, z]} scale={[s, s * 1.4, s]} seed={seed} color="#8f897d" rotation={seed} />
      ))}
      <Sign position={[-9, y(-9, 23), 23]} rotation={0.5} title="MAGPUPUNGKO" subtitle="Rock Pools · Pilar" width={5} height={1.6} postHeight={2.2} accent="#ff9f43" />
      <Sign position={[-8, y(-8, 14), 14]} rotation={0.3} title="DO NOT TAKE SHELLS" subtitle="Leave creatures in the pools" width={4.2} height={1.2} bg="#7a2e1f" accent="#f4d6a0" />
      <NipaHut position={[-30, y(-30, 30), 30]} rotation={0.3} />
      <Stall position={[28, y(28, 28), 28]} rotation={-0.3} color="#00b4d8" sign="GUIDE DESK" />
      <EcoBin position={[4, y(4, 17), 17]} />
      <Birds center={[0, 0, -10]} radius={35} />
      <DistantIslands items={layout.islands} />
    </group>
  );
}

export default layout;
