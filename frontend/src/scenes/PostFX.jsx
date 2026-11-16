import { EffectComposer, Bloom, N8AO, ToneMapping, Vignette, HueSaturation, BrightnessContrast, SMAA } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

/**
 * Cinematic post-processing: ambient occlusion (high), soft bloom on the sun
 * glitter, filmic tone mapping and a light tropical colour grade.
 */
export default function PostFX({ quality }) {
  if (quality === 'low') return null;
  const high = quality === 'high';
  return (
    <EffectComposer multisampling={high ? 4 : 0} enableNormalPass={false}>
      {high && <N8AO aoRadius={2.2} intensity={2.2} distanceFalloff={1} halfRes quality="performance" />}
      <Bloom intensity={0.35} luminanceThreshold={0.95} luminanceSmoothing={0.15} mipmapBlur />
      <HueSaturation saturation={0.12} />
      <BrightnessContrast brightness={-0.02} contrast={0.1} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.32} darkness={0.42} />
      {!high && <SMAA />}
    </EffectComposer>
  );
}
