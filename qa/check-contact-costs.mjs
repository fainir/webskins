// Website-only QA. No extension build, provider event or actual message.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from '/Users/nirfeinstein/Documents/shelf/node_modules/playwright/index.mjs';
const origin=process.argv[2];
assert.ok(['127.0.0.1','webskins-api-production.up.railway.app'].includes(new URL(origin).hostname));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),lines=[];
try {
 for(const width of [375,1440]) {
  const context=await browser.newContext({viewport:{width,height:950}}),page=await context.newPage(),errors=[],unexpected=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>{
   const request=r.request(),url=new URL(request.url());
   if(url.origin!==origin||!['GET','HEAD'].includes(request.method())){unexpected.push(url.hostname+url.pathname);return r.abort();}
   return r.continue();
  });
  for(const route of ['/','/contact','/privacy','/terms']) {
   const response=await page.goto(origin+route,{waitUntil:'domcontentloaded'});
   assert.equal(response.status(),200);await page.getByRole('heading',{level:1}).waitFor();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,route+' fits');
   for(const href of ['/contact','/privacy','/terms'])assert.ok(await page.locator('footer a[href="'+href+'"]').count());
   if(route!=='/privacy')assert.match(await page.locator('[data-cost-mode]').innerText(),/free|your own/i);
   if(route==='/contact')assert.match(await page.locator('main').innerText(),/Resend.*Gmail/s);
   if(route==='/terms'){const terms=await page.locator('main').innerText();assert.match(terms,/billed by Anthropic/);assert.match(terms,/no subscription or checkout/);assert.match(terms,/limited free included-Claude option/);assert.match(terms,/not been published/);}
   if(route==='/privacy')assert.match(await page.locator('main, article').first().innerText(),/contact/i);
   if(route==='/'||route==='/terms')await page.screenshot({path:'qa/contact-cost-'+(route==='/'?'home':'terms')+'-'+width+'.jpg'});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  lines.push(width+'px: actual home/contact/privacy/terms, Free/BYOK/provider-billing labels, linked policies/contact and responsive layout pass; no page errors, app writes, vendor event, message or extension action.');
  await context.close();
 }
 await fs.writeFile('qa/contact-cost-ui.log',lines.join('\n')+'\n');console.log(lines.join('\n'));
} finally {await browser.close();}
