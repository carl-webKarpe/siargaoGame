import { useEffect } from 'react';
import { interactables } from '../game/registry.js';
import { useGame } from '../game/store.js';
import { Sign } from '../environments/props.jsx';

/** Educational info board. Reading it completes an "explore" activity step. */
export default function InfoBoard({ point, index, activity, groundY }) {
  useEffect(
    () =>
      interactables.register({
        id: `info:${activity}:${index}`,
        kind: 'info',
        x: point.x,
        y: groundY,
        z: point.z,
        radius: 2.8,
        label: `Read: ${point.title}`,
        onInteract: () => useGame.getState().openModal('info', { ...point, activity, index }),
      }),
    [point, index, activity, groundY]
  );
  return (
    <group>
      <Sign position={[point.x, groundY, point.z]} rotation={point.rot ?? 0} title="i" subtitle={point.title} width={2.2} height={1.4} postHeight={1.1} bg="#00b4d8" accent="#ffffff" />
    </group>
  );
}
