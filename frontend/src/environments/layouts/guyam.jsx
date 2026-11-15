import { fbm, lerp, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { Bangka, Bench, DistantIslands, EcoBin, NipaHut, Sign, Birds } from '../props.jsx';

function height(x, z) {
  const r = Math.hypot(x, z);
  let h = 2.2 * (1 - (r / 23) ** 2) + fbm(x * 0.2, z * 0.2) * 0.2;
  if (r > 23) h = lerp(-0.2, -0.75, smooth(23, 30, r)) - fbm(x * 0.15, z * 0.15) * 0.25;
  return lerp(h, -6, smooth(46, 62, r));
}

const layout = {
  key: 'guyam',
  size: 180,
  spawn: [2, 17],
  spawnYaw: 0.3,
  palette: PALETTES.white,
  reef: true,
  water: { shallow: '#4ff0dc', deep: '#0369a1', wave: 0.7, depthScale: 6 },
  height,
  platforms: [],
  obstacles: [{ x: -6, z: -5, r: 3 }],
  npcs: [{ key: 'caretaker_lito', pos: [7, 14], rotY: -0.5, look: { ...LOOKS.fisher, hat: null, shirt: '#ffd166' }, quiz: 'responsible_tourism' }],
  info: {
    activity: 'explore_guyam',
    points: [
      { x: -12, z: 12, title: 'Island Caretakers', text: 'Guyam is looked after by caretakers from the barangay. The small environmental fee you pay funds cleanups and their work.' },
      { x: 14, z: -10, title: 'Reef Around Guyam', text: 'Seagrass and coral around the islet shelter juvenile fish that later grow up on the open reef. Never stand on coral when swimming.' },
    ],
  },
  trashAreas: [{ x0: -22, x1: 22, z0: -22, z1: 22 }],
  trashValid: (x, z) => {
    const h = height(x, z);
    return h > 0.05 && h < 1.4;
  },
  islands: [{ x: 120, z: -60, s: 50 }, { x: -80, z: -200, s: 30, h: 3, color: '#f4e4c1' }, { x: -280, z: 80, s: 80 }],
  Features,
};
layout.palms = genPalms('guyam', 26, [{ x0: -18, x1: 18, z0: -18, z1: 18 }], layout, {
  min: 0.6, minDist: 3.2, avoid: [[-6, -5, 4.5], [2, 17, 3], [7, 14, 3], [-12, 12, 2.5], [14, -10, 2.5]],
});

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      <NipaHut position={[-6, y(-6, -5), -5]} rotation={0.8} scale={0.9} />
      <Sign position={[-8, y(-8, 15), 15]} rotation={0.6} title="GUYAM ISLAND" subtitle="Do not carve on the trees" width={4.4} height={1.4} postHeight={1.6} accent="#2e8b57" />
      <EcoBin position={[11, y(11, 9), 9]} rotation={-0.6} />
      <Bench position={[-14, y(-14, 4), 4]} rotation={1.2} />
      <Bangka position={[8, 0.25, 32]} rotation={0.4} />
      <Birds center={[0, 0, 0]} radius={26} height={22} />
      <DistantIslands items={layout.islands} />
    </group>
  );
}

export default layout;
