import { fbm, lerp, smooth } from '../terrain.js';
import { LOOKS, PALETTES, genPalms } from '../common.js';
import { genJungle } from '../vegetation.jsx';
import { Bush, Rock, Sign, Waterfall, Bench, EcoBin } from '../props.jsx';
import { scatter, seedFrom } from '../terrain.js';

// River flows from the basin (0, -42) out toward the west bank of the valley.
const riverX = (z) => -12 * smooth(-40, 10, z) + Math.sin(z * 0.08) * 2;

function height(x, z) {
  let h = 2.2 + fbm(x * 0.03, z * 0.03) * 4 + smooth(20, 90, Math.abs(x)) * 10;
  // river channel
  const rd = Math.abs(x - riverX(z));
  h = lerp(h, -0.7, 1 - smooth(3, 8, rd));
  // basin pool
  const pd = Math.hypot(x, z + 42);
  h = lerp(h, -1.4, 1 - smooth(10, 16, pd));
  // cliff behind the falls
  h += smooth(-54, -64, z) * (20 + fbm(x * 0.05, 0) * 4) * smooth(40, 10, Math.abs(x));
  h += smooth(-60, -90, z) * 8;
  return h;
}

const rocks = [[-14, -36, 2.2, 1], [13, -34, 2.6, 2], [-8, -52, 3, 3], [9, -52, 2.8, 4], [-26, 14, 1.6, 5], [20, -12, 1.8, 6]];

const layout = {
  key: 'taktak',
  size: 200,
  spawn: [8, 48],
  spawnYaw: 0,
  palette: PALETTES.forest,
  water: { shallow: '#6fd8c1', deep: '#1f6f6a', wave: 0.12, depthScale: 2.5 },
  height,
  platforms: [{ x: riverX(10), z: 10, w: 16, d: 3, y: 1.6 }],
  obstacles: rocks.map(([x, z, s]) => ({ x, z, r: s })),
  npcs: [{ key: 'guide_rico', pos: [14, 36], rotY: -0.4, look: LOOKS.guide, quiz: 'freshwater' }],
  info: {
    activity: 'explore_taktak',
    points: [
      { x: 16, z: 22, title: 'Taktak Falls', text: '"Taktak" means falling water. This multi-tiered waterfall in Santa Monica feeds a river that flows all the way down to the mangroves and the sea.' },
      { x: -24, z: -6, title: 'No Soap in the Pool', text: 'Soaps and shampoos pollute fresh water and harm the fish and plants of the river. Rinse off without them.' },
      { x: 18, z: -26, title: 'Stay on the Trail', text: 'Walking off-trail tramples roots and causes erosion that muddies the river. Litter here travels downstream to the reefs.' },
    ],
  },
  trashAreas: [{ x0: -35, x1: 35, z0: -38, z1: 44 }],
  trashValid: (x, z) => {
    const h = height(x, z);
    return h > 0.3 && h < 6 && !rocks.some(([rx, rz, s]) => Math.hypot(x - rx, z - rz) < s + 1);
  },
  Features,
};
layout.jungle = genJungle(layout, { count: 420, min: 2.5, areas: [{ x0: -100, x1: 100, z0: -100, z1: 100 }], avoid: [[8, 48, 7], [14, 36, 5], [16, 22, 4], [-24, -6, 4], [18, -26, 4], [0, -42, 18]], minDist: 4, scale: [3, 6.5] });
layout.palms = genPalms('taktak', 30, [{ x0: -90, x1: 90, z0: -50, z1: 90 }], layout, {
  min: 1, max: 12, minDist: 6, avoid: [[8, 48, 6], [14, 36, 4], [16, 22, 3], [-24, -6, 3], [18, -26, 3]],
});
const bushes = scatter(seedFrom('taktak-bush'), 70, [{ x0: -95, x1: 95, z0: -60, z1: 95 }], (x, z) => {
  const h = height(x, z);
  return h > 1.2 && Math.abs(x - riverX(z)) > 9 && Math.hypot(x - 8, z - 48) > 6;
}, 4);

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      <Waterfall position={[0, -0.8, -57]} width={8} height={21} />
      <Waterfall position={[0, 6, -54]} width={5} height={8} />
      {rocks.map(([x, z, s, seed]) => (
        <Rock key={seed} position={[x, y(x, z) + s * 0.2, z]} scale={[s, s * 1.1, s]} seed={seed} color="#6d6a62" />
      ))}
      {bushes.map((b, i) => (
        <Bush key={i} position={[b.x, y(b.x, b.z) - 0.1, b.z]} scale={1.2 + b.r * 1.8} color={i % 2 ? '#2f7d3a' : '#3c9147'} />
      ))}
      <Sign position={[4, y(4, 42), 42]} title="TAKTAK FALLS" subtitle="Santa Monica · Keep the river clean" width={5} height={1.6} postHeight={2.2} bg="#2a5a2e" accent="#ffd166" />
      <Bench position={[10, y(10, -30), -30]} rotation={-0.6} />
      <EcoBin position={[12, y(12, 40), 40]} />
    </group>
  );
}

export default layout;
