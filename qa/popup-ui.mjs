// Owned localhost only. No extension installation, real key, provider call or publication.
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from '/Users/nirfeinstein/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const root = resolve('candidate-dist');
const server = createServer(async (req, res) => {
  const file = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + '/')) {res.writeHead(404).end();return;}
  try {const bytes = await readFile(file);res.setHeader('Content-Type', {'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png'}[extname(file)] || 'application/octet-stream');res.end(bytes);}
  catch {res.writeHead(404).end();}
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-networking']});
const errors = [], unexpected = [], results = [], contrasts = [];
await mkdir('qa/popup', {recursive:true});

async function open({faults = [], empty = false, community = 'list'} = {}) {
  const context = await browser.newContext({viewport:{width:400,height:600},deviceScaleFactor:1});
  await context.addInitScript(({faults, empty}) => {
    const skin = {id:'local-1',name:'Amber "focus"',css:'body {color: #123456}',createdAt:Date.now(),chatHistory:[{role:'user',content:'Warm navy'},{role:'assistant',content:'Your saved design.'}]};
    const values = {webskins_skins:empty ? {} : {'owned.example':[skin]},webskins_active:{},webskins_model:'claude-sonnet-5-5',webskins_voted:[]};
    const qa = window.__qa = {values, faults, messages:[],failSet:'',failRemove:false,messageError:'',holdGenerate:false,generated:null};
    const area = (data, session = false) => ({
      get: async keys => {const names = Array.isArray(keys) ? keys : [keys];if (names.some(key => qa.faults.includes(key))) throw Error('Synthetic storage unavailable');return Object.fromEntries(names.map(key => [key, structuredClone(data[key])]));},
      set: async patch => {if (Object.hasOwn(patch, qa.failSet)) throw Error('Synthetic storage write failure');Object.assign(data,structuredClone(patch));},
      remove: async keys => {if (qa.failRemove && !session) throw Error('Synthetic remove failure');for (const key of Array.isArray(keys) ? keys : [keys]) delete data[key];},
      setAccessLevel: async () => {},
    });
    window.chrome = {tabs:{query:async()=>[{id:44,url:'https://owned.example/'}]},storage:{local:area(values),session:area({},true)},runtime:{onMessage:{addListener:()=>{}},sendMessage:async message => {
      qa.messages.push(message.action);
      if (qa.messageError) return {error:qa.messageError};
      if (message.action === 'get-ai-consent') return {granted:true,origin:'https://owned.example'};
      if (message.action === 'generate-skin') return new Promise(resolve => {qa.generated = () => resolve({skin});});
      if (message.action === 'chat-refine') return {skinData:{name:skin.name,description:'Synthetic refinement',css:skin.css}};
      if (message.action === 'apply-skin') values.webskins_active = {'owned.example':message.skinId};
      if (message.action === 'remove-skin') values.webskins_active = {};
      return {ok:true};
    }}};
  }, {faults,empty});
  const page = await context.newPage();
  page.__community = community;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const url = route.request().url();
    if (url.startsWith(origin)) return route.continue();
    if (url.startsWith('https://webskins-api-production.up.railway.app/api/skins')) {
      if (page.__community === 'offline') return route.fulfill({status:503,body:'unavailable'});
      if (page.__community === 'slow') await new Promise(resolve => setTimeout(resolve,350));
      if (url.endsWith('/like')) return route.fulfill({status:503,body:'unavailable'});
      assert.equal(route.request().method(), 'GET', 'No real or synthetic publication/installation is needed');
      const skins = page.__community === 'empty' ? [] : [{id:'community-1',name:'Forest calm',authorName:'QA',likes:4,installs:9}];
      return route.fulfill({json:{skins,pagination:{}}});
    }
    unexpected.push(url);return route.abort();
  });
  await page.goto(origin + '/popup.html');
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).height),'600px','Compiled CSS must be fully built before UI QA');
  await page.waitForFunction(() => document.getElementById('btn-retry-storage').textContent === 'Retry local storage');
  return {context,page};
}
async function visible(page, selector) {assert.ok(await page.locator(selector).isVisible(), `${selector} visible`);}
async function text(page, selector, pattern) {
  await page.waitForFunction(({selector, pattern}) => new RegExp(pattern).test(document.querySelector(selector)?.innerText), {selector,pattern:pattern.source});
  assert.match(await page.locator(selector).innerText(), pattern);
}
async function screenshot(page, name) {
  const contrast = await page.evaluate(() => {
    const color = value => (value.match(/[\d.]+/g) || []).map(Number);
    const over = (a,b) => {const alpha = a[3] ?? 1;return a.slice(0,3).map((v,i) => v*alpha + b[i]*(1-alpha));};
    const luminance = rgb => rgb.slice(0,3).map(v => {v /= 255;return v <= .04045 ? v / 12.92 : ((v+.055)/1.055)**2.4;}).reduce((sum,v,i) => sum + v*[.2126,.7152,.0722][i],0);
    const ratios = [], failures = [];
    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el), rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > 600 || style.visibility === 'hidden' || el.closest('[disabled]') || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      if (el.tagName === 'SCRIPT' || el.closest('svg')) continue;
      const ancestors = [];for(let p=el;p;p=p.parentElement) ancestors.unshift(p);
      let bg = [255,255,255];for (const p of ancestors) bg = over(color(getComputedStyle(p).backgroundColor),bg);
      const fg = over(color(style.color),bg), a = luminance(fg), b = luminance(bg), ratio = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      const large = parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && parseInt(style.fontWeight)>=700);
      ratios.push(ratio);if (ratio < (large ? 3 : 4.5)) failures.push({text:el.textContent.trim().slice(0,45),ratio:+ratio.toFixed(2)});
    }
    return {minimum:+Math.min(...ratios).toFixed(2),failures};
  });
  contrasts.push({screen:name,...contrast});
  assert.deepEqual(contrast.failures,[],`Visible text contrast in ${name}`);
  await page.screenshot({path:`qa/popup/${name}.jpg`,type:'jpeg',quality:82});
}

try {
  // Real DOM at the actual extension popup size; keyboard opens and operates history.
  {
    const {context,page} = await open();
    await page.waitForSelector('.community-install');
    await page.locator('.skin-open-btn').focus();
    assert.match(await page.locator('.skin-open-btn').getAttribute('aria-label'), /Amber "focus"/);
    await page.keyboard.press('Enter');await visible(page,'#chat-view');
    assert.equal(await page.locator('#chat-input').evaluate(el => el === document.activeElement),true);
    await screenshot(page,'chat');
    await page.locator('#btn-chat-back').click();
    await page.evaluate(() => {window.__qa.messageError='Could not apply to this page';});
    await page.locator('.skin-apply-btn').click();await text(page,'#status-text',/Could not apply/);
    assert.equal(await page.locator('#active-skin-banner').isVisible(),false);
    await page.clock.install();await page.clock.fastForward(5000);await visible(page,'#status-bar');
    await page.evaluate(() => {window.__qa.messageError='';});
    await page.locator('.skin-apply-btn').focus();await page.keyboard.press('Space');
    await page.waitForSelector('.skin-remove-btn');await text(page,'#status-text',/Applied/);
    await page.locator('.skin-remove-btn').focus();await page.keyboard.press('Enter');
    await page.waitForSelector('.skin-apply-btn');
    await page.getByRole('button',{name:'Dismiss notification'}).click();
    await page.locator('#home-view').evaluate(el => {el.scrollTop = 0;});
    await screenshot(page,'home');
    const unnamed = await page.locator('button:visible').evaluateAll(els => els.filter(el => !(el.getAttribute('aria-label') || el.textContent).trim()).length);
    assert.equal(unnamed,0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth),400);
    await context.close();results.push('keyboard history edit/apply/remove, chat focus, names, no horizontal overflow');
  }
  {
    const {context,page} = await open({faults:['webskins_model','webskins_skins','webskins_voted','webskins_api_key'],community:'offline'});
    await visible(page,'#storage-error');await page.waitForSelector('#btn-retry-community');
    await page.getByRole('button',{name:'Settings',exact:true}).click();await visible(page,'#settings-view');
    await page.locator('#btn-settings-back').click();
    await screenshot(page,'recovery');
    await page.locator('#btn-retry-community').scrollIntoViewIfNeeded();await screenshot(page,'community-retry');
    await page.evaluate(() => {window.__qa.faults=[];});
    await page.getByRole('button',{name:'Retry local storage'}).click();
    await page.waitForSelector('.skin-open-btn');assert.equal(await page.locator('#storage-error').isVisible(),false);
    page.__community='empty';await page.getByRole('button',{name:'Retry community'}).click();
    await page.waitForFunction(() => document.getElementById('community-list').textContent.includes('No community skins yet'));
    assert.equal(await page.locator('#btn-retry-community').count(),0);
    await page.getByRole('button',{name:'New',exact:true}).click();
    assert.equal(await page.locator('#sort-new').getAttribute('aria-pressed'),'true');
    await context.close();results.push('storage failures do not prevent setup; local/community retry recovers; real empty state separate');
  }
  {
    const {context,page} = await open();
    await page.getByRole('button',{name:'Settings',exact:true}).click();
    await page.evaluate(() => {window.__qa.failSet='webskins_model';});
    await page.locator('#settings-model').selectOption('claude-opus-5-5');
    await text(page,'#status-text',/Previous choice retained/);assert.equal(await page.locator('#settings-model').inputValue(),'claude-sonnet-5-5');
    await page.evaluate(() => {window.__qa.failSet='';});
    await page.locator('#settings-model').selectOption('claude-opus-5-5');await text(page,'#status-text',/Model saved/);
    await page.getByRole('button',{name:'Clear All Skins',exact:true}).click();await visible(page,'#clear-dialog');
    assert.equal(await page.locator('#btn-clear-cancel').evaluate(el => el === document.activeElement),true);
    await page.keyboard.press('Tab');assert.equal(await page.locator('#btn-clear-confirm').evaluate(el => el === document.activeElement),true);
    await page.keyboard.press('Tab');assert.equal(await page.locator('#btn-clear-cancel').evaluate(el => el === document.activeElement),true);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#clear-dialog').isVisible(),false);
    assert.equal(await page.locator('#btn-clear-history').evaluate(el => el === document.activeElement),true);
    await page.getByRole('button',{name:'Clear All Skins',exact:true}).click();
    await page.evaluate(() => {window.__qa.failRemove=true;});
    await page.locator('#btn-clear-confirm').click();await text(page,'#clear-error',/Could not finish/);
    assert.equal(await page.evaluate(() => __qa.values.webskins_skins['owned.example'].length),1);
    await screenshot(page,'clear-retry');
    await page.evaluate(() => {window.__qa.failRemove=false;});
    await page.locator('#btn-clear-confirm').click();await page.waitForFunction(() => !document.getElementById('clear-dialog').open);
    assert.equal(await page.evaluate(() => __qa.values.webskins_skins),undefined);
    await page.getByRole('button',{name:'Dismiss notification'}).click();await screenshot(page,'settings');
    await context.close();results.push('model write failure retains choice; clear Escape/focus trap/failure/retry preserves data and recovers');
  }
  {
    const {context,page} = await open({empty:true,community:'slow'});
    await text(page,'#history-list',/No saved skins/);
    await page.waitForSelector('.community-like');await page.locator('.community-like').click();await text(page,'#status-text',/Could not record/);
    await page.locator('#api-key-input').fill('synthetic-session-key');await page.locator('#btn-save-key').click();
    await page.locator('#prompt-input').fill('Synthetic design');await page.locator('#btn-generate').click();
    await visible(page,'#chat-view');assert.equal(await page.locator('#btn-chat-send').isDisabled(),true);
    await text(page,'#chat-messages',/Designing your skin/);
    await page.evaluate(() => {window.__qa.generated();});
    await page.waitForFunction(() => !document.getElementById('btn-chat-send').disabled);
    await page.evaluate(() => {window.__qa.messageError='Synthetic page connection failed';});
    await page.locator('#btn-save-skin').click();await text(page,'#status-text',/Synthetic page connection failed/);
    assert.doesNotMatch(await page.locator('#status-text').innerText(),/saved/i);
    await context.close();results.push('empty, loading, disabled generation actions, visible like/background-save errors');
  }
  assert.deepEqual(errors,[],'No uncaught page errors');assert.deepEqual(unexpected,[],'No remote fonts, providers or other requests');
  console.log(JSON.stringify({viewport:'400x600',version:'1.0.6 candidate',passed:results,contrasts,uncaughtErrors:errors.length,unexpectedRequests:unexpected.length}));
} finally {await browser.close();await new Promise(resolve => server.close(resolve));}
