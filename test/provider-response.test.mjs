import test from 'node:test';
import assert from 'node:assert/strict';
import {generateSkin} from '../src/utils/claude-api.js';

test('balanced and advanced design requests use current supported settings and return completed JSON', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return new Response(JSON.stringify({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify({css:'body {color:#222 !important}',name:'Synthetic skin'})}]}));
  };
  try {
    for (const model of ['claude-sonnet-5-5','claude-opus-5-5']) {
      const result = await generateSkin('synthetic-test-key', model, '<main>Test</main>', 'Readable neutral theme');
      assert.ok(result.css.includes('color'));
    }
    assert.equal(requests[0].output_config.effort, 'medium');
    assert.equal(requests[1].output_config.effort, 'high');
    assert.ok(requests.every(r => !('temperature' in r) && r.thinking.type === 'adaptive'));
  } finally {globalThis.fetch = originalFetch;}
});

test('a token-limited or refused response cannot become an applied skin even if it contains parseable JSON', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const stop_reason of ['max_tokens','refusal',null]) {
      globalThis.fetch = async () => new Response(JSON.stringify({stop_reason,content:[{type:'text',text:'{"css":"body {color:red}","name":"Partial"}'}]}));
      await assert.rejects(generateSkin('synthetic-test-key','claude-sonnet-5-5','<main>Test</main>','Theme'), /incomplete/);
    }
  } finally {globalThis.fetch = originalFetch;}
});
