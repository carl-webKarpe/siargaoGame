import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api } from '../services/api.js';
import AdminTable from '../components/admin/AdminTable.jsx';
import MissionEditor from '../components/admin/MissionEditor.jsx';
import CommunityDashboard from '../components/CommunityDashboard.jsx';
import { CATEGORY_LABEL, cleanColor, ROLE_LABEL } from '../game/format.js';
import ProgressBar from '../components/ui/ProgressBar.jsx';

const TABS = [
  ['overview', '📊 Overview'], ['players', '👥 Players'], ['spots', '🏝️ Destinations'], ['missions', '📜 Missions'],
  ['activities', '🎯 Activities'], ['records', '🗂️ Records'], ['community', '🌏 Community'],
];
const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

function useLoad(fn, deps) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const reload = useCallback(() => {
    setError(null);
    fn().then(setData).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => reload(), [reload]);
  return { data, error, reload };
}

function Overview() {
  const { data, error } = useLoad(() => api.get('/admin/stats'), []);
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p>Loading…</p>;
  const s = data.stats;
  const tiles = [
    ['Registered players', s.players], ['Local Residents', s.locals], ['Tourists', s.tourists], ['Missions', s.missions],
    ['Completed missions', s.completions], ['Active missions', s.active], ['Litter collected', s.trash], ['Marine actions', s.marine], ['Surf rides', s.rides],
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {tiles.map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-4 shadow">
            <div className="text-xs font-bold text-navy/60">{k}</div>
            <div className="font-display text-3xl font-extrabold text-navy">{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-white p-4 shadow">
        <h3 className="mb-2 font-display text-xl font-bold">Destination cleanliness</h3>
        <div className="grid gap-2 md:grid-cols-3">
          {data.spots.map((sp) => (
            <div key={sp.id}>
              <div className="flex justify-between text-sm font-bold"><span>{sp.name}{!sp.isActive && ' (hidden)'}</span><span>{sp.cleanliness.toFixed(1)}%</span></div>
              <ProgressBar value={sp.cleanliness} color={cleanColor(sp.cleanliness)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Players() {
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const { data, error } = useLoad(() => api.get(`/admin/players?role=${role}&q=${encodeURIComponent(q)}`), [role, q]);
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    if (sel) api.get(`/admin/players/${sel}`).then(setDetail);
    else setDetail(null);
  }, [sel]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[['', 'All'], ['local_resident', 'Local Residents'], ['tourist', 'Tourists']].map(([k, l]) => (
          <button key={k} onClick={() => setRole(k)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${role === k ? 'bg-navy text-white' : 'bg-white'}`}>{l}</button>
        ))}
        <input className="input max-w-xs !py-1.5" placeholder="Search username or email" value={q} onChange={(e) => setQ(e.target.value)} />
        {data && <span className="self-center text-sm font-semibold">{data.total} players</span>}
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <AdminTable
        rows={data?.players || []}
        onRowClick={(r) => setSel(r.id)}
        columns={[
          { key: 'username', label: 'Username' }, { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role', render: (r) => ROLE_LABEL[r.role] },
          { key: 'level', label: 'Lv' }, { key: 'coins', label: 'Coins' }, { key: 'eco_points', label: 'Eco' },
          { key: 'completed', label: 'Missions' }, { key: 'created_at', label: 'Joined', render: (r) => fmt(r.created_at) },
          { key: 'last_login_at', label: 'Last login', render: (r) => fmt(r.last_login_at) },
        ]}
      />
      {detail && (
        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="flex justify-between">
            <h3 className="font-display text-xl font-bold">{detail.profile.username}</h3>
            <button onClick={() => setSel(null)} className="text-xl">×</button>
          </div>
          <p className="text-sm">
            {ROLE_LABEL[detail.profile.role]} · Lv {detail.profile.level} · {detail.profile.experience} XP · Surf skill {detail.profile.surfingSkill} · Trash {detail.profile.stats.trashCollected} · Best surf {detail.profile.stats.bestSurf}
          </p>
          <ul className="mt-2 grid gap-1 text-sm md:grid-cols-2">
            {detail.missions.map((m, i) => <li key={i} className="rounded bg-sand/30 px-2 py-1">{m.title} — <b>{m.status}</b> {m.completed_at && `(${fmt(m.completed_at)})`}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Spots() {
  const { data, error, reload } = useLoad(() => api.get('/admin/tourist-spots'), []);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState(null);
  const save = async () => {
    setMsg(null);
    try {
      const body = {
        name: edit.name, municipality: edit.municipality, description: edit.description, locationType: edit.locationType, isActive: edit.isActive,
        environment: { ...edit.environment, facts: edit.factsText.split('\n').map((s) => s.trim()).filter(Boolean), trashCount: Number(edit.environment.trashCount) },
      };
      if (edit.id) await api.put(`/admin/tourist-spots/${edit.id}`, body);
      else await api.post('/admin/tourist-spots', { ...body, key: edit.key });
      setEdit(null);
      reload();
    } catch (e) {
      setMsg(e.message);
    }
  };
  const newSpot = () => setEdit({
    key: '', name: '', municipality: '', description: '', locationType: 'beach', isActive: true, factsText: '',
    environment: { theme: 'pacifico', trashCount: 16, surf: false, mapPos: { x: 50, y: 50 }, facts: [] },
  });
  if (error) return <p className="text-red-600">{error}</p>;
  return (
    <div className="space-y-3">
      <button className="btn-green btn-sm" onClick={newSpot}>+ New destination</button>
      {edit && (
        <div className="space-y-2 rounded-2xl bg-white p-4 shadow">
          <h3 className="font-display text-xl font-bold">{edit.id ? `Edit ${edit.name}` : 'New destination'}</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {!edit.id && <div><label className="label">Key (a-z, 0-9, _)</label><input className="input" value={edit.key} onChange={(e) => setEdit({ ...edit, key: e.target.value })} /></div>}
            <div><label className="label">Name</label><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
            <div><label className="label">Municipality</label><input className="input" value={edit.municipality} onChange={(e) => setEdit({ ...edit, municipality: e.target.value })} /></div>
            <div><label className="label">Location type</label><input className="input" value={edit.locationType} onChange={(e) => setEdit({ ...edit, locationType: e.target.value })} /></div>
            <div>
              <label className="label">3D scene theme</label>
              <select className="input" value={edit.environment.theme} onChange={(e) => setEdit({ ...edit, environment: { ...edit.environment, theme: e.target.value } })}>
                {['cloud9', 'magpupungko', 'sugba', 'naked', 'guyam', 'daku', 'pacifico', 'sohoton', 'taktak'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Trash spawn points</label><input type="number" className="input" value={edit.environment.trashCount} onChange={(e) => setEdit({ ...edit, environment: { ...edit.environment, trashCount: e.target.value } })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="label">Map X %</label><input type="number" className="input" value={edit.environment.mapPos.x} onChange={(e) => setEdit({ ...edit, environment: { ...edit.environment, mapPos: { ...edit.environment.mapPos, x: Number(e.target.value) } } })} /></div>
              <div><label className="label">Map Y %</label><input type="number" className="input" value={edit.environment.mapPos.y} onChange={(e) => setEdit({ ...edit, environment: { ...edit.environment, mapPos: { ...edit.environment.mapPos, y: Number(e.target.value) } } })} /></div>
            </div>
            <div className="md:col-span-2"><label className="label">Description</label><textarea className="input" rows={2} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            <div className="md:col-span-2"><label className="label">Educational facts (one per line)</label><textarea className="input" rows={3} value={edit.factsText} onChange={(e) => setEdit({ ...edit, factsText: e.target.value })} /></div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={edit.environment.surf} onChange={(e) => setEdit({ ...edit, environment: { ...edit.environment, surf: e.target.checked } })} /> Surf break</label>
              <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={edit.isActive} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} /> Visible to players</label>
            </div>
          </div>
          <p className="text-xs text-navy/60">Cleanliness cannot be edited here — it only changes through validated cleanup records.</p>
          {msg && <p className="text-sm font-semibold text-red-600">{msg}</p>}
          <div className="flex gap-2"><button className="btn-green btn-sm" onClick={save}>Save</button><button className="btn btn-sm border" onClick={() => setEdit(null)}>Cancel</button></div>
        </div>
      )}
      <AdminTable
        rows={data?.spots || []}
        onRowClick={(r) => setEdit({ ...r, factsText: (r.environment.facts || []).join('\n') })}
        columns={[
          { key: 'name', label: 'Destination' }, { key: 'municipality', label: 'Municipality' }, { key: 'locationType', label: 'Type' },
          { key: 'cleanliness', label: 'Cleanliness', render: (r) => `${r.cleanliness.toFixed(1)}%` },
          { key: 'surf', label: 'Surf', render: (r) => (r.environment.surf ? '🏄' : '') },
          { key: 'isActive', label: 'Visible', render: (r) => (r.isActive ? '✔' : '✕') },
        ]}
      />
    </div>
  );
}

function Missions() {
  const missions = useLoad(() => api.get('/admin/missions'), []);
  const spots = useLoad(() => api.get('/admin/tourist-spots'), []);
  const lookups = useLoad(() => api.get('/admin/lookups'), []);
  const [edit, setEdit] = useState(undefined);
  if (missions.error) return <p className="text-red-600">{missions.error}</p>;
  if (!missions.data || !spots.data || !lookups.data) return <p>Loading…</p>;
  return (
    <div className="space-y-3">
      {edit === undefined && <button className="btn-green btn-sm" onClick={() => setEdit(null)}>+ Create mission</button>}
      {edit !== undefined && (
        <MissionEditor
          key={edit?.id ?? 'new'}
          mission={edit}
          spots={spots.data.spots}
          lookups={lookups.data}
          onCancel={() => setEdit(undefined)}
          onSaved={() => {
            setEdit(undefined);
            missions.reload();
          }}
        />
      )}
      <AdminTable
        rows={missions.data.missions}
        onRowClick={(r) => setEdit(r)}
        columns={[
          { key: 'title', label: 'Mission' }, { key: 'spotName', label: 'Destination' },
          { key: 'category', label: 'Category', render: (r) => CATEGORY_LABEL[r.category] },
          { key: 'recommendedRole', label: 'For', render: (r) => (r.recommendedRole === 'both' ? 'Both' : ROLE_LABEL[r.recommendedRole]) },
          { key: 'difficulty', label: 'Difficulty' }, { key: 'rewardXp', label: 'XP' }, { key: 'rewardCoins', label: 'Coins' },
          { key: 'objectives', label: 'Objectives', render: (r) => r.objectives.length },
          { key: 'isActive', label: 'Active', render: (r) => (r.isActive ? '✔' : '✕') },
        ]}
      />
    </div>
  );
}

function Activities() {
  const acts = useLoad(() => api.get('/admin/activities'), []);
  const spots = useLoad(() => api.get('/admin/tourist-spots'), []);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState(null);
  const save = async () => {
    setMsg(null);
    try {
      const config = JSON.parse(edit.configText || '{}');
      const body = { spotId: Number(edit.spotId), name: edit.name, type: edit.type, description: edit.description, config, isActive: edit.isActive };
      if (edit.id) await api.put(`/admin/activities/${edit.id}`, body);
      else await api.post('/admin/activities', { ...body, key: edit.key || undefined });
      setEdit(null);
      acts.reload();
    } catch (e) {
      setMsg(e instanceof SyntaxError ? 'Config must be valid JSON' : e.message);
    }
  };
  if (!acts.data || !spots.data) return <p>Loading…</p>;
  return (
    <div className="space-y-3">
      <button className="btn-green btn-sm" onClick={() => setEdit({ spotId: spots.data.spots[0].id, name: '', type: 'explore', description: '', configText: '{"points": 1}', isActive: true, key: '' })}>+ New activity</button>
      {edit && (
        <div className="grid gap-2 rounded-2xl bg-white p-4 shadow md:grid-cols-2">
          {!edit.id && <div><label className="label">Key</label><input className="input" value={edit.key} onChange={(e) => setEdit({ ...edit, key: e.target.value })} /></div>}
          <div><label className="label">Name</label><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
          <div>
            <label className="label">Destination</label>
            <select className="input" value={edit.spotId} onChange={(e) => setEdit({ ...edit, spotId: e.target.value })}>
              {spots.data.spots.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value })}>
              {['cleanup', 'maintenance', 'surf', 'explore', 'kayak', 'community', 'quiz'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="md:col-span-2"><label className="label">Description</label><input className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
          <div className="md:col-span-2"><label className="label">Config (JSON)</label><input className="input font-mono" value={edit.configText} onChange={(e) => setEdit({ ...edit, configText: e.target.value })} /></div>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={edit.isActive} onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })} /> Active</label>
          {msg && <p className="text-sm font-semibold text-red-600 md:col-span-2">{msg}</p>}
          <div className="flex gap-2 md:col-span-2"><button className="btn-green btn-sm" onClick={save}>Save</button><button className="btn btn-sm border" onClick={() => setEdit(null)}>Cancel</button></div>
        </div>
      )}
      <AdminTable
        rows={acts.data.activities}
        onRowClick={(r) => setEdit({ ...r, configText: JSON.stringify(r.config) })}
        columns={[
          { key: 'name', label: 'Activity' }, { key: 'key', label: 'Key' }, { key: 'spotName', label: 'Destination' }, { key: 'type', label: 'Type' },
          { key: 'config', label: 'Config', render: (r) => <code className="text-xs">{JSON.stringify(r.config)}</code> },
          { key: 'isActive', label: 'Active', render: (r) => (r.isActive ? '✔' : '✕') },
        ]}
      />
    </div>
  );
}

const RECORD_COLUMNS = {
  missions: [
    { key: 'username', label: 'Player' }, { key: 'role', label: 'Role', render: (r) => ROLE_LABEL[r.role] }, { key: 'title', label: 'Mission' },
    { key: 'spot', label: 'Destination' }, { key: 'status', label: 'Status' }, { key: 'completed_at', label: 'Completed', render: (r) => fmt(r.completed_at) },
  ],
  cleanliness: [
    { key: 'username', label: 'Player' }, { key: 'role', label: 'Role', render: (r) => ROLE_LABEL[r.role] }, { key: 'spot', label: 'Destination' },
    { key: 'source', label: 'Source' }, { key: 'cleanup_count', label: 'Items' }, { key: 'contribution_points', label: 'Points' },
    { key: 'mission', label: 'Mission' }, { key: 'created_at', label: 'When', render: (r) => fmt(r.created_at) },
  ],
  marine: [
    { key: 'username', label: 'Player' }, { key: 'role', label: 'Role', render: (r) => ROLE_LABEL[r.role] }, { key: 'spot', label: 'Destination' },
    { key: 'activity_type', label: 'Activity' }, { key: 'details', label: 'Details' }, { key: 'completed_at', label: 'When', render: (r) => fmt(r.completed_at) },
  ],
  surfing: [
    { key: 'username', label: 'Player' }, { key: 'spot', label: 'Spot' }, { key: 'challenge', label: 'Challenge' }, { key: 'board_key', label: 'Board' },
    { key: 'score', label: 'Score' }, { key: 'duration', label: 'Secs' }, { key: 'carves', label: 'Carves' },
    { key: 'passed', label: 'Passed', render: (r) => (r.passed ? '✔' : '') }, { key: 'completed_at', label: 'When', render: (r) => fmt(r.completed_at) },
  ],
};

function Records() {
  const [type, setType] = useState('missions');
  const { data, error } = useLoad(() => api.get(`/admin/records/${type}?limit=100`), [type]);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[['missions', 'Mission completions'], ['cleanliness', 'Cleanliness records'], ['marine', 'Marine conservation'], ['surfing', 'Surfing records']].map(([k, l]) => (
          <button key={k} onClick={() => setType(k)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${type === k ? 'bg-navy text-white' : 'bg-white'}`}>{l}</button>
        ))}
      </div>
      {error && <p className="text-red-600">{error}</p>}
      <AdminTable rows={data?.records || []} columns={RECORD_COLUMNS[type]} />
    </div>
  );
}

export default function AdminPage() {
  const { profile, loading, isAdmin, logout } = useAuth();
  const [tab, setTab] = useState('overview');
  if (loading) return null;
  if (!profile) return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  if (!isAdmin) {
    return (
      <div className="grid min-h-full place-items-center p-6 text-center">
        <div className="panel-light max-w-sm p-6">
          <div className="text-4xl">🛡️</div>
          <p className="mt-2 font-bold">This area is for administrators only.</p>
          <Link to="/" className="btn-primary mt-4">Back to menu</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-full bg-[#eef6f9] text-navy">
      <header className="flex flex-wrap items-center gap-3 bg-navy px-4 py-3 text-white">
        <h1 className="font-display text-2xl font-extrabold">🛡️ Siargao Pixel Life · Admin</h1>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <span>{profile.username}</span>
          <Link to="/" className="btn-ghost btn-sm">Menu</Link>
          <button onClick={logout} className="btn-ghost btn-sm">Log out</button>
        </div>
      </header>
      <nav className="scrollbar-thin flex gap-1 overflow-x-auto bg-white px-3 py-2 shadow">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold ${tab === k ? 'bg-ocean text-white' : 'hover:bg-navy/5'}`}>{l}</button>
        ))}
      </nav>
      <main className="mx-auto max-w-7xl p-4">
        {tab === 'overview' && <Overview />}
        {tab === 'players' && <Players />}
        {tab === 'spots' && <Spots />}
        {tab === 'missions' && <Missions />}
        {tab === 'activities' && <Activities />}
        {tab === 'records' && <Records />}
        {tab === 'community' && <div className="rounded-2xl bg-white p-4 shadow"><CommunityDashboard /></div>}
      </main>
    </div>
  );
}
