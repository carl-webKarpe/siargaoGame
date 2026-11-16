import { useCallback, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Atmosphere, { sunDirection, useSunPreset } from './Atmosphere.jsx';
import Terrain from '../environments/Terrain.jsx';
import Ocean from '../environments/Ocean.jsx';
import { Palms } from '../environments/props.jsx';
import { Jungle, Grass, Wrack, genGrass } from '../environments/vegetation.jsx';
import PostFX from './PostFX.jsx';
import { groundHeight } from '../environments/terrain.js';
import NPC from '../characters/NPC.jsx';
import Player from '../characters/Player.jsx';
import Trash from '../missions/Trash.jsx';
import InfoBoard from '../missions/InfoBoard.jsx';
import RepairPoint from '../missions/RepairPoint.jsx';
import Marker from '../missions/Marker.jsx';
import SurfSession from '../activities/surfing/SurfSession.jsx';
import KayakSession from '../activities/kayak/KayakSession.jsx';
import { trashPositions } from '../game/trashPositions.js';
import { useGame } from '../game/store.js';
import { QUALITY } from '../contexts/SettingsContext.jsx';

/** Work out which quest marker to show above each NPC. */
function npcMarkers(layout, missions, spotKey, role) {
  const out = {};
  const first = layout.npcs[0]?.key;
  for (const m of missions) {
    if (m.spotKey !== spotKey) continue;
    const talk = m.objectives.find((o) => o.type === 'talk_npc');
    const giver = talk?.target || first;
    if (m.status === 'active') {
      const done = m.objectives.every((o) => (m.progress?.[o.id]?.count ?? 0) >= o.count);
      if (done) out[giver] = 'ready';
      else if (talk && (m.progress?.[talk.id]?.count ?? 0) < talk.count) out[talk.target] = out[talk.target] || 'active';
    } else if (m.status === 'available' && (m.recommendedRole === 'both' || m.recommendedRole === role)) {
      if (!out[giver]) out[giver] = 'available';
    }
  }
  return out;
}

function World({ layout, settings, look }) {
  const quality = QUALITY[settings.graphics] || QUALITY.medium;
  const detail = useGame((s) => s.detail);
  const trash = useGame((s) => s.trash);
  const missions = useGame((s) => s.missions);
  const mode = useGame((s) => s.mode);
  const modeOptions = useGame((s) => s.modeOptions);
  const modal = useGame((s) => s.modal);
  const role = useGame((s) => s.profile?.role);
  const preset = useSunPreset(settings.timeOfDay);
  const sunDir = useMemo(() => sunDirection(preset), [preset]);
  const fog = useMemo(() => ({ color: preset.fog, near: 160, far: 700 }), [preset]);
  const groundAt = useCallback((x, z) => groundHeight(layout, x, z), [layout]);
  const [repaired, setRepaired] = useState(() => new Set());
  const markRepaired = useCallback((i) => setRepaired((s) => new Set(s).add(i)), []);

  const positions = useMemo(() => trashPositions(layout, trash.total || 0), [layout, trash.total]);
  const visible = useMemo(() => new Set(trash.indices), [trash.indices]);
  const palms = useMemo(() => {
    const list = layout.palms || [];
    const keep = Math.round(list.length * quality.vegetation);
    return list.slice(0, keep);
  }, [layout, quality.vegetation]);
  const jungle = useMemo(() => {
    const list = layout.jungle || [];
    return list.slice(0, Math.round(list.length * quality.vegetation));
  }, [layout, quality.vegetation]);
  const grass = useMemo(() => (layout.grass === false ? [] : genGrass(layout, Math.round((layout.grassCount ?? 900) * quality.grass))), [layout, quality.grass]);
  const npcInfo = useMemo(() => Object.fromEntries((detail?.npcs || []).map((n) => [n.key, n])), [detail]);
  const markers = useMemo(() => npcMarkers(layout, missions, layout.key, role), [layout, missions, role]);
  const actConfig = (key) => detail?.activities.find((a) => a.key === key)?.config || {};

  const Features = layout.Features;
  const surfEntry = layout.surf?.entry;
  const kayak = layout.kayak;

  return (
    <>
      <Atmosphere preset={preset} shadows={quality.shadows} postFx={settings.graphics !== 'low'} />
      <Terrain layout={layout} resolution={quality.terrainRes} />
      <Ocean layout={layout} segments={quality.oceanSegments} cleanliness={detail?.spot.cleanliness ?? 100} sunDir={sunDir} sunColor={preset.sun} fog={fog} sky={{ top: preset.skyTop, horizon: preset.horizon }} />
      <Features groundAt={groundAt} />
      <Palms items={palms} groundAt={groundAt} />
      <Jungle items={jungle} groundAt={groundAt} />
      <Grass items={grass} groundAt={groundAt} />
      {layout.wrack && <Wrack items={layout.wrack} groundAt={groundAt} />}

      {layout.npcs
        .filter((n) => npcInfo[n.key])
        .map((n) => (
          <NPC key={n.key} def={n} info={npcInfo[n.key]} groundY={groundAt(n.pos[0], n.pos[1])} marker={markers[n.key]} />
        ))}

      {positions
        .filter((p) => visible.has(p.index))
        .map((p) => (
          <Trash key={p.index} item={p} groundY={groundAt(p.x, p.z)} />
        ))}

      {layout.info &&
        layout.info.points.map((pt, i) => (
          <InfoBoard key={i} point={pt} index={i} activity={layout.info.activity} groundY={groundAt(pt.x, pt.z)} />
        ))}

      {layout.repair &&
        layout.repair.points.map((pt, i) => (
          <RepairPoint
            key={i}
            point={pt}
            index={i}
            activity={layout.repair.activity}
            label={layout.repair.label}
            kind={layout.repair.kind}
            holdMs={actConfig(layout.repair.activity).holdMs || 1500}
            groundY={groundAt(pt.x, pt.z)}
            done={repaired.has(i)}
            onDone={markRepaired}
          />
        ))}

      {mode === 'explore' && surfEntry && (
        <Marker
          id="surf-entry"
          position={[surfEntry.x, groundAt(surfEntry.x, surfEntry.z), surfEntry.z]}
          label="Go surfing"
          icon="🏄"
          onInteract={() => useGame.getState().openModal('surfSetup')}
        />
      )}
      {mode === 'explore' && kayak && (
        <Marker
          id="kayak-launch"
          position={[kayak.start[0], 1.2, kayak.start[1] + 5]}
          label="Take a kayak"
          icon="🛶"
          color="#ff9f43"
          onInteract={() => useGame.getState().setMode('kayak')}
        />
      )}

      {mode === 'explore' && (
        <Player layout={layout} look={look} active={!modal} sensitivity={settings.cameraSensitivity} invertY={settings.invertY} />
      )}
      {mode === 'surf' && modeOptions && <SurfSession layout={layout} options={modeOptions} look={look} />}
      {mode === 'kayak' && kayak && <KayakSession layout={layout} look={look} />}
      <PostFX quality={settings.graphics} />
    </>
  );
}

export default function DestinationScene({ layout, settings, look }) {
  const quality = QUALITY[settings.graphics] || QUALITY.medium;
  return (
    <Canvas
      shadows={quality.shadows}
      dpr={quality.dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 55, near: 0.1, far: 2500, position: [0, 10, 30] }}
    >
      <World layout={layout} settings={settings} look={look} />
    </Canvas>
  );
}
