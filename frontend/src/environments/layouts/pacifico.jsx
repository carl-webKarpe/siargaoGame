import { fbm, lerp, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { Bench, Birds, DistantIslands, EcoBin, NipaHut, Sign, SurfRack, Umbrella, Deck } from '../props.jsx';
import SurfBreak from '../../activities/surfing/SurfBreak.jsx';

const shore = (x) => 6 + Math.sin(x * 0.025) * 3;

function height(x, z) {
  const d = z - shore(x);
  if (d >= 0) return Math.min(1.3, d * 0.09) + smooth(32, 85, d) * (3 + fbm(x * 0.025, z * 0.03) * 7) + fbm(x * 0.2, z * 0.2) * 0.1;
  let h = Math.max(-1.3, d * 0.1) - fbm(x * 0.1, z * 0.1) * 0.2;
  return lerp(h, -8, smooth(-28, -62, d));
}

const tower = { x: 12, z: 20, w: 3, d: 3, y: 3.2 };

const layout = {
  key: 'pacifico',
  size: 240,
  spawn: [0, 16],
  spawnYaw: -0.1,
  palette: PALETTES.white,
  water: { shallow: '#5ee6dc', deep: '#055a8c', wave: 1.2, depthScale: 8 },
  height,
  platforms: [],
  obstacles: [{ x: -40, z: 26, r: 3 }, { x: 34, z: 27, r: 3 }, { x: 12, z: 20, r: 2 }],
  npcs: [
    { key: 'surfer_aya', pos: [-24, 13], rotY: 0.4, look: { ...LOOKS.surfer, shirt: '#ef476f', hair: '#3b1d0b' }, prop: 'surfboard' },
    { key: 'volunteer_carlo', pos: [20, 13], rotY: -0.5, look: LOOKS.volunteer, quiz: 'turtle_safety' },
  ],
  info: null,
  trashAreas: [{ x0: -80, x1: 80, z0: 5, z1: 28 }],
  trashValid: (x, z) => {
    const h = height(x, z);
    return h > 0.05 && h < 1.8;
  },
  surf: { entry: { x: -30, z: 7.5 }, lineupZ: -66, endZ: -38, peelStart: -40, peelEnd: 32, scenic: true },
  islands: [{ x: -260, z: -220, s: 40 }, { x: 200, z: -320, s: 70 }],
  Features,
};
layout.palms = genPalms('pacifico', 65, [{ x0: -110, x1: 110, z0: 16, z1: 105 }], layout, {
  avoid: [[-40, 26, 6], [34, 27, 6], [12, 20, 4], [0, 16, 4], [-24, 13, 4], [20, 13, 4], [-6, 18, 3]],
});

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      <Sign position={[-11, y(-11, 20), 20]} rotation={0.5} title="PACIFICO" subtitle="San Isidro · Turtle zone ahead" width={5} height={1.6} postHeight={2.2} accent="#2e8b57" />
      <Sign position={[28, y(28, 11), 11]} rotation={-0.4} title="KEEP 3M FROM TURTLES" subtitle="Do not chase or touch" width={4.6} height={1.3} bg="#2e8b57" accent="#f4d6a0" />
      <NipaHut position={[-40, y(-40, 26), 26]} rotation={0.4} />
      <NipaHut position={[34, y(34, 27), 27]} rotation={-0.4} wall="#d4b17e" />
      <SurfRack position={[-33, y(-33, 20), 20]} rotation={0.4} />
      <Deck p={{ ...tower, y: y(12, 20) + tower.y }} rails="xz" />
      <Umbrella position={[-12, y(-12, 12), 12]} color="#00b4d8" />
      <Umbrella position={[46, y(46, 13), 13]} color="#ff9f43" />
      <EcoBin position={[4, y(4, 14), 14]} />
      <Bench position={[-18, y(-18, 20), 20]} rotation={Math.PI} />
      <Birds center={[0, 0, -10]} radius={50} />
      <DistantIslands items={layout.islands} />
      <SurfBreak layout={layout} />
    </group>
  );
}

export default layout;
