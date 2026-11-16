import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Humanoid from './Humanoid.jsx';
import { input, consume, isDown, moveVector } from '../game/input.js';
import { playerState } from '../game/playerState.js';
import { interactables } from '../game/registry.js';
import { useGame } from '../game/store.js';
import { groundHeight, onPlatform } from '../environments/terrain.js';

const WALK = 5.5;
const RUN = 10;
const GRAVITY = 24;
const JUMP = 8;
const MAX_STEP = 1.7;

const angleLerp = (a, b, t) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

/** Third-person player controller with an orbit-follow camera. */
export default function Player({ layout, look, active = true, sensitivity = 1, invertY = false, visible = true }) {
  const group = useRef();
  const anim = useRef({ speed: 0, pose: 'stand' });
  const vy = useRef(0);
  const cam = useRef({ yaw: layout.spawnYaw ?? 0, pitch: 0.32, dist: 9, init: false });
  const hold = useRef({ id: null, t: 0 });
  const { camera, gl } = useThree();

  // Spawn
  useEffect(() => {
    const [x, z] = layout.spawn;
    playerState.pos.set(x, groundHeight(layout, x, z), z);
    playerState.yaw = (layout.spawnYaw ?? 0) + Math.PI;
    cam.current.yaw = layout.spawnYaw ?? 0;
    cam.current.init = false;
    vy.current = 0;
  }, [layout]);

  // Mouse / touch drag to orbit, wheel to zoom.
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let last = null;
    const down = (e) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const move = (e) => {
      if (!dragging || e.pointerId !== last.id) return;
      input.look.dx += e.clientX - last.x;
      input.look.dy += e.clientY - last.y;
      last.x = e.clientX;
      last.y = e.clientY;
    };
    const up = (e) => {
      if (last && e.pointerId === last.id) dragging = false;
    };
    const wheel = (e) => {
      input.zoom += Math.sign(e.deltaY);
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: true });
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl]);

  const tmpTarget = useRef(new THREE.Vector3());

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const p = playerState.pos;
    const c = cam.current;

    if (playerState.teleport) {
      const t = playerState.teleport;
      p.set(t.x, groundHeight(layout, t.x, t.z), t.z);
      if (t.yaw !== undefined) {
        playerState.yaw = t.yaw + Math.PI;
        c.yaw = t.yaw;
      }
      playerState.teleport = null;
    }

    // ---------------- Movement
    let hSpeed = 0;
    if (active) {
      const mv = moveVector();
      const fx = -Math.sin(c.yaw);
      const fz = -Math.cos(c.yaw);
      const rx = Math.cos(c.yaw);
      const rz = -Math.sin(c.yaw);
      let mx = fx * mv.y + rx * mv.x;
      let mz = fz * mv.y + rz * mv.x;
      const mag = Math.hypot(mx, mz);
      const running = isDown('run') || input.touchRun;
      const speed = running ? RUN : WALK;
      if (mag > 0.01) {
        const step = speed * dt;
        const tryMove = (nx, nz) => {
          const lim = layout.size / 2 - 6;
          if (Math.abs(nx) > lim || Math.abs(nz) > lim) return false;
          const plat = onPlatform(layout, nx, nz);
          const terrainH = layout.height(nx, nz);
          if (!plat && terrainH < (layout.minWalk ?? -0.8)) return false;
          const g = groundHeight(layout, nx, nz);
          if (g - p.y > MAX_STEP) return false;
          for (const o of layout.obstacles || []) {
            if (Math.hypot(nx - o.x, nz - o.z) < o.r && (o.top === undefined || p.y < o.top)) return false;
          }
          return true;
        };
        const nx = p.x + mx * step;
        const nz = p.z + mz * step;
        if (tryMove(nx, nz)) {
          p.x = nx;
          p.z = nz;
        } else if (tryMove(nx, p.z)) {
          p.x = nx;
        } else if (tryMove(p.x, nz)) {
          p.z = nz;
        }
        playerState.yaw = angleLerp(playerState.yaw, Math.atan2(mx, mz), Math.min(1, dt * 12));
        hSpeed = speed * Math.min(1, mag);
      }
      if (playerState.grounded && consume('jump')) {
        vy.current = JUMP;
        playerState.grounded = false;
      }
    } else {
      input.pressed.delete('jump');
    }

    const ground = groundHeight(layout, p.x, p.z);
    vy.current -= GRAVITY * dt;
    p.y += vy.current * dt;
    if (p.y <= ground || (playerState.grounded && p.y - ground < 0.35 && vy.current <= 0)) {
      p.y = ground;
      vy.current = 0;
      playerState.grounded = true;
    } else {
      playerState.grounded = false;
    }
    playerState.speed = hSpeed;

    if (group.current) {
      group.current.position.copy(p);
      group.current.rotation.y = playerState.yaw;
    }
    anim.current.speed = hSpeed / WALK;
    anim.current.airborne = !playerState.grounded;

    // ---------------- Interaction
    if (active) {
      const near = interactables.nearest(p.x, p.y, p.z);
      const store = useGame.getState();
      store.setPrompt(near ? { id: near.id, label: near.label, kind: near.kind, hold: !!near.hold } : null);
      if (near?.hold) {
        if (input.holding.has('interact')) {
          if (hold.current.id !== near.id) hold.current = { id: near.id, t: 0 };
          hold.current.t += dt * 1000;
          const prog = Math.min(1, hold.current.t / near.hold);
          if (Math.abs(store.holdProgress - prog) > 0.02) useGame.setState({ holdProgress: prog });
          if (prog >= 1) {
            hold.current = { id: null, t: 0 };
            input.holding.delete('interact');
            useGame.setState({ holdProgress: 0 });
            near.onInteract();
          }
        } else if (hold.current.t > 0) {
          hold.current = { id: null, t: 0 };
          useGame.setState({ holdProgress: 0 });
        }
        input.pressed.delete('interact');
      } else if (consume('interact') && near) {
        near.onInteract();
      }
    } else {
      input.pressed.delete('interact');
    }

    // ---------------- Camera
    const sens = 0.0055 * sensitivity;
    c.yaw -= input.look.dx * sens;
    c.pitch = THREE.MathUtils.clamp(c.pitch + input.look.dy * sens * (invertY ? -1 : 1), 0.05, 1.2);
    c.dist = THREE.MathUtils.clamp(c.dist + input.zoom * 0.8, 4, 18);
    input.look.dx = 0;
    input.look.dy = 0;
    input.zoom = 0;
    playerState.camYaw = c.yaw;

    const target = tmpTarget.current.set(p.x, p.y + 1.7, p.z);
    // Pull the camera in when a roof or wall (layout.cameraBlockers) is in the way.
    let dist = c.dist;
    const blockers = layout.cameraBlockers || [];
    const blocked = (d) => {
      // sample the line of sight from the player to the camera
      for (let k = 1; k <= 8; k++) {
        const t = (d * k) / 8;
        const bx = target.x + Math.sin(c.yaw) * Math.cos(c.pitch) * t;
        const bz = target.z + Math.cos(c.yaw) * Math.cos(c.pitch) * t;
        const by = target.y + Math.sin(c.pitch) * t;
        if (blockers.some((b) => Math.abs(bx - b.x) < b.w / 2 && Math.abs(bz - b.z) < b.d / 2 && by > b.y0 && by < b.y1)) return true;
      }
      return false;
    };
    while (blockers.length && dist > 2.5 && blocked(dist)) dist -= 0.5;
    const cx = target.x + Math.sin(c.yaw) * Math.cos(c.pitch) * dist;
    const cz = target.z + Math.cos(c.yaw) * Math.cos(c.pitch) * dist;
    let cy = target.y + Math.sin(c.pitch) * dist;
    cy = Math.max(cy, groundHeight(layout, cx, cz) + 0.6, (layout.water?.level ?? 0) + 0.8);
    if (!c.init) {
      camera.position.set(cx, cy, cz);
      c.init = true;
    } else {
      const k = 1 - Math.exp(-dt * 10);
      camera.position.x += (cx - camera.position.x) * k;
      camera.position.y += (cy - camera.position.y) * k;
      camera.position.z += (cz - camera.position.z) * k;
    }
    camera.lookAt(target);
  });

  return (
    <group ref={group} visible={visible}>
      <Humanoid look={look} anim={anim} backpack />
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.2} depthWrite={false} />
      </mesh>
    </group>
  );
}
