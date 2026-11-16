import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Gradient sky dome with a sun disc and halo. Unlike a physical sky it stays in
 * a controllable colour range, so tropical blues survive tone mapping.
 */
export default function SkyDome({ top, horizon, sunDir, sunColor }) {
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uSun: { value: new THREE.Vector3() },
      uSunColor: { value: new THREE.Color() },
    }),
    []
  );
  uniforms.uTop.value.set(top);
  uniforms.uHorizon.value.set(horizon);
  uniforms.uSun.value.copy(sunDir).normalize();
  uniforms.uSunColor.value.set(sunColor);
  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[1800, 32, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`}
        fragmentShader={`
          uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uSun; uniform vec3 uSunColor;
          varying vec3 vDir;
          void main(){
            vec3 d = normalize(vDir);
            float t = clamp(d.y, 0.0, 1.0);
            vec3 col = mix(uHorizon, uTop, pow(t, 0.45));
            col = mix(col, uHorizon * 0.92, smoothstep(0.0, -0.25, d.y));
            float s = max(dot(d, uSun), 0.0);
            col += uSunColor * (pow(s, 1200.0) * 6.0 + pow(s, 24.0) * 0.28 + pow(s, 4.0) * 0.08);
            gl_FragColor = vec4(col, 1.0);
          }`}
      />
    </mesh>
  );
}
