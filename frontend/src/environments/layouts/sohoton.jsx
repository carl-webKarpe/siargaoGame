import { fbm, lerp, smooth } from '../terrain.js';
import { genPalms, LOOKS, PALETTES } from '../common.js';
import { Bangka, CaveArch, Deck, Jellyfish, Karst, Sign } from '../props.jsx';

function height(x, z) {
  const r = Math.hypot(x, z + 10);
  let h = lerp(-4.5, -0.2, smooth(34, 46, r));
  h += smooth(44, 58, r) * (12 + fbm(x * 0.05, z * 0.05) * 8);
  // southern beach
  const beach = smooth(25, 33, z) * smooth(30, 20, Math.abs(x));
  h = lerp(h, lerp(-0.6, 1.0, smooth(25, 34, z)) + fbm(x * 0.2, z * 0.2) * 0.1, beach);
  return h;
}

const platforms = [
  { x: -18, z: 24, w: 14, d: 6, y: 0.8 },
  { x: -26.5, z: 13, w: 3, d: 18, y: 0.8 },
  { x: 18, z: 24, w: 14, d: 6, y: 0.8 },
  { x: 26.5, z: 13, w: 3, d: 18, y: 0.8 },
];

const jellies = Array.from({ length: 14 }, (_, i) => [Math.cos(i * 2.4) * (8 + (i % 4) * 6), -0.8 - (i % 3) * 0.4, -10 + Math.sin(i * 2.4) * (8 + (i % 4) * 5), i]);

const layout = {
  key: 'sohoton',
  size: 200,
  spawn: [0, 38],
  spawnYaw: 0,
  palette: { ...PALETTES.lagoon, sand: '#efe2bf' },
  water: { shallow: '#7ee8d8', deep: '#0d6f8a', wave: 0.15, depthScale: 5 },
  height,
  platforms,
  obstacles: [],
  npcs: [{ key: 'ranger_ines', pos: [-6, 33.5], rotY: 0.4, look: LOOKS.ranger, quiz: 'protected_cove' }],
  info: {
    activity: 'explore_sohoton',
    points: [
      { x: 6, z: 35, title: 'Protected Landscape', text: 'Sohoton Cove is part of a protected area. Only registered boats and guides may enter, and visitor numbers are limited each day so the ecosystem can recover.' },
      { x: -26.5, z: 6, title: 'Stingless Jellyfish', text: 'The jellyfish here have lost most of their sting. Their bodies are delicate — never squeeze them or lift them out of the water.' },
      { x: 26.5, z: 6, title: 'Engines Off', text: 'Boat engines are switched off inside the cove. Noise, fuel and churned sediment would cloud this clear, calm water.' },
    ],
  },
  trashAreas: [{ x0: -24, x1: 24, z0: 30, z1: 45 }],
  trashValid: (x, z) => height(x, z) > 0.1,
  Features,
};
layout.palms = genPalms('sohoton', 20, [{ x0: -60, x1: 60, z0: 38, z1: 80 }], layout, { min: 0.6, max: 8, avoid: [[0, 38, 5], [-6, 33, 3], [6, 35, 3]] });

function Features({ groundAt }) {
  const y = (x, z) => groundAt(x, z);
  return (
    <group>
      {platforms.map((p, i) => (
        <Deck key={i} p={p} rails={i % 2 ? 'z' : 'x'} />
      ))}
      <CaveArch position={[0, -1, -57]} radius={7} />
      {[[-48, -40, 1], [45, -45, 2], [-55, 10, 3], [55, 5, 4], [-30, -62, 5], [30, -64, 6]].map(([x, z, s]) => (
        <Karst key={s} position={[x, y(x, z) - 6, z]} height={26} radius={9} seed={s + 10} />
      ))}
      {jellies.map(([x, yy, z, i]) => (
        <Jellyfish key={i} position={[x, yy, z]} seed={i} />
      ))}
      <Bangka position={[10, 0.2, 30]} rotation={0.2} color="#2e8b57" bob />
      <Sign position={[-10, y(-10, 41), 41]} rotation={0.5} title="SOHOTON COVE" subtitle="Protected area · Look, don't touch" width={5.2} height={1.6} postHeight={2.2} bg="#2f5233" accent="#ffd166" />
    </group>
  );
}

export default layout;
