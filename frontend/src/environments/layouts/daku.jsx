import { fbm, lerp, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { Bangka, Birds, DistantIslands, EcoBin, House, NipaHut, Sign, Stall } from '../props.jsx';

function height(x, z) {
  const e = (x / 105) ** 2 + ((z - 45) / 60) ** 2;
  let h = (1 - e) * 5 + fbm(x * 0.04, z * 0.04) * 1.5 - 0.6;
  h = Math.min(h, 1.2 + Math.max(0, (1 - e) - 0.25) * 9);
  if (e > 1) h = lerp(-0.6, -1.2, smooth(1, 1.4, e));
  return lerp(h, -6, smooth(1.4, 2.2, e));
}

const houses = [
  [-28, 26, '#f4d6a0', '#c0392b', 0.2], [-12, 32, '#87ceeb', '#2e8b57', 0], [20, 32, '#ffe0b3', '#1f6fb2', -0.2],
  [36, 24, '#f7c6c7', '#8e5b3a', -0.4], [4, 40, '#fff1c1', '#c0392b', 0],
];
const huts = [[-44, 18, 0.5], [48, 16, -0.6], [-6, 22, 0.1]];

const layout = {
  key: 'daku',
  size: 240,
  spawn: [0, 5],
  spawnYaw: 0,
  palette: PALETTES.beach,
  water: { shallow: '#4ce3d4', deep: '#0369a1', wave: 0.8, depthScale: 6 },
  height,
  platforms: [],
  obstacles: [
    ...houses.map(([x, z]) => ({ x, z, r: 3 })),
    ...huts.map(([x, z]) => ({ x, z, r: 2.6 })),
    { x: 15, z: 12, r: 2 },
  ],
  npcs: [
    { key: 'mang_tonyo', pos: [-16, 2], rotY: 0.6, look: LOOKS.fisher, quiz: 'community_care' },
    { key: 'aling_nena', pos: [15, 9.5], rotY: -0.1, look: LOOKS.vendor, shop: true },
  ],
  info: null,
  repair: {
    activity: 'help_fisherman',
    label: 'Sort fishing net',
    kind: 'net',
    points: [{ x: -26, z: -3 }, { x: -20, z: -7 }, { x: -11, z: -6 }],
  },
  trashAreas: [{ x0: -90, x1: 90, z0: -12, z1: 20 }],
  trashValid: (x, z) => {
    const h = height(x, z);
    return h > 0.05 && h < 1.5;
  },
  islands: [{ x: -120, z: -140, s: 18 }, { x: 160, z: -200, s: 25, h: 3, color: '#f4e4c1' }, { x: 0, z: -330, s: 90 }],
  Features,
};
layout.palms = genPalms('daku', 70, [{ x0: -110, x1: 110, z0: 0, z1: 105 }], layout, {
  avoid: [...houses.map(([x, z]) => [x, z, 6]), ...huts.map(([x, z]) => [x, z, 5]), [0, 5, 5], [15, 10, 5], [-16, 2, 4], [0, 14, 4]],
});

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      {houses.map(([x, z, c, r, rot], i) => (
        <House key={i} position={[x, y(x, z), z]} color={c} roof={r} rotation={rot} />
      ))}
      {huts.map(([x, z, rot], i) => (
        <NipaHut key={i} position={[x, y(x, z), z]} rotation={rot} />
      ))}
      <Stall position={[15, y(15, 12), 12]} color="#ef476f" sign="ALING NENA'S STORE" />
      <Sign position={[0, y(0, 14), 14]} title="DAKU ISLAND" subtitle="Support local · Bayanihan" width={5} height={1.6} postHeight={2.1} accent="#ffd166" />
      <Bangka position={[-30, 0.2, -16]} rotation={0.2} />
      <Bangka position={[-8, 0.2, -18]} rotation={-0.1} color="#2e8b57" />
      <Bangka position={[30, 0.2, -15]} rotation={0.4} color="#e63946" />
      <EcoBin position={[6, y(6, 8), 8]} />
      <EcoBin position={[-22, y(-22, 10), 10]} />
      <Birds center={[0, 0, 0]} radius={50} />
      <DistantIslands items={layout.islands} />
    </group>
  );
}

export default layout;
