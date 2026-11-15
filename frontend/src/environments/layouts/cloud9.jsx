import { fbm, lerp, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { Bench, Birds, Deck, DistantIslands, EcoBin, NipaHut, Sign, Stall, SurfRack, Umbrella, ViewingTower } from '../props.jsx';
import SurfBreak from '../../activities/surfing/SurfBreak.jsx';

const shore = (x) => 8 + Math.sin(x * 0.04) * 5;

function height(x, z) {
  const d = z - shore(x);
  if (d >= 0) {
    return Math.min(1.0, d * 0.13) + smooth(26, 70, d) * (2.5 + fbm(x * 0.03, z * 0.03) * 6) + fbm(x * 0.2, z * 0.2) * 0.12;
  }
  let h = Math.max(-0.65, d * 0.13) - fbm(x * 0.15, z * 0.15) * 0.25;
  h = lerp(h, -7, smooth(-58, -82, d));
  return h;
}

const platforms = [
  { x: 0, z: -25, w: 3, d: 66, y: 1.6 }, // boardwalk
  { x: 0, z: -63, w: 11, d: 9, y: 1.6 }, // viewing deck
  { x: 4.5, z: -48, w: 6, d: 3, y: 1.6 }, // surf entry spur
];

const layout = {
  key: 'cloud9',
  size: 240,
  spawn: [-2, 17],
  spawnYaw: 0.15,
  palette: PALETTES.beach,
  reef: true,
  water: { shallow: '#3fe0d0', deep: '#0369a1', wave: 1, depthScale: 7 },
  height,
  platforms,
  obstacles: [
    { x: -16, z: 21, r: 3 },
    { x: -32, z: 27, r: 3 },
    { x: 30, z: 28, r: 3 },
    { x: 55, z: 31, r: 3 },
    { x: 18, z: 17, r: 1.8 },
  ],
  npcs: [
    { key: 'kuya_jun', pos: [-9, 15.5], rotY: 0.6, look: LOOKS.surfer, prop: 'surfboard' },
    { key: 'ate_marites', pos: [14, 12.5], rotY: -0.4, look: LOOKS.volunteer, quiz: 'marine_basics' },
    { key: 'mang_ramon', pos: [-0.9, -14], rotY: Math.PI / 2, look: LOOKS.elder },
  ],
  info: {
    activity: 'explore_cloud9',
    points: [
      { x: -5, z: 11.5, title: 'The Reef Break', text: 'Cloud 9 is a reef break: waves break over living coral. Surfers must never stand on the reef — one step can destroy decades of coral growth.' },
      { x: 9, z: 22, title: 'Why a Boardwalk?', text: 'The famous boardwalk lets visitors reach the lineup without trampling the fragile reef flat. Stay on the boardwalk at low tide!' },
      { x: 3.5, z: -66, title: 'From Beach to Reef', text: 'Plastic left on the beach is carried into the reef by the tide within hours. Picking up one wrapper protects the whole ecosystem.' },
    ],
  },
  repair: { activity: 'boardwalk_repair', label: 'Repair loose plank', points: [{ x: 0, z: -4 }, { x: 0, z: -19 }, { x: 0, z: -33 }, { x: 0, z: -45 }] },
  trashAreas: [{ x0: -75, x1: 75, z0: 2, z1: 26 }],
  trashValid: (x, z) => {
    const h = height(x, z);
    return h > 0.05 && h < 1.6;
  },
  surf: {
    entry: { x: 6.5, z: -48 },
    // waves travel +z (toward shore) and peel along +x
    lineupZ: -86,
    endZ: -60,
    peelStart: 12,
    peelEnd: 82,
    scenic: true,
  },
  islands: [{ x: -220, z: -260, s: 60 }, { x: 160, z: -300, s: 45 }, { x: 320, z: -120, s: 50 }],
  Features,
};
layout.palms = genPalms('cloud9', 70, [{ x0: -110, x1: 110, z0: 14, z1: 105 }], layout, {
  avoid: [[-16, 21, 6], [-32, 27, 6], [30, 28, 6], [55, 31, 6], [0, 18, 5], [-9, 15, 4], [14, 12, 4], [9, 22, 3]],
});

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      {platforms.map((p, i) => (
        <Deck key={i} p={p} rails={i === 0 ? 'z' : i === 1 ? 'xz' : 'x'} />
      ))}
      <ViewingTower position={[0, -3.2, -63]} />
      <Sign position={[0, y(0, 9.5), 9.5]} title="CLOUD 9" subtitle="Boardwalk · Respect the reef" width={5} height={1.6} postHeight={2.4} />
      <NipaHut position={[-16, y(-16, 21), 21]} rotation={0.5} />
      <Sign position={[-11.5, y(-11.5, 20), 20]} rotation={0.5} title="SURF SHOP" subtitle="Board rental" width={3.4} height={1.2} accent="#ff9f43" />
      <SurfRack position={[-13, y(-13, 17), 17]} rotation={0.5} />
      <Stall position={[-32, y(-32, 27), 27]} rotation={0.3} color="#2e8b57" sign="LOCAL MARKET" />
      <NipaHut position={[30, y(30, 28), 28]} rotation={-0.3} wall="#d9b88a" />
      <NipaHut position={[55, y(55, 31), 31]} rotation={-0.5} scale={1.1} />
      <EcoBin position={[18, y(18, 17), 17]} rotation={-0.3} />
      <EcoBin position={[-4, y(-4, 13), 13]} />
      <Umbrella position={[24, y(24, 14), 14]} color="#ff6b6b" />
      <Umbrella position={[38, y(38, 16), 16]} color="#00b4d8" />
      <Umbrella position={[-24, y(-24, 14), 14]} color="#ffd166" />
      <Bench position={[6, y(6, 15), 15]} rotation={Math.PI} />
      <Birds center={[0, 0, -20]} radius={45} />
      <DistantIslands items={layout.islands} />
      <SurfBreak layout={layout} />
    </group>
  );
}

export default layout;
