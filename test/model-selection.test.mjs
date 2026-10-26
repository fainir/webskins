import test from 'node:test';
import assert from 'node:assert/strict';
import {getModel,setModel,normalizeModel} from '../src/utils/storage.js';
test('uses current balanced model for new or retired settings and preserves explicit current choices',async()=>{
 const values={};globalThis.chrome={storage:{local:{async get(key){return {[key]:values[key]}},async set(data){Object.assign(values,data)}}}};
 assert.equal(await getModel(),'claude-sonnet-5-5');
 for(const old of ['claude-opus-4-20250514','claude-sonnet-4-20250514','claude-3-5-sonnet-20241022','claude-3-haiku-20240307']){
  values.webskins_model=old;assert.equal(await getModel(),'claude-sonnet-5-5');assert.equal(normalizeModel(old),'claude-sonnet-5-5');
 }
 await setModel('claude-opus-5-5');assert.equal(await getModel(),'claude-opus-5-5');
 await setModel('not-a-model');assert.equal(await getModel(),'claude-sonnet-5-5');
 delete globalThis.chrome;
});
