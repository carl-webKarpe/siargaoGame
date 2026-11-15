import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from '../../characters/Humanoid.jsx';
import { Surfboard } from '../../environments/props.jsx';
import SurfBreak from './SurfBreak.jsx';
import { createSurfSession, stepSurf } from './surfEngine.js';
import { consume, input, isDown } from '../../game/input.js';
import { playerState } from '../../game/playerState.js';
import { surfRuntime } from '../runtime.js';
import { api } from '../../services/api.js';
import { useGame } from '../../game/store.js';
import { audio } from '../../services/audio.js';

/** The playable surfing mini-game (3D part). */
export default function SurfSession({ layout, options, look }) {
  const engine = useRef(null);
  const rider = useRef();
  const anim = useRef({ pose: 'paddle', speed: 0.6, lean: 0 });
  const camLook = useRef(new THREE.Vector3());
  const { camera } = useThree();
  const submitted = useRef(false);

  useMemo(() => {
    engine.current = createSurfSession({ surf: layout.surf, boardKey: options.boardKey, challenge: options.challenge });
    surfRuntime.engine = engine.current;
    surfRuntime.submit = null;
    submitted.current = false;
  }, [layout, options]);

  useEffect(() => {
    const e = engine.current;
    surfRuntime.engine = e;
    return () => {
      if (surfRuntime.engine === e) surfRuntime.engine = null;
    };
  }, [options]);

  const submit = async (s) => {
    surfRuntime.submit = { status: 'pending' };
    try {
      const res = await api.submitSurf({
        spotId: layout.key,
        challenge: s.challenge,
        boardKey: s.boardKey,
        score: s.result.score,
        duration: s.result.duration,
        carves: s.result.carves,
        waves: 1,
      });
      surfRuntime.submit = { status: 'ok', res };
      const store = useGame.getState();
      store.setProfile(res.profile);
      if (res.passed) audio.success();
      store.handleUpdates(res.missionUpdates);
    } catch (e) {
      surfRuntime.submit = { status: 'error', error: e.message };
    }
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = engine.current;
    if (!s) return;
    const modalOpen = !!useGame.getState().modal;
    const joy = input.joystick;
    stepSurf(s, modalOpen ? 0 : dt, {
      forward: isDown('forward') || joy.y > 0.4,
      left: isDown('left') || joy.x < -0.35,
      right: isDown('right') || joy.x > 0.35,
      catchPressed: consume('jump') || consume('interact'),
    });
    if (s.phase === 'done' && !submitted.current) {
      submitted.current = true;
      submit(s);
    }

    const r = s.rider;
    let y = 0.12;
    if (s.phase === 'ride') y = 2.3 + Math.sin(s.time * 3) * 0.05;
    if (s.phase === 'wipeout') y = Math.max(-0.6, 2.3 - (1.4 - s.wipeoutTimer) * 2.4);
    if (s.phase === 'done' && s.result?.reason === 'wipeout') y = -0.4;
    const g = rider.current;
    if (g) {
      g.position.set(r.x, y, r.z);
      if (s.phase === 'paddle') g.rotation.set(0, 0, 0);
      else if (s.phase === 'wipeout') g.rotation.set(s.time * 6, Math.PI / 2, s.time * 4);
      else g.rotation.set(-0.35, Math.PI / 2 - r.heading, r.lean * 0.35);
    }
    anim.current.pose = s.phase === 'paddle' ? 'paddle' : 'surf';
    anim.current.speed = s.phase === 'paddle' ? 0.3 + s.paddlePower : 0;
    anim.current.lean = r.lean;
    playerState.pos.set(r.x, y, r.z);

    // camera
    const ride = s.phase !== 'paddle';
    const desired = ride
      ? new THREE.Vector3(r.x - 6, y + 4.5, r.z + 12)
      : new THREE.Vector3(r.x + 2, 4.2, r.z + 9);
    const look = ride ? new THREE.Vector3(r.x + 5, y, r.z - 1) : new THREE.Vector3(r.x, 0.5, r.z - 14);
    const k = 1 - Math.exp(-dt * 4);
    camera.position.lerp(desired, k);
    camLook.current.lerp(look, k);
    camera.lookAt(camLook.current);
  });

  useEffect(() => {
    const s = engine.current;
    camera.position.set(s.rider.x + 2, 4.2, s.rider.z + 9);
    camLook.current.set(s.rider.x, 0.5, s.rider.z - 14);
  }, [camera, options]);

  return (
    <group>
      <SurfBreak layout={layout} engine={engine} />
      <group ref={rider}>
        <Surfboard position={[0, 0, 0]} color={engine.current?.board.color} length={engine.current?.boardKey === 'board_short' ? 2 : 2.7} />
        <Humanoid look={look} anim={anim} />
      </group>
    </group>
  );
}
