import { z } from 'zod';
import { pool, withTransaction } from '../config/db.js';
import { HttpError, parseJson } from '../utils/http.js';
import { getProfile } from '../models/profileModel.js';
import { hasReward } from '../models/rewardModel.js';
import { applyEvent } from '../services/missionService.js';

const serialize = (i) => ({
  key: i.item_key, name: i.name, type: i.item_type, price: i.price, spotKey: i.spot_key || null,
  description: i.description, data: parseJson(i.data, {}),
});

export async function items(req, res) {
  const [rows] = await pool.query(
    'SELECT i.*, s.spot_key FROM shop_items i LEFT JOIN tourist_spots s ON s.id = i.tourist_spot_id ORDER BY i.item_type, i.price'
  );
  let list = rows.map(serialize);
  if (req.query.spot) list = list.filter((i) => !i.spotKey || i.spotKey === req.query.spot);
  if (req.user) {
    const [owned] = await pool.query('SELECT reward_key FROM rewards WHERE user_id = ?', [req.user.id]);
    const set = new Set(owned.map((o) => o.reward_key));
    list = list.map((i) => ({ ...i, owned: i.type !== 'local_product' && set.has(i.key) }));
  }
  res.json({ items: list });
}

export const buySchema = z.object({ itemKey: z.string().min(1).max(60) });

/** Purchase with server-side price and ownership checks. */
export async function buy(req, res) {
  const userId = req.user.id;
  const result = await withTransaction(async (conn) => {
    const [[item]] = await conn.query(
      'SELECT i.*, s.spot_key FROM shop_items i LEFT JOIN tourist_spots s ON s.id = i.tourist_spot_id WHERE i.item_key = ?',
      [req.body.itemKey]
    );
    if (!item) throw new HttpError(404, 'Item not found');
    const [[prof]] = await conn.query('SELECT coins, current_spot_id FROM player_profiles WHERE user_id = ? FOR UPDATE', [userId]);
    if (item.item_type === 'local_product' && prof.current_spot_id !== item.tourist_spot_id) {
      throw new HttpError(422, 'Local products can only be bought at their destination');
    }
    if (item.item_type !== 'local_product' && (await hasReward(conn, userId, item.item_type, item.item_key))) {
      throw new HttpError(409, 'You already own this item');
    }
    if (prof.coins < item.price) throw new HttpError(422, 'Not enough coins');
    await conn.query('UPDATE player_profiles SET coins = coins - ? WHERE user_id = ?', [item.price, userId]);
    await conn.query('INSERT INTO rewards (user_id, reward_key, reward_name, reward_type) VALUES (?, ?, ?, ?)', [
      userId, item.item_key, item.name, item.item_type,
    ]);
    let missionUpdates = [];
    const data = parseJson(item.data, {});
    if (item.item_type === 'local_product' && data.activity) {
      const [[act]] = await conn.query('SELECT id FROM activities WHERE activity_key = ?', [data.activity]);
      if (act) await conn.query('INSERT INTO activity_records (user_id, activity_id, result) VALUES (?, ?, ?)', [userId, act.id, JSON.stringify({ item: item.item_key })]);
      await conn.query('UPDATE player_profiles SET eco_points = eco_points + 2 WHERE user_id = ?', [userId]);
      missionUpdates = await applyEvent(conn, userId, { type: 'activity', spotId: item.tourist_spot_id, target: data.activity, uniqueKey: 'buy' });
    }
    return { item: serialize(item), missionUpdates };
  });
  res.json({ ...result, profile: await getProfile(userId) });
}
