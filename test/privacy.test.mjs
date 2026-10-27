import test from 'node:test';
import assert from 'node:assert/strict';

test('unconsented or untrusted callers cannot capture or transmit a private page',async()=>{
 const saved={webskins_ai_consents_v1:{'https://private.example.invalid':true}},listeners=[];let captures=0,requests=0,writes=0;
 const previousChrome=globalThis.chrome,previousFetch=globalThis.fetch;
 globalThis.chrome={
  runtime:{id:'qa-extension',getURL:p=>'chrome-extension://qa-extension/'+p,onMessage:{addListener:fn=>listeners.push(fn)},sendMessage:async()=>({})},
  tabs:{get:async()=>({url:'https://private.example.invalid/fixture',windowId:1}),sendMessage:async()=>{captures++;return {};},captureVisibleTab:async()=>{captures++;return '';},query:async()=>[{id:1}]},
  storage:{local:{get:async key=>({[key]:saved[key]}),set:async values=>{writes++;Object.assign(saved,values);},remove:async key=>{for(const item of Array.isArray(key)?key:[key])delete saved[item];}}},
 };
 globalThis.fetch=async()=>{requests++;throw new Error('No real provider requests are permitted in this fixture');};
 try{
  await import('../src/background.js');const listener=listeners[0];
  const send=(action,sender)=>new Promise(resolve=>listener({action,tabId:1,prompt:'harmless fixture'},sender,resolve));
  const trusted={id:'qa-extension',url:'chrome-extension://qa-extension/popup.html'};
  assert.match((await send('generate-skin',trusted)).error,/Allow sharing/);
  assert.equal(requests,0);assert.equal(captures,0);
  assert.match((await send('record-ai-consent',{id:'qa-extension',url:'https://private.example.invalid/fixture'})).error,/controls/);
  assert.equal(writes,0);
  assert.equal((await send('record-ai-consent',trusted)).granted,true);
  assert.equal(saved.webskins_ai_consents_v1,undefined,'old approvals cannot bypass the revised disclosure');
  const {requireAiConsent,revokeAiConsent}=await import('../src/utils/privacy.js');
  assert.equal((await requireAiConsent(1)).origin,'https://private.example.invalid');
  await revokeAiConsent();await assert.rejects(requireAiConsent(1),/Allow sharing/);
  assert.equal(requests,0);assert.equal(captures,0);
 }finally{globalThis.chrome=previousChrome;globalThis.fetch=previousFetch;}
});
