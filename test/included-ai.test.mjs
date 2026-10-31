import test from 'node:test';
import assert from 'node:assert/strict';
import {includedSkin} from '../src/utils/claude-api.js';

test('included CSS uses one fixed-profile request without a provider key, screenshots or credentials',async()=>{
 const previousChrome=globalThis.chrome,previousFetch=globalThis.fetch;
 const values={};let calls=[];
 globalThis.chrome={storage:{local:{get:async key=>({[key]:values[key]}),set:async data=>Object.assign(values,data)}}};
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ok:true,stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify({css:'body {color: navy !important}',name:'Navy'})}]})};};
 try {
  assert.equal((await includedSkin('body > main','navy text','',new AbortController().signal)).name,'Navy');
  assert.equal(calls.length,1);
  const {url,options}=calls[0],body=JSON.parse(options.body);
  assert.equal(url,'https://betterloopai.com/api/claude/v1/complete');
  assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');
  assert.deepEqual(body.input,{instruction:'navy text',context:'body > main'});
  assert.equal(body.feature,'css');assert.equal(body.app,'webskins');
  assert.equal(Object.keys(options.headers).length,1);
  assert.ok(!('model' in body)&&!('system' in body)&&!('image' in body));
  const actor=body.actor;
  await includedSkin('main','larger text','body {color: navy}',new AbortController().signal);
  assert.equal(JSON.parse(calls[1].options.body).actor,actor);
  assert.notEqual(JSON.parse(calls[1].options.body).request_id,body.request_id);
  calls=[];
  await assert.rejects(includedSkin('א'.repeat(13000),'blue','',null),/too large/);
  assert.equal(calls.length,0);
 }finally{globalThis.chrome=previousChrome;globalThis.fetch=previousFetch;}
});

test('exhaustion, unknown outcome, truncation and abort never trigger a direct or repeated provider call',async()=>{
 const previousChrome=globalThis.chrome,previousFetch=globalThis.fetch;
 globalThis.chrome={storage:{local:{get:async()=>({webskins_ai_actor:'00000000-0000-4000-8000-000000000000'})}}};
 try {
  for(const data of [{ok:false,error:{code:'quota_exhausted'}},
    {ok:false,error:{code:'outcome_unknown'}},{ok:true,stop_reason:'max_tokens',content:[]}]) {
   let calls=0;
   globalThis.fetch=async()=>{calls++;return {ok:data.ok,status:data.error?.code==='outcome_unknown'?409:429,json:async()=>data};};
   await assert.rejects(includedSkin('body','blue','',null));assert.equal(calls,1);
  }
  let calls=0;globalThis.fetch=async()=>{calls++;throw new DOMException('Synthetic timeout','AbortError');};
  await assert.rejects(includedSkin('body','blue','',null));assert.equal(calls,1);
 }finally{globalThis.chrome=previousChrome;globalThis.fetch=previousFetch;}
});

test('per-site consent for BYOK cannot authorize the hosted included path',async()=>{
 const previousChrome=globalThis.chrome;
 const saved={webskins_ai_mode:'byok',webskins_ai_consents_v3:{'https://owned.invalid|byok':true}};
 globalThis.chrome={tabs:{get:async()=>({url:'https://owned.invalid/page'})},storage:{local:{get:async k=>({[k]:saved[k]})}}};
 try {
  const {requireAiConsent}=await import('../src/utils/privacy.js');
  assert.equal((await requireAiConsent(1)).mode,'byok');
  saved.webskins_ai_mode='included';
  await assert.rejects(requireAiConsent(1),/Allow sharing/);
 }finally{globalThis.chrome=previousChrome;}
});
