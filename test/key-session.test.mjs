import test from 'node:test';
import assert from 'node:assert/strict';
import {getApiKey,setApiKey,removeApiKey} from '../src/utils/storage.js';

const key='webskins_api_key';
function storage(legacy){
 const local=legacy?{[key]:legacy}:{},session={};let trusted=false;
 const area=values=>({get:async name=>({[name]:values[name]}),set:async data=>Object.assign(values,data),remove:async name=>{delete values[name];}});
 globalThis.chrome={storage:{local:area(local),session:{...area(session),setAccessLevel:async value=>{assert.equal(value.accessLevel,'TRUSTED_CONTEXTS');trusted=true;}}}};
 return {local,session,isTrusted:()=>trusted};
}
test('keys remain session-only and are unavailable after a browser restart',async()=>{
 const s=storage();await setApiKey('synthetic-key');assert.equal(s.local[key],undefined);
 assert.equal(await getApiKey(),'synthetic-key');assert.ok(s.isTrusted());delete s.session[key];
 assert.equal(await getApiKey(),null);
});
test('a legacy local key is removed only after successful session migration',async()=>{
 const s=storage('synthetic-legacy');assert.equal(await getApiKey(),'synthetic-legacy');
 assert.equal(s.local[key],undefined);assert.equal(s.session[key],'synthetic-legacy');
});
test('failed migration preserves the legacy key and never returns it for use',async()=>{
 const s=storage('synthetic-legacy');chrome.storage.session.set=async()=>{throw new Error('Synthetic storage failure');};
 await assert.rejects(getApiKey(),/Synthetic storage failure/);assert.equal(s.local[key],'synthetic-legacy');
 chrome.storage.session.set=async()=>{};await assert.rejects(getApiKey(),/could not be retained/);
 assert.equal(s.local[key],'synthetic-legacy');
});
test('explicit removal clears both session and legacy copies without removing saved skins',async()=>{
 const s=storage('synthetic-legacy');s.local.webskins_skins={example:[]};s.session[key]='synthetic-session';
 await removeApiKey();assert.equal(s.session[key],undefined);assert.equal(s.local[key],undefined);
 assert.deepEqual(s.local.webskins_skins,{example:[]});
});
test('unsupported browsers fail closed and retain the original key',async()=>{
 const s=storage('synthetic-legacy');delete chrome.storage.session;
 await assert.rejects(getApiKey(),/Update Chrome/);assert.equal(s.local[key],'synthetic-legacy');
});
