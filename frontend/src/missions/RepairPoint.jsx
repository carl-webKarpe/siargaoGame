import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { interactables } from '../game/registry.js';
import { useGame } from '../game/store.js';
import { woodTexture } from '../environments/textures.js';

/**
 * A maintenance spot (loose boardwalk plank or a tangled net).
 * Hold E to repair; completion is validated by the backend.
 */
export default function RepairPoint({ point, index, activity, label, kind = 'plank', groundY, done, onDone, holdMs = 1500 }) {
  const glow = useRef();
  useEffect(() => {
    if (done) return undefined;
    return interactables.register({
      id: `repair:${activity}:${index}`,
      kind: 'repair',
      x: point.x,
      y: groundY,
      z: point.z,
      radius: 2.4,
      hold: holdMs,
      label: `Hold E: ${label}`,
      onInteract: async () => {
        const r = await useGame.getState().completeActivity(activity, { pointIndex: index });
        if (r) onDone(index);
      },
    });
  }, [point, index, activity, label, groundY, done, onDone, holdMs]);

  useFrame(({ clock }) => {
    if (glow.current) glow.current.material.opacity = 0.35 + Math.sin(clock.elapsedTime * 4) * 0.25;
  });

  if (kind === 'net') {
    return (
      <group position={[point.x, groundY, point.z]}>
        {done ? (
          <mesh position-y={0.3}>
            <boxGeometry args={[1.2, 0.6, 0.9]} />
            <meshStandardMaterial color="#2e8b57" />
          </mesh>
        ) : (
          <>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[i * 0.4 - 0.4, 0.2, (i % 2) * 0.3]} rotation={[Math.PI / 2 + i, i, 0]}>
                <torusGeometry args={[0.5, 0.08, 5, 10]} />
                <meshStandardMaterial color="#3aa36f" />
              </mesh>
            ))}
            <mesh ref={glow} rotation-x={-Math.PI / 2} position-y={0.03}>
              <ringGeometry args={[1.1, 1.4, 24]} />
              <meshBasicMaterial color="#ff9f43" transparent depthWrite={false} />
            </mesh>
          </>
        )}
      </group>
    );
  }
  return (
    <group position={[point.x, groundY + 0.02, point.z]}>
      <mesh rotation={done ? [0, 0, 0] : [0.25, 0.1, 0.08]} position-y={done ? 0.01 : 0.15}>
        <boxGeometry args={[2.8, 0.1, 0.9]} />
        <meshStandardMaterial map={woodTexture()} color={done ? '#ffffff' : '#c46a3a'} />
      </mesh>
      {!done && (
        <mesh ref={glow} position-y={0.6}>
          <boxGeometry args={[3.1, 1.1, 1.2]} />
          <meshBasicMaterial color="#ff9f43" transparent wireframe depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
