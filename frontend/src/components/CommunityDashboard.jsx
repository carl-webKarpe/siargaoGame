import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { cleanColor, ROLE_LABEL } from '../game/format.js';
import ProgressBar from './ui/ProgressBar.jsx';

/** Shared island conservation dashboard (data from validated mission records). */
export default function CommunityDashboard({ dark = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api.community().then(setData).catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p>Loading community progress…</p>;
  const t = data.totals;
  const card = dark ? 'bg-white/10' : 'bg-sand/40';
  const tiles = [
    ['🧹', 'Cleanup missions completed', t.cleanup_missions],
    ['🗑️', 'Litter collected', t.trash_collected],
    ['🤝', 'Contribution points', t.contribution_points],
    ['🐢', 'Marine conservation actions', t.marine_records],
    ['🛠️', 'Maintenance records', t.maintenance_records],
    ['🏁', 'All missions completed', t.all_missions],
  ];
  return (
    <div className="space-y-5">
      <div className={`rounded-2xl p-4 ${card}`}>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm font-bold opacity-70">SIARGAO COMMUNITY PROGRESS</div>
            <div className="font-display text-4xl font-extrabold">{data.overallCleanliness}% clean</div>
          </div>
          <div className="text-right text-sm font-semibold opacity-80">
            🏡 {t.locals} Local Residents
            <br />🎒 {t.tourists} Tourists
          </div>
        </div>
        <ProgressBar value={data.overallCleanliness} color="linear-gradient(90deg,#00b4d8,#2e8b57)" height="h-4" className="mt-2" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map(([i, l, v]) => (
          <div key={l} className={`rounded-xl p-3 ${card}`}>
            <div className="text-2xl">{i}</div>
            <div className="font-display text-2xl font-extrabold">{v}</div>
            <div className="text-xs font-semibold opacity-70">{l}</div>
          </div>
        ))}
      </div>
      <div>
        <h3 className="mb-2 font-display text-xl font-bold">Destination cleanliness</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.spots.map((s) => (
            <div key={s.key}>
              <div className="flex justify-between text-sm font-bold">
                <span>{s.name}</span>
                <span style={{ color: cleanColor(s.cleanliness) }}>{s.cleanliness.toFixed(0)}%</span>
              </div>
              <ProgressBar value={s.cleanliness} color={cleanColor(s.cleanliness)} />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-display text-xl font-bold">Top island helpers</h3>
          <ol className="space-y-1 text-sm">
            {data.topHelpers.map((h, i) => (
              <li key={h.username} className={`flex justify-between rounded-lg px-3 py-1.5 ${card}`}>
                <span>{i + 1}. {h.username} <span className="opacity-60">({ROLE_LABEL[h.role]})</span></span>
                <b>🍃 {h.eco_points}</b>
              </li>
            ))}
            {!data.topHelpers.length && <li className="opacity-60">Be the first to help!</li>}
          </ol>
          <div className="mt-3 text-sm font-semibold">
            Contribution by role: 🏡 Locals {data.contributionByRole.local_resident || 0} pts · 🎒 Tourists {data.contributionByRole.tourist || 0} pts
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-display text-xl font-bold">Recent maintenance records</h3>
          <ul className="space-y-1 text-sm">
            {data.recentMaintenance.map((r, i) => (
              <li key={i} className={`rounded-lg px-3 py-1.5 ${card}`}>
                <b>{r.username}</b> {r.source === 'mission' ? `completed "${r.mission}"` : 'did maintenance'} at {r.spot}
                <span className="block text-xs opacity-60">{new Date(r.created_at).toLocaleString()}</span>
              </li>
            ))}
            {!data.recentMaintenance.length && <li className="opacity-60">No records yet.</li>}
          </ul>
        </div>
      </div>
      <p className="rounded-xl bg-tropical/90 p-3 text-center text-sm font-bold text-white">
        Whether you are a local resident or a tourist, Siargao is everyone's responsibility.
      </p>
    </div>
  );
}
