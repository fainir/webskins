import test from 'node:test';
import assert from 'node:assert/strict';

for(const action of ['remove-api-key','revoke-ai-access']) {
 for(const operation of ['generate-skin','chat-refine']) {
 test(`${action} aborts ${operation} and clears the requested data`,async()=>{
  const saved={webskins_ai_mode:'byok',webskins_ai_consents_v3:{'https://example.invalid|byok':true}},session={webskins_api_key:'synthetic-session-key'};
  const listeners=[];let requests=0,signal,started;
  const providerStarted=new Promise(resolve=>{started=resolve;});
  const previousChrome=globalThis.chrome,previousFetch=globalThis.fetch;
  const previousNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
  const area=values=>({get:async key=>({[key]:values[key]}),remove:async keys=>{for(const key of Array.isArray(keys)?keys:[keys])delete values[key];}});
  globalThis.chrome={
   runtime:{id:'qa-extension',getURL:p=>'chrome-extension://qa-extension/'+p,onMessage:{addListener:fn=>listeners.push(fn)},sendMessage:async()=>({})},
   tabs:{get:async()=>({id:1,url:'https://example.invalid/fixture',windowId:1}),query:async()=>[{id:1}],sendMessage:async()=>({structure:'body'}),captureVisibleTab:async()=>{throw new Error('No screenshot expected');}},
   storage:{local:area(saved),session:area(session)},
  };
  globalThis.fetch=async(_url,request)=>{
   requests++;signal=request.signal;started();
   return new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Synthetic cancellation','AbortError')),{once:true}));
  };
  try {
   await import('../src/background.js?cancel='+action+operation);
   const send=(message,sender={id:'qa-extension',url:'chrome-extension://qa-extension/popup.html'})=>new Promise(resolve=>listeners[0]({...message,tabId:1},sender,resolve));
   const generation=send({action:operation,domain:'example.invalid',prompt:'Synthetic fixture',message:'Synthetic refinement',chatHistory:[]});
   let timer;
   try {await Promise.race([providerStarted,generation.then(result=>{throw new Error('Stopped before provider: '+JSON.stringify(result));}),new Promise((_r,reject)=>{timer=setTimeout(()=>reject(new Error('Provider call did not start')),2000);})]);}
   finally{clearTimeout(timer);}
   assert.match((await send({action},{id:'qa-extension',url:'https://example.invalid'})).error,/controls/);
   assert.equal(signal.aborted,false);
   assert.equal((await send({action})).success,true);assert.equal(signal.aborted,true);
   await generation;assert.equal(requests,1,'cancellation must prevent later paid requests');
   if(action==='remove-api-key')assert.equal(session.webskins_api_key,undefined);
   else assert.equal(saved.webskins_ai_consents_v3,undefined);
  } finally {globalThis.chrome=previousChrome;globalThis.fetch=previousFetch;
   if(previousNavigator)Object.defineProperty(globalThis,'navigator',previousNavigator);else delete globalThis.navigator;}
 });
 }
}
