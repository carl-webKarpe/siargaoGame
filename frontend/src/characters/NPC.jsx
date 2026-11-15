import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Humanoid from './Humanoid.jsx';
import { NameTag, QuestMarker } from './SpriteLabel.jsx';
import { interactables } from '../game/registry.js';
import { playerState } from '../game/playerState.js';
import { useGame } from '../game/store.js';

/** Interactive community NPC with a quest marker and a name tag. */
export default function NPC({ def, info, groundY, marker }) {
  const group = useRef();
  const anim = useRef({ speed: 0, pose: 'stand' });
  const [x, z] = def.pos;
  const name = info?.name || def.key;
  const role = info?.role || '';

  useEffect(
    () =>
      interactables.register({
        id: `npc:${def.key}`,
        kind: 'npc',
        x,
        y: groundY,
        z,
        radius: 3.2,
        label: `Talk to ${name}`,
        onInteract: () => useGame.getState().openModal('dialogue', { npcKey: def.key }),
      }),
    [def.key, x, z, groundY, name]
  );

  const baseRot = def.rotY ?? 0;
  useFrame((_, dt) => {
    if (!group.current) return;
    const d = Math.hypot(playerState.pos.x - x, playerState.pos.z - z);
    const near = d < 7;
    const target = near ? Math.atan2(playerState.pos.x - x, playerState.pos.z - z) : baseRot;
    let diff = target - group.current.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    group.current.rotation.y += diff * Math.min(1, dt * 4);
    anim.current.pose = near && d > 3.5 ? 'wave' : 'stand';
  });

  return (
    <group position={[x, groundY, z]}>
      <group ref={group} rotation-y={baseRot}>
        <Humanoid look={def.look} anim={anim} />
        {def.prop === 'surfboard' && (
          <mesh position={[0.55, 1.2, -0.1]} rotation={[0.1, 0, 0.1]} scale={[0.3, 1.2, 0.05]}>
            <sphereGeometry args={[1, 10, 6]} />
            <meshStandardMaterial color="#00b4d8" />
          </mesh>
        )}
      </group>
      <NameTag name={name} role={role} position={[0, 2.75, 0]} />
      {marker && <QuestMarker type={marker} position={[0, 3.55, 0]} />}
    </group>
  );
}
