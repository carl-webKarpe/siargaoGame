import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * Stylized low-poly character built from primitives. Animated through an
 * `anim` ref: { speed (0..1+), airborne, pose: 'stand'|'surf'|'paddle'|'sit'|'wave' }.
 * Swap with a rigged GLB by keeping the same props (see README).
 */
const Humanoid = forwardRef(function Humanoid(
  { look = {}, anim, castShadow = true, backpack = false },
  ref
) {
  const root = useRef();
  const body = useRef();
  const armL = useRef();
  const armR = useRef();
  const legL = useRef();
  const legR = useRef();
  const head = useRef();
  const phase = useRef(Math.random() * 10);
  useImperativeHandle(ref, () => root.current);

  const skin = look.skin || '#c68b59';
  const hair = look.hair || '#2b1b10';
  const shirt = look.shirt || '#ffffff';
  const shorts = look.shorts || '#1f3b5a';
  const hat = look.hat || null;

  useFrame((_, dt) => {
    const a = anim?.current || {};
    const speed = a.speed ?? 0;
    phase.current += dt * (4 + speed * 8);
    const t = phase.current;
    const pose = a.pose || 'stand';
    let swing = Math.sin(t) * Math.min(1, speed) * 0.9;
    if (a.airborne) swing = 0.6;
    if (pose === 'stand' || pose === 'walk') {
      legL.current.rotation.x = swing;
      legR.current.rotation.x = -swing;
      armL.current.rotation.set(-swing * 0.8, 0, 0.08);
      armR.current.rotation.set(swing * 0.8, 0, -0.08);
      body.current.position.y = 1.05 + Math.abs(Math.sin(t)) * 0.06 * Math.min(1, speed) + (speed < 0.05 ? Math.sin(t * 0.5) * 0.015 : 0);
      body.current.rotation.set(0, 0, 0);
      head.current.rotation.y = speed < 0.05 ? Math.sin(t * 0.2) * 0.3 : 0;
    } else if (pose === 'wave') {
      legL.current.rotation.x = 0;
      legR.current.rotation.x = 0;
      armL.current.rotation.set(0, 0, 0.08);
      armR.current.rotation.set(0, 0, -2.6 + Math.sin(t * 2) * 0.3);
      body.current.position.y = 1.05;
    } else if (pose === 'surf') {
      const lean = a.lean ?? 0;
      legL.current.rotation.set(0.5, 0, 0.3);
      legR.current.rotation.set(-0.5, 0, -0.3);
      armL.current.rotation.set(0, 0, 1.3 + lean * 0.5);
      armR.current.rotation.set(0, 0, -1.3 + lean * 0.5);
      body.current.position.y = 0.85;
      body.current.rotation.set(0, Math.PI / 2, lean * 0.4);
    } else if (pose === 'paddle') {
      legL.current.rotation.set(-1.5, 0, 0);
      legR.current.rotation.set(-1.5, 0, 0);
      armL.current.rotation.set(-2.2 + Math.sin(t * 1.5) * 1.2, 0, 0.2);
      armR.current.rotation.set(-2.2 - Math.sin(t * 1.5) * 1.2, 0, -0.2);
      body.current.position.y = 0.25;
      body.current.rotation.set(Math.PI / 2 - 0.15, 0, 0);
    } else if (pose === 'sit') {
      legL.current.rotation.set(-1.4, 0, 0.1);
      legR.current.rotation.set(-1.4, 0, -0.1);
      const stroke = Math.sin(t * 1.2) * (a.paddling ? 1 : 0.15);
      armL.current.rotation.set(-1.0 + stroke * 0.5, 0, 0.4);
      armR.current.rotation.set(-1.0 - stroke * 0.5, 0, -0.4);
      body.current.position.y = 0.55;
      body.current.rotation.set(0, stroke * 0.15, 0);
    }
  });

  return (
    <group ref={root}>
      <group ref={body} position-y={1.05}>
        {/* torso */}
        <mesh position-y={0.45} castShadow={castShadow}>
          <boxGeometry args={[0.62, 0.72, 0.36]} />
          <meshStandardMaterial color={shirt} roughness={0.8} />
        </mesh>
        <mesh position-y={0.02} castShadow={castShadow}>
          <boxGeometry args={[0.6, 0.22, 0.34]} />
          <meshStandardMaterial color={shorts} roughness={0.8} />
        </mesh>
        {backpack && (
          <mesh position={[0, 0.48, -0.27]} castShadow={castShadow}>
            <boxGeometry args={[0.5, 0.55, 0.22]} />
            <meshStandardMaterial color="#1b2a38" />
          </mesh>
        )}
        {/* head */}
        <group ref={head} position-y={1.1}>
          <mesh castShadow={castShadow}>
            <boxGeometry args={[0.46, 0.46, 0.44]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.2, -0.03]}>
            <boxGeometry args={[0.5, 0.16, 0.5]} />
            <meshStandardMaterial color={hair} roughness={1} />
          </mesh>
          <mesh position={[0, 0.06, -0.2]}>
            <boxGeometry args={[0.5, 0.36, 0.12]} />
            <meshStandardMaterial color={hair} roughness={1} />
          </mesh>
          {[-0.11, 0.11].map((x) => (
            <mesh key={x} position={[x, 0.02, 0.225]}>
              <boxGeometry args={[0.07, 0.09, 0.02]} />
              <meshBasicMaterial color="#1a1a1a" />
            </mesh>
          ))}
          <mesh position={[0, -0.12, 0.225]}>
            <boxGeometry args={[0.14, 0.03, 0.02]} />
            <meshBasicMaterial color="#7a3b2e" />
          </mesh>
          {hat?.style === 'cap' && (
            <group position-y={0.3}>
              <mesh>
                <cylinderGeometry args={[0.27, 0.27, 0.14, 10]} />
                <meshStandardMaterial color={hat.color} />
              </mesh>
              <mesh position={[0, -0.05, 0.25]}>
                <boxGeometry args={[0.4, 0.03, 0.25]} />
                <meshStandardMaterial color={hat.color} />
              </mesh>
            </group>
          )}
          {hat?.style === 'salakot' && (
            <mesh position-y={0.42}>
              <coneGeometry args={[0.55, 0.35, 10]} />
              <meshStandardMaterial color={hat.color} flatShading />
            </mesh>
          )}
        </group>
        {/* arms */}
        <group ref={armL} position={[-0.4, 0.75, 0]}>
          <mesh position-y={-0.3} castShadow={castShadow}>
            <boxGeometry args={[0.17, 0.62, 0.17]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          <mesh position-y={-0.06}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
        </group>
        <group ref={armR} position={[0.4, 0.75, 0]}>
          <mesh position-y={-0.3} castShadow={castShadow}>
            <boxGeometry args={[0.17, 0.62, 0.17]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          <mesh position-y={-0.06}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
        </group>
        {/* legs */}
        <group ref={legL} position={[-0.16, -0.05, 0]}>
          <mesh position-y={-0.5} castShadow={castShadow}>
            <boxGeometry args={[0.2, 0.9, 0.2]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          <mesh position={[0, -0.97, 0.05]}>
            <boxGeometry args={[0.22, 0.1, 0.32]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
        </group>
        <group ref={legR} position={[0.16, -0.05, 0]}>
          <mesh position-y={-0.5} castShadow={castShadow}>
            <boxGeometry args={[0.2, 0.9, 0.2]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          <mesh position={[0, -0.97, 0.05]}>
            <boxGeometry args={[0.22, 0.1, 0.32]} />
            <meshStandardMaterial color="#e8e8e8" />
          </mesh>
        </group>
      </group>
    </group>
  );
});

export default Humanoid;
