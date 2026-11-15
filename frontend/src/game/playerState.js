import { Vector3 } from 'three';

/** Non-reactive live player state (read by camera, minimap, interactions). */
export const playerState = {
  pos: new Vector3(0, 2, 0),
  yaw: 0, // facing direction
  camYaw: 0,
  speed: 0,
  grounded: true,
  teleport: null, // { x, z, yaw } request handled by the controller
};
