// Actual public website routes with a disconnected, unused disposable database path.
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

Object.assign(process.env, {DATABASE_URL: 'file:' + path.join(os.tmpdir(), 'webskins-analytics-unused.db'), GA_ID: 'G-SYNTHETIC01', MIXPANEL_TOKEN: 'a'.repeat(32), BETTERLOOP_KEY: 'bl_synthetic_public_write'});
const {createApp} = await import('../backend/src/app.js');
const {prisma} = await import('../backend/src/routes/skins.js');
const server = createApp().listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
try {
  const child = spawn(process.execPath, ['qa/check-website-analytics.mjs', 'backend/public', '/', 'store_opened'], {env: {HOME: process.env.HOME, PATH: process.env.PATH, NODE_ENV: 'test', ANALYTICS_ORIGIN: origin}, stdio: 'inherit'});
  assert.equal(await new Promise(resolve => child.once('exit', resolve)), 0);
} finally {
  await new Promise(resolve => server.close(resolve)); await prisma.$disconnect();
}
