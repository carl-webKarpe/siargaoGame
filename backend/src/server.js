import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const app = createApp();

pool
  .query('SELECT 1')
  .then(() => console.log(`[db] connected to ${env.db.database}@${env.db.host}`))
  .catch((err) => console.error('[db] connection failed — check your .env and run `npm run db:init`:', err.message));

app.listen(env.port, () => console.log(`[api] Siargao Pixel Life API listening on http://localhost:${env.port}`));
