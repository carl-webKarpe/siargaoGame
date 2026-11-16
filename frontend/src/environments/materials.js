import * as THREE from 'three';

/**
 * Procedural "detail" materials. They add world-space noise to the albedo and
 * perturb the normal (bump mapping) in the shader, so surfaces read as sand,
 * porous limestone or foliage without needing texture files.
 */
const NOISE_GLSL = /* glsl */ `
  float dHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float dNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dHash(i), dHash(i + vec2(1.0, 0.0)), u.x), mix(dHash(i + vec2(0.0, 1.0)), dHash(i + vec2(1.0)), u.x), u.y);
  }
  float dFbm(vec2 p) {
    float s = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { s += a * dNoise(p); p *= 2.07; a *= 0.5; }
    return s;
  }
  // 3D-ish noise for vertical surfaces (rocks): blend two planar projections.
  float dTri(vec3 p, vec3 n) {
    vec3 w = abs(n); w /= (w.x + w.y + w.z);
    return dFbm(p.yz) * w.x + dFbm(p.xz) * w.y + dFbm(p.xy) * w.z;
  }
`;

const PRESETS = {
  // scale: noise frequency, bump: normal strength, tint: albedo variation, speckle: tiny bright grains
  terrain: { scale: 0.35, bump: 0.6, tint: 0.3, speckle: 0.05, fine: 2.6 },
  rock: { scale: 0.9, bump: 2.6, tint: 0.55, speckle: 0.0, fine: 4.0, pores: 1.0 },
  foliage: { scale: 1.6, bump: 1.8, tint: 0.45, speckle: 0.0, fine: 5.0 },
  bark: { scale: 3.0, bump: 1.2, tint: 0.3, speckle: 0.0, fine: 8.0 },
};

export function detailMaterial(preset = 'terrain', params = {}) {
  const cfg = { ...PRESETS[preset], ...params.detail };
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, ...params.material });
  mat.customProgramCacheKey = () => `detail-${preset}-${JSON.stringify(cfg)}`;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDWorld;\nvarying vec3 vDNormal;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 dWp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vDNormal = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
        #else
          vec4 dWp = modelMatrix * vec4(position, 1.0);
          vDNormal = normalize(mat3(modelMatrix) * normal);
        #endif
        vDWorld = dWp.xyz;`
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vDWorld;\nvarying vec3 vDNormal;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 dP = vDWorld * ${cfg.scale.toFixed(3)};
        float dN1 = dTri(dP, vDNormal);
        float dN2 = dTri(dP * ${cfg.fine.toFixed(2)}, vDNormal);
        diffuseColor.rgb *= (1.0 - ${(cfg.tint / 2).toFixed(3)}) + ${cfg.tint.toFixed(3)} * dN1 + 0.15 * (dN2 - 0.5);
        ${cfg.pores ? 'diffuseColor.rgb *= 1.0 - 0.45 * smoothstep(0.62, 0.8, dTri(dP * 2.3 + 7.0, vDNormal));' : ''}
        ${cfg.speckle ? `diffuseColor.rgb += ${cfg.speckle.toFixed(3)} * step(0.985, dHash(floor(vDWorld.xz * 14.0)));` : ''}`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          float dH = dTri(vDWorld * ${(cfg.scale * cfg.fine).toFixed(3)}, vDNormal) * ${(cfg.bump * 0.05).toFixed(4)}
                   + dTri(vDWorld * ${cfg.scale.toFixed(3)}, vDNormal) * ${(cfg.bump * 0.12).toFixed(4)};
          vec3 sX = dFdx(-vViewPosition); vec3 sY = dFdy(-vViewPosition);
          vec3 r1 = cross(sY, normal); vec3 r2 = cross(normal, sX);
          float det = dot(sX, r1);
          vec2 dHd = vec2(dFdx(dH), dFdy(dH));
          vec3 grad = sign(det) * (dHd.x * r1 + dHd.y * r2);
          normal = normalize(abs(det) * normal - grad);
        }`
      );
  };
  return mat;
}

const cache = new Map();
/** Cached shared instance (props reuse the same compiled program). */
export function sharedDetail(key, preset, params) {
  if (!cache.has(key)) cache.set(key, detailMaterial(preset, params));
  return cache.get(key);
}
