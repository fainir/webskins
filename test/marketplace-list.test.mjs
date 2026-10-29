import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchSkinsByDomain, fetchTrendingSkins} from '../src/utils/marketplace.js';

test('community list distinguishes an empty successful list from unavailable or invalid data', async () => {
  const original = globalThis.fetch;
  try {
    let url;
    globalThis.fetch = async (input, options) => {url = new URL(input);assert.ok(options.signal);return Response.json({skins: [], pagination: {}});};
    assert.deepEqual(await fetchSkinsByDomain('owned.example', 2, 'newest'), {skins: [], pagination: {}});
    assert.equal(url.searchParams.get('domain'), 'owned.example');
    assert.equal(url.searchParams.get('page'), '2');
    globalThis.fetch = async () => new Response('', {status: 503});
    await assert.rejects(fetchTrendingSkins(), /unavailable/);
    globalThis.fetch = async () => Response.json({error: 'not a list'});
    await assert.rejects(fetchSkinsByDomain('owned.example'), /unreadable/);
    globalThis.fetch = async () => {throw new TypeError('offline');};
    await assert.rejects(fetchTrendingSkins(), /offline/);
  } finally {globalThis.fetch = original;}
});
