import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from '../../characters/Humanoid.jsx';
import { Buoy, Kayak } from '../../environments/props.jsx';
import { consume, input, isDown } from '../../game/input.js';
import { playerState } from '../../game/playerState.js';
import { interactables } from '../../game/registry.js';
import { useGame } from '../../game/store.js';
import { kayakRuntime } from '../runtime.js';
import { onPlatform } from '../../environments/terrain.js';
import { audio } from '../../services/audio.js';

/** Kayaking mini-game: paddle through the buoys and fish out floating litter. */
export default function KayakSession({ layout, look }) {
  const cfg = layout.kayak;
  const boat = useRef();
  const anim = useRef({ pose: 'sit', paddling: false });
  const st = useRef(null);
  const camLook = useRef(new THREE.Vector3());
  const { camera } = useThree();
  const buoyRefs = useRef([]);

  if (!st.current) {
    st.current = {
      x: cfg.start[0], z: cfg.start[1], yaw: cfg.startYaw, speed: 0, next: 0, total: cfg.checkpoints.length,
      startedAt: performance.now(), elapsed: 0, finished: false, submitted: false,
    };
    kayakRuntime.state = st.current;
    kayakRuntime.submit = null;
  }

  useEffect(() => {
    camera.position.set(cfg.start[0], 5, cfg.start[1] + 10);
    const s = st.current;
    kayakRuntime.state = s;
    return () => {
      if (kayakRuntime.state === s) kayakRuntime.state = null;
    };
  }, [camera, cfg]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = st.current;
    const store = useGame.getState();
    const paused = !!store.modal;
    if (!s.finished && !paused) s.elapsed += dt * 1000;

    const joy = input.joystick;
    const fwd = (isDown('forward') ? 1 : 0) + Math.max(0, joy.y) - (isDown('back') ? 0.6 : 0);
    const turn = (isDown('right') ? 1 : 0) - (isDown('left') ? 1 : 0) + joy.x;
    if (!paused) {
      s.speed += fwd * 7 * dt;
      s.speed *= Math.pow(0.55, dt);
      s.speed = THREE.MathUtils.clamp(s.speed, -2, 7);
      s.yaw -= turn * 1.6 * dt * (0.4 + Math.min(1, Math.abs(s.speed) / 4));
      const nx = s.x + Math.sin(s.yaw) * s.speed * dt;
      const nz = s.z + Math.cos(s.yaw) * s.speed * dt;
      if (layout.height(nx, nz) < -0.6 && !onPlatform(layout, nx, nz)) {
        s.x = nx;
        s.z = nz;
      } else {
        s.speed *= -0.3;
      }
    }
    anim.current.paddling = Math.abs(fwd) > 0.1 || Math.abs(turn) > 0.1;

    // checkpoints
    if (!s.finished) {
      const cp = cfg.checkpoints[s.next];
      if (Math.hypot(s.x - cp[0], s.z - cp[1]) < 4) {
        s.next += 1;
        audio.pickup();
        if (s.next >= s.total) {
          s.finished = true;
          audio.success();
          if (!s.submitted) {
            s.submitted = true;
            kayakRuntime.submit = { status: 'pending' };
            store.completeActivity(cfg.activity, { checkpoints: s.total, timeMs: Math.round(s.elapsed) }).then((r) => {
              kayakRuntime.submit = r ? { status: 'ok', res: r } : { status: 'error' };
            });
          }
        }
      }
    }

    // floating litter pickup
    const near = interactables.nearest(s.x, 0, s.z);
    const usable = near && near.kind === 'trash' ? near : null;
    store.setPrompt(usable ? { id: usable.id, label: usable.label, kind: 'trash' } : null);
    if (consume('interact') && usable) usable.onInteract();
    input.pressed.delete('jump');

    const bob = Math.sin(performance.now() / 500) * 0.05;
    if (boat.current) {
      boat.current.position.set(s.x, 0.15 + bob, s.z);
      boat.current.rotation.set(0, s.yaw, Math.sin(performance.now() / 700) * 0.04);
    }
    playerState.pos.set(s.x, 0.2, s.z);
    playerState.camYaw = s.yaw + Math.PI;

    buoyRefs.current.forEach((b, i) => {
      if (b) b.visible = i >= s.next;
    });

    const desired = new THREE.Vector3(s.x - Math.sin(s.yaw) * 9, 4.5, s.z - Math.cos(s.yaw) * 9);
    const look = new THREE.Vector3(s.x + Math.sin(s.yaw) * 4, 0.8, s.z + Math.cos(s.yaw) * 4);
    const k = 1 - Math.exp(-dt * 5);
    camera.position.lerp(desired, k);
    camLook.current.lerp(look, k);
    camera.lookAt(camLook.current);
  });

  return (
    <group>
      <group ref={boat}>
        <Kayak position={[0, 0, 0]} color="#ff9f43" />
        <group position={[0, -0.25, -0.1]}>
          <Humanoid look={look} anim={anim} />
        </group>
      </group>
      {cfg.checkpoints.map(([x, z], i) => (
        <group key={i} ref={(r) => (buoyRefs.current[i] = r)}>
          <BuoyAuto index={i} x={x} z={z} />
        </group>
      ))}
    </group>
  );
}

function BuoyAuto({ index, x, z }) {
  const ref = useRef();
  const active = useRef(false);
  useFrame(() => {
    const s = kayakRuntime.state;
    const isNext = s && s.next === index;
    if (isNext !== active.current && ref.current) {
      active.current = isNext;
      ref.current.scale.setScalar(isNext ? 1.3 : 1);
    }
  });
  return (
    <group ref={ref}>
      <Buoy position={[x, 0.2, z]} active />
      <mesh position={[x, 3, z]}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
    </group>
  );
}
