import { HttpError, toInt } from '../utils/http.js';
import { findMission, listMissions, listUserProgress } from '../models/missionModel.js';
import { abandonMission, completeMission, startMission } from '../services/missionService.js';
import { getProfile } from '../models/profileModel.js';

/** Missions with the caller's status attached (when logged in). */
export async function list(req, res) {
  const missions = await listMissions({ spotKey: req.query.spot ? String(req.query.spot) : undefined });
  if (!req.user) return res.json({ missions });
  const progress = await listUserProgress(req.user.id);
  const byMission = new Map();
  for (const p of progress) if (!byMission.has(p.id) || p.status === 'active') byMission.set(p.id, p);
  res.json({
    missions: missions.map((m) => {
      const p = byMission.get(m.id);
      return {
        ...m,
        status: p ? p.status : 'available',
        progress: p?.status === 'active' ? p.progress : null,
        completedAt: p?.completedAt ?? null,
        recommended: m.recommendedRole === 'both' || m.recommendedRole === req.user.role,
      };
    }),
  });
}

export async function detail(req, res) {
  const id = toInt(req.params.id);
  const mission = Number.isNaN(id) ? null : await findMission(id);
  if (!mission || !mission.isActive) throw new HttpError(404, 'Mission not found');
  res.json({ mission });
}

export async function start(req, res) {
  const result = await startMission(req.user.id, toInt(req.params.id));
  res.status(201).json(result);
}

export async function complete(req, res) {
  const result = await completeMission(req.user.id, toInt(req.params.id));
  res.json({ ...result, profile: await getProfile(req.user.id) });
}

export async function abandon(req, res) {
  await abandonMission(req.user.id, toInt(req.params.id));
  res.json({ ok: true });
}
