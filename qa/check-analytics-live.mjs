// Real public receipt and consent acceptance. No vendor response is intercepted.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const entry=process.argv[2];
assert.ok(entry,'Pass the installed Playwright module path');
const expectedGa=process.env.WEBSKINS_QA_GA_ID||'',expectedMixpanel=process.env.WEBSKINS_QA_MIXPANEL_TOKEN||'';
assert.match(expectedGa,/^G-[A-Z0-9]+$/,'Matching Google ID required');
assert.match(expectedMixpanel,/^[a-f0-9]{32}$/i,'Matching Mixpanel token required');
const {chromium}=await import(pathToFileURL(entry).href);
const origin='https://webskins-api-production.up.railway.app',key='webskins.website.analytics.v1',writeKey='bl_self_Vr1tabbrzUCXCGxb';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const lines=[];
function kind(url){const u=new URL(url);if(u.hostname==='betterloopai.com'&&['/sdk.js','/api/ingest'].includes(u.pathname))return 'Betterloop';if(/(^|\.)(googletagmanager|google-analytics)\.com$/.test(u.hostname))return 'Google';if(u.hostname==='api.mixpanel.com')return 'Mixpanel';return null;}
function googleParams(r){const p=new URLSearchParams(new URL(r.url()).search);for(const [k,v] of new URLSearchParams(r.postData()||''))p.set(k,v);return p;}
async function fixture(width,preference){
 const context=await browser.newContext({viewport:{width,height:950}}),requests=[],bodies=[],views=[],receipts=[],errors=[],violations=[];
 await context.route(origin+'/**',route=>{const r=route.request();if(!['GET','HEAD','OPTIONS'].includes(r.method())){violations.push('Unexpected own-site write: '+new URL(r.url()).pathname);return route.abort();}return route.continue();});
 await context.addInitScript(({key,preference})=>{
  if(preference){Object.defineProperty(navigator,preference,{get:()=>preference==='doNotTrack'?'1':true});localStorage.setItem(key,'allowed');}
  window.__actualReceipts=[];const original=window.fetch.bind(window);
  window.fetch=async function(input,options){const response=await original(input,options),url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href),provider=url.hostname==='betterloopai.com'&&url.pathname==='/api/ingest'?'Betterloop':url.hostname==='api.mixpanel.com'&&url.pathname==='/track'?'Mixpanel':null;if(provider)void response.clone().text().then(body=>window.__actualReceipts.push({provider,status:response.status,body:body.slice(0,300)})).catch(()=>{});return response;};
 },{key,preference});
 context.on('request',r=>{const type=kind(r.url());if(!type)return;requests.push(type);try{
  assert.equal(/private-analytics-sentinel/.test(r.url()+(r.postData()||'')),false,'Private query/hash cannot enter telemetry');
  if(type==='Betterloop'&&new URL(r.url()).pathname==='/api/ingest'){const b=JSON.parse(r.postData());assert.equal(b.key,writeKey);assert.equal(b.url,origin);assert.equal(b.text,false);for(const e of b.events)assert.equal(e.path,'/');bodies.push(b);}
  if(type==='Mixpanel'){const p=new URLSearchParams(r.postData());assert.equal(p.get('ip'),'0');const event=JSON.parse(p.get('data'));assert.equal(event.properties.token,expectedMixpanel);assert.equal(event.properties.product,'WebSkins website');assert.equal(event.properties.path,'/');assert.equal(event.properties.$current_url,origin+'/');}
  if(type==='Google'&&new URL(r.url()).pathname.endsWith('/collect')){const p=googleParams(r);assert.equal(p.get('tid'),expectedGa);assert.equal(p.get('dl'),origin+'/');assert.equal(p.get('dt'),'WebSkins website');if(p.get('en')==='page_view')views.push(true);}
 }catch(e){violations.push(e.message);}});
 context.on('response',r=>{const u=new URL(r.url());if(u.hostname.endsWith('google-analytics.com')&&u.pathname.endsWith('/collect'))receipts.push(r.status());});
 const page=await context.newPage();page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));
 return {context,page,requests,bodies,views,receipts,errors,violations};
}
async function waitForGoogle(f){const deadline=Date.now()+25000;while(Date.now()<deadline){if(f.receipts.some(s=>s>=200&&s<300))return;await new Promise(r=>setTimeout(r,100));}throw Error('Genuine Google HTTP receipt missing');}
async function openChoices(page){
 await page.waitForFunction(()=>{const b=document.getElementById('portfolio-analytics-open');return b&&getComputedStyle(b).position==='fixed'&&b.getBoundingClientRect().width>0;},null,{timeout:25000});
 await page.getByRole('button',{name:'Analytics choices',exact:true}).click();
}
try{
 for(const width of [375,1440]){
  const f=await fixture(width);
  const config=await f.context.request.get(origin+'/analytics-config.json');assert.equal(config.status(),200);assert.match(config.headers()['cache-control'],/no-store/);assert.deepEqual(await config.json(),{gaId:expectedGa,mixpanelToken:expectedMixpanel,betterloopKey:writeKey});
  await f.page.goto(origin+'/?qa=private-analytics-sentinel#private-analytics-sentinel',{waitUntil:'domcontentloaded'});
  await openChoices(f.page);const dialog=f.page.getByRole('dialog',{name:'Optional website analytics',exact:true});await dialog.waitFor();
  await f.page.waitForTimeout(1000);assert.equal(f.requests.length,0,'Default off');
  assert.equal(await f.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await dialog.screenshot({path:'qa/analytics/live-all-'+width+'.jpg'});
  await dialog.getByRole('button',{name:'Allow analytics',exact:true}).click();
  await f.page.waitForFunction(()=>window.__actualReceipts.some(r=>r.provider==='Betterloop'&&r.status===200&&JSON.parse(r.body).ok===true)&&window.__actualReceipts.some(r=>r.provider==='Mixpanel'&&r.status===200&&r.body.trim()==='1'),null,{timeout:25000});await waitForGoogle(f);
  assert.equal(f.views.length,1,'One manual Google pageview');assert.equal(f.bodies.flatMap(b=>b.events).filter(e=>e.t==='pageview').length,1);
  await dialog.getByRole('button',{name:'Keep analytics off',exact:true}).click();
  assert.equal(await f.page.evaluate(k=>localStorage.getItem(k+':device'),key),null);assert.equal(await f.page.evaluate(()=>sessionStorage.getItem('_fp_sid')),null);assert.equal(await f.page.evaluate(id=>window['ga-disable-'+id],expectedGa),true);assert.equal((await f.context.cookies()).some(c=>/^(_ga(?:_|$)|_fp_sid$)/.test(c.name)),false);
  const count=f.requests.length;await f.page.reload({waitUntil:'domcontentloaded'});await f.page.waitForTimeout(1000);assert.equal(f.requests.length,count,'Withdrawal survives reload');
  await f.page.evaluate(k=>localStorage.setItem(k,'allowed'),key);await f.page.goto(origin+'/privacy',{waitUntil:'domcontentloaded'});await f.page.waitForTimeout(1000);assert.equal(f.requests.length,count,'Policy route excludes saved allow');assert.deepEqual(f.errors,[]);assert.deepEqual(f.violations,[]);
  lines.push(width+'px: actual Google HTTP'+f.receipts[0]+', Mixpanel200/body1 and Betterloop200/ok; exactly one safe manual pageview; default off, withdrawal/identifiers/reload/policy exclusion pass, no overflow/page errors/unrelated writes.');console.log(lines.at(-1));await f.context.close();
 }
 for(const preference of ['doNotTrack','globalPrivacyControl']){const f=await fixture(375,preference);await f.page.goto(origin+'/',{waitUntil:'domcontentloaded'});await openChoices(f.page);assert.equal(await f.page.getByRole('button',{name:'Allow analytics',exact:true}).isDisabled(),true);assert.equal(f.requests.length,0);assert.deepEqual(f.errors,[]);assert.deepEqual(f.violations,[]);lines.push(preference+': saved allow still produces no provider requests.');await f.context.close();}
 lines.push('Real provider transport acknowledgement only; dashboard processing is separate. No model, enquiry, email, owner-data or payment action was made.');await fs.writeFile('qa/analytics-live-all.log',lines.join('\n')+'\n');console.log(lines.slice(-3).join('\n'));
}finally{await browser.close();}
