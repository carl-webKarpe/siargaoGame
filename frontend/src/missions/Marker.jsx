import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { IconSprite } from '../characters/SpriteLabel.jsx';
import { interactables } from '../game/registry.js';

/** Glowing activity marker (surf entry, kayak launch…). */
export default function Marker({ id, position, label, icon, color = '#00b4d8', onInteract, radius = 3 }) {
  const ring = useRef();
  useEffect(
    () => interactables.register({ id, kind: 'activity', x: position[0], y: position[1], z: position[2], radius, label, onInteract }),
    [id, position, label, onInteract, radius]
  );
  useFrame(({ clock }) => {
    if (ring.current) ring.current.rotation.z = clock.elapsedTime;
  });
  return (
    <group position={position}>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.05}>
        <ringGeometry args={[1.1, 1.4, 6]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <IconSprite icon={icon} color={color} position={[0, 2.2, 0]} />
    </group>
  );
}
