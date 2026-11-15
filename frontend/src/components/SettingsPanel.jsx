import { useSettings } from '../contexts/SettingsContext.jsx';

function Seg({ value, options, onChange }) {
  return (
    <div className="flex overflow-hidden rounded-xl border-2 border-navy/15">
      {options.map(([v, l]) => (
        <button key={v} onClick={() => onChange(v)} className={`flex-1 px-3 py-1.5 text-sm font-bold ${value === v ? 'bg-ocean text-white' : 'bg-white hover:bg-sand/40'}`}>
          {l}
        </button>
      ))}
    </div>
  );
}

/** Game settings (stored locally in the browser). */
export default function SettingsPanel() {
  const { settings, update, reset } = useSettings();
  return (
    <div className="space-y-4 text-navy">
      <div>
        <div className="label">Graphics quality</div>
        <Seg value={settings.graphics} onChange={(graphics) => update({ graphics })} options={[['low', 'Low'], ['medium', 'Medium'], ['high', 'High']]} />
        <p className="mt-1 text-xs text-navy/60">Low disables shadows and reduces trees — best for older computers and phones.</p>
      </div>
      <div>
        <div className="label">Time of day</div>
        <Seg value={settings.timeOfDay} onChange={(timeOfDay) => update({ timeOfDay })} options={[['day', '☀️ Day'], ['sunset', '🌅 Sunset'], ['cycle', '🔄 Cycle']]} />
      </div>
      <div>
        <label className="label" htmlFor="vol">Ambient sound volume: {Math.round(settings.volume * 100)}%</label>
        <input id="vol" type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(e) => update({ volume: Number(e.target.value) })} className="w-full accent-ocean" />
      </div>
      <div>
        <label className="label" htmlFor="sens">Camera sensitivity: {settings.cameraSensitivity.toFixed(1)}×</label>
        <input id="sens" type="range" min="0.3" max="2.5" step="0.1" value={settings.cameraSensitivity} onChange={(e) => update({ cameraSensitivity: Number(e.target.value) })} className="w-full accent-ocean" />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={settings.invertY} onChange={(e) => update({ invertY: e.target.checked })} className="h-5 w-5 accent-ocean" /> Invert camera Y
        </label>
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" checked={settings.showMinimap} onChange={(e) => update({ showMinimap: e.target.checked })} className="h-5 w-5 accent-ocean" /> Show minimap
        </label>
      </div>
      <div>
        <div className="label">Touch controls</div>
        <Seg value={settings.touchControls} onChange={(touchControls) => update({ touchControls })} options={[['auto', 'Auto'], ['on', 'Always'], ['off', 'Off']]} />
      </div>
      <button className="text-sm font-bold text-ocean underline" onClick={reset}>Reset to defaults</button>
    </div>
  );
}
