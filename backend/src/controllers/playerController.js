import { z } from 'zod';
import { pool } from '../config/db.js';
import { HttpError } from '../utils/http.js';
import { getProfile } from '../models/profileModel.js';
import { listUserProgress } from '../models/missionModel.js';
import { hasReward, listRewards } from '../models/rewardModel.js';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const updateProfileSchema = z.object({
  role: z.enum(['local_resident', 'tourist']).optional(),
  appearance: z
    .object({
      shirt: z.string().max(60).nullable().optional(), // cosmetic item key or default hex
      hat: z.string().max(60).nullable().optional(),
      board: z.string().max(60).optional(),
      skin: hex.optional(),
      hair: hex.optional(),
    })
    .optional(),
});

export async function profile(req, res) {
  res.json({ profile: await getProfile(req.user.id) });
}

/** Update role and equipped items. Items must be owned. */
export async function updateProfile(req, res) {
  const userId = req.user.id;
  const { role, appearance } = req.body;
  if (role) await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
  if (appearance) {
    const current = (await getProfile(userId)).appearance || {};
    const next = { ...current };
    if (appearance.board !== undefined) {
      if (!(await hasReward(pool, userId, 'surfboard', appearance.board))) throw new HttpError(403, 'You do not own that surfboard');
      next.board = appearance.board;
    }
    for (const slot of ['shirt', 'hat']) {
      const v = appearance[slot];
      if (v === undefined) continue;
      if (v === null || /^#[0-9a-fA-F]{6}$/.test(v)) {
        if (slot === 'hat' && v !== null) throw new HttpError(400, 'Invalid hat');
        next[slot] = v ?? (slot === 'shirt' ? '#ffffff' : null);
        next[`${slot}Item`] = null;
        continue;
      }
      const [[item]] = await pool.query("SELECT item_key, data FROM shop_items WHERE item_key = ? AND item_type = 'cosmetic'", [v]);
      if (!item || !(await hasReward(pool, userId, 'cosmetic', v))) throw new HttpError(403, 'You do not own that item');
      const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
      if (data.slot !== slot) throw new HttpError(400, 'Item does not fit that slot');
      next[slot] = slot === 'shirt' ? data.color : { style: data.style, color: data.color };
      next[`${slot}Item`] = v;
    }
    if (appearance.skin) next.skin = appearance.skin;
    if (appearance.hair) next.hair = appearance.hair;
    await pool.query('UPDATE player_profiles SET appearance = ? WHERE user_id = ?', [JSON.stringify(next), userId]);
  }
  res.json({ profile: await getProfile(userId) });
}

export async function myMissions(req, res) {
  res.json({ missions: await listUserProgress(req.user.id) });
}

export async function inventory(req, res) {
  const rewards = await listRewards(req.user.id);
  const [items] = await pool.query('SELECT item_key AS `key`, name, item_type AS type, data, description FROM shop_items');
  const catalog = Object.fromEntries(items.map((i) => [i.key, { ...i, data: typeof i.data === 'string' ? JSON.parse(i.data) : i.data }]));
  res.json({ rewards: rewards.map((r) => ({ ...r, item: catalog[r.key] || null })) });
}
