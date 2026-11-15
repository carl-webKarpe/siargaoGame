import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { interactables } from '../game/registry.js';
import { useGame } from '../game/store.js';

function TrashModel({ variant }) {
  switch (variant) {
    case 0: // plastic bottle
      return (
        <group rotation-z={Math.PI / 2}>
          <mesh>
            <cylinderGeometry args={[0.13, 0.13, 0.5, 8]} />
            <meshStandardMaterial color="#9fd8ef" transparent opacity={0.8} roughness={0.2} />
          </mesh>
          <mesh position-y={0.3}>
            <cylinderGeometry args={[0.06, 0.06, 0.1, 6]} />
            <meshStandardMaterial color="#1f6fb2" />
          </mesh>
        </group>
      );
    case 1: // can
      return (
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
          <meshStandardMaterial color="#e63946" metalness={0.6} roughness={0.3} />
        </mesh>
      );
    case 2: // plastic bag
      return (
        <mesh scale={[0.35, 0.18, 0.3]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#f5f5f5" flatShading transparent opacity={0.9} />
        </mesh>
      );
    case 3: // snack wrapper
      return (
        <mesh rotation-x={-0.2}>
          <boxGeometry args={[0.45, 0.04, 0.25]} />
          <meshStandardMaterial color="#ffd166" />
        </mesh>
      );
    default: // tangled fishing line / net
      return (
        <mesh rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.22, 0.05, 5, 10]} />
          <meshStandardMaterial color="#38a169" />
        </mesh>
      );
  }
}

/** One collectable piece of litter. Pickups are validated by the backend. */
export default function Trash({ item, groundY }) {
  const ref = useRef();
  const ring = useRef();
  useEffect(
    () =>
      interactables.register({
        id: `trash:${item.index}`,
        kind: 'trash',
        x: item.x,
        y: item.water ? 0 : groundY,
        z: item.z,
        radius: item.water ? 3.2 : 2.2,
        water: item.water,
        label: 'Pick up litter',
        onInteract: () => useGame.getState().collectTrash(item.index),
      }),
    [item, groundY]
  );
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + item.index;
    if (ref.current && item.water) ref.current.position.y = 0.1 + Math.sin(t * 1.6) * 0.08;
    if (ring.current) {
      const s = 1 + ((t * 0.6) % 1) * 0.8;
      ring.current.scale.set(s, s, s);
      ring.current.material.opacity = 0.6 * (1 - ((t * 0.6) % 1));
    }
  });
  const y = item.water ? 0.1 : groundY + 0.1;
  return (
    <group ref={ref} position={[item.x, y, item.z]} rotation-y={item.rot}>
      <TrashModel variant={item.variant} />
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[0.45, 0.55, 20]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}
