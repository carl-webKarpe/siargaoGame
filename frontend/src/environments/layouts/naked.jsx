import { fbm, lerp, smooth } from '../terrain.js';
import { LOOKS, PALETTES } from '../common.js';
import { Bangka, Birds, DistantIslands, Sign } from '../props.jsx';

function height(x, z) {
  const e = (x / 58) ** 2 + (z / 17) ** 2;
  let h = 0.95 * (1 - e) - 0.1 + fbm(x * 0.15, z * 0.15) * 0.08;
  if (e > 1) h = lerp(-0.1, -0.9, smooth(1, 2.2, e));
  h = lerp(h, -6, smooth(3, 8, e));
  return h;
}

const layout = {
  key: 'naked',
  size: 200,
  spawn: [-12, 6],
  spawnYaw: 0.6,
  palette: PALETTES.white,
  water: { shallow: '#6af2e6', deep: '#0284c7', wave: 0.8, depthScale: 5 },
  height,
  platforms: [],
  obstacles: [],
  minWalk: -0.85,
  npcs: [{ key: 'bangkero_toto', pos: [-22, 10], rotY: 0.8, look: LOOKS.boatman }],
  info: {
    activity: 'explore_naked',
    points: [
      { x: -34, z: 0, title: 'Leave No Trace', text: 'Naked Island has no bins and no shade. Plan ahead, carry out everything you carry in, and leave what you find.' },
      { x: 26, z: -3, title: 'A Living Sandbar', text: 'Sandbars change shape with tides and storms. Plastic washed in from the open sea gets trapped here — every cleanup helps the whole coast.' },
    ],
  },
  trashAreas: [{ x0: -55, x1: 55, z0: -15, z1: 15 }],
  trashValid: (x, z) => height(x, z) > 0.02,
  palms: [],
  islands: [
    { x: -60, z: -150, s: 22, color: '#3f8f4f' },
    { x: 90, z: -170, s: 45, color: '#357f45' },
    { x: -260, z: 60, s: 70 },
  ],
  Features,
};

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      <Bangka position={[-30, 0.25, 18]} rotation={0.3} />
      <Bangka position={[18, 0.25, 21]} rotation={-0.2} color="#e63946" />
      <Sign position={[-4, y(-4, 2), 2]} title="NAKED ISLAND" subtitle="No bins here — carry it out!" width={4.8} height={1.5} postHeight={1.8} accent="#ff9f43" />
      <Birds center={[0, 0, 0]} radius={30} height={18} />
      <DistantIslands items={layout.islands} />
    </group>
  );
}

export default layout;
