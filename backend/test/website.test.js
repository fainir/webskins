import assert from 'node:assert/strict';
import test from 'node:test';
import os from 'node:os';
import path from 'node:path';

test('owned website assets and analytics configuration preserve API and extension separation', async () => {
  process.env.DATABASE_URL = 'file:' + path.join(os.tmpdir(), 'webskins-website-no-database-needed.db');
  process.env.GA_ID = 'G-SYNTHETIC01';
  process.env.MIXPANEL_TOKEN = 'a'.repeat(32);
  process.env.BETTERLOOP_KEY = 'bl_synthetic_public_write';
  const {createApp} = await import('../src/app.js');
  const {prisma} = await import('../src/routes/skins.js');
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(base + '/');
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-security-policy'), /object-src 'none'/);
    assert.match(page.headers.get('content-security-policy'), /connect-src 'self'.*https:\/\/api.mixpanel.com/);
    const html = await page.text();
    assert.match(html, /awaiting publication/);
    assert.match(html, /src="\/analytics.js"/);
    assert.match(html, /adds no tracking to your installed extension/);
    for (const asset of ['/analytics.js', '/analytics.css', '/website.css']) assert.equal((await fetch(base + asset)).status, 200);
    const config = await fetch(base + '/analytics-config.json');
    assert.equal(config.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await config.json(), {gaId: 'G-SYNTHETIC01', mixpanelToken: 'a'.repeat(32), betterloopKey: 'bl_synthetic_public_write'});
    for (const route of ['/contact','/terms']) { const response=await fetch(base+route); assert.equal(response.status,200); const text=await response.text(); assert.doesNotMatch(text,/src="\/analytics.js"/); assert.match(text,/Free extension|extension and local skin features are free/); }
    const privacy = await fetch(base + '/privacy');
    assert.equal(privacy.status, 200);
    assert.doesNotMatch(await privacy.text(), /src="\/analytics.js"/);
    assert.equal((await fetch(base + '/src/app.js')).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
});
