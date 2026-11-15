/** Imports database/siargao_pixel_life.sql into the configured MySQL server. */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, '../../database/siargao_pixel_life.sql');
const sql = readFileSync(sqlPath, 'utf8').replaceAll('siargao_pixel_life', env.db.database);

const conn = await mysql.createConnection({ host: env.db.host, port: env.db.port, user: env.db.user, password: env.db.password, multipleStatements: true });
console.log(`Importing ${sqlPath} into ${env.db.database} ...`);
await conn.query(sql);
console.log('Schema and seed data imported.');

const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
if (ADMIN_USERNAME && ADMIN_EMAIL && ADMIN_PASSWORD) {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await conn.query(`USE \`${env.db.database}\``);
  const [r] = await conn.query("INSERT INTO users (username, email, password_hash, role, account_type) VALUES (?, ?, ?, 'local_resident', 'admin')", [ADMIN_USERNAME, ADMIN_EMAIL, hash]);
  await conn.query('INSERT INTO player_profiles (user_id, appearance) VALUES (?, ?)', [r.insertId, JSON.stringify({ shirt: '#102a43', board: 'board_foamie' })]);
  await conn.query("INSERT INTO rewards (user_id, reward_key, reward_name, reward_type) VALUES (?, 'board_foamie', 'Foamie Board', 'surfboard')", [r.insertId]);
  console.log(`Admin account "${ADMIN_USERNAME}" created.`);
}
await conn.end();
