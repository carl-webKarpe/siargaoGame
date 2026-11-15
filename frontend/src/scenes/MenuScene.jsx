import { useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import Atmosphere, { sunDirection, useSunPreset } from './Atmosphere.jsx';
import Terrain from '../environments/Terrain.jsx';
import Ocean from '../environments/Ocean.jsx';
import { Palms } from '../environments/props.jsx';
import { groundHeight } from '../environments/terrain.js';
import { playerState } from '../game/playerState.js';
import Humanoid from '../characters/Humanoid.jsx';
import { useSettings, QUALITY } from '../contexts/SettingsContext.jsx';

function OrbitCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.04;
    const r = 58;
    camera.position.set(Math.sin(t) * r + 10, 16 + Math.sin(t * 2) * 2, Math.cos(t) * r * 0.6 + 10);
    camera.lookAt(10, 2, -40);
    playerState.pos.set(0, 0, -20);
  });
  return null;
}

function Strollers({ layout }) {
  const anims = [{ current: { speed: 0.6 } }, { current: { speed: 0.6 } }, { current: { pose: 'wave' } }];
  const refs = [];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.forEach((r, i) => {
      if (!r || i === 2) return;
      const x = -20 + ((t * 2.2 + i * 25) % 60);
      const z = 12 + i * 3;
      r.position.set(x, groundHeight(layout, x, z), z);
      r.rotation.y = Math.PI / 2;
    });
  });
  const looks = [
    { shirt: '#ff9f43', shorts: '#102a43' },
    { shirt: '#2e8b57', shorts: '#333', skin: '#a8703f' },
    { shirt: '#ffffff', shorts: '#1f3b5a', hair: '#2b1b10' },
  ];
  return looks.map((l, i) => (
    <group key={i} ref={(r) => (refs[i] = r)} position={i === 2 ? [0, 1.6, -30] : [0, 0, 0]} rotation-y={i === 2 ? Math.PI : 0}>
      <Humanoid look={l} anim={anims[i]} backpack={i === 2} />
    </group>
  ));
}

function MenuWorld({ layout, settings }) {
  const quality = QUALITY[settings.graphics] || QUALITY.medium;
  const preset = useSunPreset(settings.timeOfDay === 'day' ? 'day' : 'sunset');
  const Features = layout.Features;
  const groundAt = (x, z) => groundHeight(layout, x, z);
  return (
    <>
      <OrbitCamera />
      <Atmosphere preset={preset} shadows={quality.shadows} follow />
      <Terrain layout={layout} resolution={quality.terrainRes} />
      <Ocean layout={layout} segments={quality.oceanSegments} sunDir={sunDirection(preset)} sunColor={preset.sun} fog={{ color: preset.fog, near: 90, far: 420 }} />
      <Features groundAt={groundAt} />
      <Palms items={layout.palms} groundAt={groundAt} />
      <Strollers layout={layout} />
    </>
  );
}

/** Animated Cloud 9 background for the main menu and account pages. */
export default function MenuScene() {
  const { settings } = useSettings();
  const [layout, setLayout] = useState(null);
  useEffect(() => {
    import('../environments/layouts/cloud9.jsx').then((m) => setLayout(m.default));
  }, []);
  const quality = QUALITY[settings.graphics] || QUALITY.medium;
  if (!layout) return <div className="absolute inset-0 bg-gradient-to-b from-sunset via-sky to-ocean" />;
  return (
    <Canvas shadows={quality.shadows} dpr={quality.dpr} camera={{ fov: 50, near: 0.1, far: 2500, position: [0, 15, 60] }}>
      <MenuWorld layout={layout} settings={settings} />
    </Canvas>
  );
}
