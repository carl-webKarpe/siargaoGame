import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { playerState } from '../game/playerState.js';

const PRESETS = {
  day: {
    elevation: 52, azimuth: 200, sun: '#fff4dc', sunI: 2.4, sky: '#bfe8ff', ground: '#d9c7a0', hemiI: 1.1,
    fog: '#bfe3f0', turbidity: 3, rayleigh: 0.8, exposure: 0.85,
  },
  sunset: {
    elevation: 7, azimuth: 180, sun: '#ffb070', sunI: 2.1, sky: '#ffd9b8', ground: '#8a7a8c', hemiI: 1.25,
    fog: '#f2b48c', turbidity: 8, rayleigh: 2.6, exposure: 0.75,
  },
};

function lerpPreset(a, b, t) {
  const c = (x, y) => '#' + new THREE.Color(x).lerp(new THREE.Color(y), t).getHexString();
  const n = (x, y) => x + (y - x) * t;
  return {
    elevation: n(a.elevation, b.elevation), azimuth: n(a.azimuth, b.azimuth), sun: c(a.sun, b.sun), sunI: n(a.sunI, b.sunI),
    sky: c(a.sky, b.sky), ground: c(a.ground, b.ground), hemiI: n(a.hemiI, b.hemiI), fog: c(a.fog, b.fog),
    turbidity: n(a.turbidity, b.turbidity), rayleigh: n(a.rayleigh, b.rayleigh), exposure: n(a.exposure, b.exposure),
  };
}

/** Compute the current sky preset from the time-of-day setting. */
export function useSunPreset(timeOfDay) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (timeOfDay !== 'cycle') return;
    const id = setInterval(() => setT((x) => x + 1), 1500);
    return () => clearInterval(id);
  }, [timeOfDay]);
  return useMemo(() => {
    if (timeOfDay === 'day') return PRESETS.day;
    if (timeOfDay === 'sunset') return PRESETS.sunset;
    const k = (Math.sin((t * 1.5) / 60) + 1) / 2; // ~6 minute cycle
    return lerpPreset(PRESETS.sunset, PRESETS.day, k);
  }, [timeOfDay, t]);
}

export function sunDirection(p) {
  const phi = THREE.MathUtils.degToRad(90 - p.elevation);
  const theta = THREE.MathUtils.degToRad(p.azimuth);
  return new THREE.Vector3().setFromSphericalCoords(1, phi, theta);
}

/** Sky dome, sun light (with player-following shadows), hemisphere light and fog. */
export default function Atmosphere({ preset, shadows = true, follow = true, fogNear = 90, fogFar = 420 }) {
  const light = useRef();
  const { gl, scene } = useThree();
  const dir = useMemo(() => sunDirection(preset), [preset]);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = preset.exposure;
    scene.fog = new THREE.Fog(preset.fog, fogNear, fogFar);
    return () => {
      scene.fog = null;
    };
  }, [gl, scene, preset, fogNear, fogFar]);

  useEffect(() => {
    if (light.current) scene.add(light.current.target);
  }, [scene]);

  useFrame(() => {
    if (!light.current) return;
    const c = follow ? playerState.pos : new THREE.Vector3();
    const d = Math.max(0.25, dir.y) === dir.y ? dir : new THREE.Vector3(dir.x, 0.25, dir.z).normalize();
    light.current.position.set(c.x + d.x * 80, c.y + d.y * 80, c.z + d.z * 80);
    light.current.target.position.copy(c);
  });

  return (
    <>
      <Sky distance={4500} sunPosition={dir.clone().multiplyScalar(100)} turbidity={preset.turbidity} rayleigh={preset.rayleigh} mieCoefficient={0.006} mieDirectionalG={0.85} />
      <hemisphereLight args={[preset.sky, preset.ground, preset.hemiI]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        ref={light}
        color={preset.sun}
        intensity={preset.sunI}
        castShadow={shadows}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={1}
        shadow-camera-far={220}
        shadow-bias={-0.0008}
        shadow-normalBias={0.04}
      />
    </>
  );
}
