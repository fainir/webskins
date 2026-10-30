// Real public HTML and consent controls; all third-party requests are intercepted.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/Users/nirfeinstein/Documents/shelf/node_modules/playwright');
const publicDir = path.resolve(process.argv[2] || 'backend/public');
const target = process.argv[3] || '/';
const eventName = process.argv[4] || 'store_opened';
const config = { gaId: 'G-SYNTHETIC01', mixpanelToken: 'a'.repeat(32), betterloopKey: 'bl_synthetic_public_write' };
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/analytics-config.json') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(config)); }
  if (pathname === '/v1/marketplace/preview') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ jobs: [], test_mode: true })); }
  const file = path.join(publicDir, pathname === '/' ? 'index.html' : pathname);
  try {
    const text = await fs.readFile(file);
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html'); res.end(text);
  } catch { res.statusCode = 404; res.end('Not found'); }
});
if (!process.env.ANALYTICS_ORIGIN) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = process.env.ANALYTICS_ORIGIN || 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({ headless: true });
browser.on('disconnected', () => {});
let checks = 0;
const deadline = setTimeout(() => { void browser.close().finally(() => { if (server.listening) server.close(); process.exitCode = 1; }); }, 90000);
async function contextFor(options = {}) {
  const context = await browser.newContext(options);
  const requests = [], posts = [], errors = [];
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin === origin || url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
    requests.push(request.url());
    if (url.hostname === 'www.googletagmanager.com') return route.fulfill({ contentType: 'text/javascript', body: 'window.__ga=[];window.gtag=(...args)=>window.__ga.push(args);' });
    if (url.hostname === 'betterloopai.com' && url.pathname === '/sdk.js') return route.fulfill({ contentType: 'text/javascript', body: 'window.__bl=[];window.Betterloop={init:o=>window.__bl.push(["init",o]),track:e=>window.__bl.push(["track",e]),shutdown:o=>window.__bl.push(["stop",o])};' });
    if (url.hostname === 'api.mixpanel.com') { posts.push(new URLSearchParams(request.postData()).get('data')); return route.fulfill({ contentType: 'text/plain', body: '1' }); }
    return route.abort();
  });
  const page = await context.newPage(); page.setDefaultTimeout(15000); page.setDefaultNavigationTimeout(20000); page.on('pageerror', error => errors.push(error.message));
  return { context, page, requests, posts, errors };
}
try {
  for (const width of [375, 1440]) {
    const test = await contextFor({ viewport: { width, height: 900 } }); const { page } = test;
    await page.goto(origin + target + '?private=never-send#private-token');
    await page.getByRole('button', { name: 'Analytics choices' }).click();
    await page.locator('#portfolio-analytics-heading').waitFor();
    assert.equal(test.requests.length, 0, 'No vendors before opt-in'); checks++;
    await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
    await page.waitForFunction(() => window.__ga?.length && window.__bl?.some(x => x[0] === 'init'));
    assert.equal(test.requests.filter(x => x.includes('gtag/js')).length, 1);
    assert.equal(test.requests.filter(x => new URL(x).pathname === '/sdk.js').length, 1);
    assert.ok(test.posts.length); checks++;
    const values = JSON.stringify(await page.evaluate(() => ({ ga: window.__ga, bl: window.__bl }))) + test.posts.join('');
    assert.equal(/never-send|private-token/.test(values), false, 'Query/hash never enter analytics'); checks++;
    await page.evaluate(name => window.PortfolioAnalytics.track(name), eventName);
    await page.waitForFunction(name => window.__bl?.some(value => value[0] === 'track' && value[1] === name), eventName);
    assert.ok(test.posts.some(value => JSON.parse(value).event === eventName), 'Fixed event reaches actual transport'); checks++;
    const beforeUnknown = test.posts.length;
    await page.evaluate(() => window.PortfolioAnalytics.track('unapproved_private_event'));
    assert.equal(test.posts.length, beforeUnknown, 'Unknown event cannot enter transport'); checks++;
    await page.evaluate(() => { localStorage.setItem('auth-session', 'keep'); sessionStorage.setItem('_fp_sid', 'synthetic'); document.cookie = '_ga=analytics; Path=/'; document.cookie = '_fp_sid=analytics; Path=/'; });
    await page.getByRole('button', { name: 'Keep analytics off' }).click();
    const after = test.requests.length;
    await page.evaluate(name => window.PortfolioAnalytics.track(name), eventName);
    assert.equal(test.requests.length, after);
    assert.equal(await page.evaluate(() => localStorage.getItem('auth-session')), 'keep');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('_fp_sid')), null);
    assert.equal(await page.evaluate(() => /(?:^|;\s*)(_ga|_fp_sid)=/.test(document.cookie)), false);
    assert.ok((await page.evaluate(() => window.__bl)).some(x => x[0] === 'stop' && x[1].discard === true)); checks++;
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await fs.mkdir('qa/analytics', { recursive: true }); await page.screenshot({ path: `qa/analytics/public-${width}.png` });
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'portfolio-analytics-open'); checks++;
    await page.reload(); await page.getByRole('button', { name: 'Analytics choices' }).waitFor();
    assert.equal(test.requests.length, after, 'Withdrawal survives reload'); checks++;
    assert.deepEqual(test.errors, []); await test.context.close();
  }
  for (const setting of ['doNotTrack', 'globalPrivacyControl']) {
    const test = await contextFor();
    await test.context.addInitScript(value => Object.defineProperty(navigator, value, { configurable: true, get: () => value === 'doNotTrack' ? '1' : true }), setting);
    await test.page.goto(origin + target); await test.page.getByRole('button', { name: 'Analytics choices' }).click();
    assert.equal(await test.page.getByRole('button', { name: 'Allow analytics', exact: true }).isDisabled(), true);
    assert.equal(test.requests.length, 0); checks++; await test.context.close();
  }
  const blocked = await contextFor();
  await blocked.context.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('storage blocked'); }; });
  await blocked.page.goto(origin + target); await blocked.page.getByRole('button', { name: 'Analytics choices' }).click();
  await blocked.page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  await blocked.page.getByRole('status').filter({ hasText: 'could not be saved' }).waitFor();
  assert.equal(blocked.requests.length, 0); checks++; await blocked.context.close();
  // Opt-in before local configuration arrives must still initialize after it resolves.
  const early = await contextFor(); let configRoute; let configReady;
  const configPending = new Promise(resolve => { configReady = resolve; });
  await early.context.route('**/analytics-config.json', route => { configRoute = route; configReady(); });
  await early.page.goto(origin + target); await configPending;
  await early.page.getByRole('button', { name: 'Analytics choices' }).click();
  await early.page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  assert.equal(early.requests.length, 0);
  await configRoute.fulfill({ contentType: 'application/json', body: JSON.stringify(config) });
  await early.page.waitForFunction(() => window.__bl?.some(x => x[0] === 'init'));
  assert.equal(early.requests.filter(x => new URL(x).pathname === '/sdk.js').length, 1); checks++; await early.context.close();
  // A failed withdrawal must stay off even when old allowed storage and late configuration remain.
  const failed = await contextFor(); let failedRoute, failedReady;
  const failedPending = new Promise(resolve => { failedReady = resolve; });
  await failed.context.addInitScript(key => {
    localStorage.setItem(key, 'allowed');
    Storage.prototype.setItem = () => { throw new Error('storage blocked'); };
  }, 'webskins.website.analytics.v1');
  await failed.context.route('**/analytics-config.json', route => { failedRoute = route; failedReady(); });
  await failed.page.goto(origin + target); await failedPending;
  await failed.page.getByRole('button', { name: 'Analytics choices' }).click();
  await failed.page.getByRole('button', { name: 'Keep analytics off', exact: true }).click();
  await failed.page.getByRole('status').filter({ hasText: 'could not be saved' }).waitFor();
  await failedRoute.fulfill({ contentType: 'application/json', body: JSON.stringify(config) });
  await failed.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(failed.requests.length, 0, 'Failed withdrawal remains off after late configuration'); checks++; await failed.context.close();
  // A vendor file that arrives after withdrawal must not initialize itself.
  const late = await contextFor(); let sdkRoute; let sdkReady;
  const sdkPending = new Promise(resolve => { sdkReady = resolve; });
  await late.context.route('https://betterloopai.com/sdk.js?v=20261030', route => { sdkRoute = route; sdkReady(); });
  await late.page.goto(origin + target); await late.page.getByRole('button', { name: 'Analytics choices' }).click();
  await late.page.getByRole('button', { name: 'Allow analytics', exact: true }).click(); await sdkPending;
  await late.page.getByRole('button', { name: 'Keep analytics off' }).click();
  await sdkRoute.fulfill({ contentType: 'text/javascript', body: 'window.__bl=[];window.Betterloop={init:o=>window.__bl.push(["init",o]),shutdown:()=>{},track:()=>{}};' }).catch(() => {});
  await late.page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await late.page.evaluate(() => (window.__bl || []).filter(x => x[0] === 'init').length), 0); checks++; await late.context.close();
  const missing = await contextFor();
  await missing.context.route('**/analytics-config.json', route => route.fulfill({ contentType: 'application/json', body: '{}' }));
  await missing.page.goto(origin + target); await missing.page.getByRole('button', { name: 'Analytics choices' }).click();
  await missing.page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
  assert.equal(missing.requests.length, 0); await missing.page.getByRole('status').filter({ hasText: 'off for this browser' }).waitFor(); checks++; await missing.context.close();
  const privatePage = await contextFor(); await privatePage.context.addInitScript(key => localStorage.setItem(key, 'allowed'), 'webskins.website.analytics.v1'); await privatePage.page.goto(origin + '/privacy');
  assert.equal(await privatePage.page.getByRole('button', { name: 'Analytics choices' }).isVisible(), false);
  assert.equal(privatePage.requests.length, 0); checks++; await privatePage.context.close();
  console.log(`${checks} public analytics consent/privacy/browser checks passed; vendors intercepted, no real provider events.`);
} finally { clearTimeout(deadline); await browser.close(); if (server.listening) await new Promise(resolve => server.close(resolve)); }
