import crypto from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn,spawnSync} from 'node:child_process';

test('isolated marketplace ownership, counters, readiness and restore',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'webskins-api-'));fs.chmodSync(directory,0o700);
 process.env.DATABASE_URL='file:'+path.join(directory,'marketplace.db');process.env.RATE_LIMIT_SECRET='synthetic-rate-secret';
 const {initializeStore,backupStore}=await import('../src/store.js');
 await initializeStore();
 const {createApp}=await import('../src/app.js');const {prisma}=await import('../src/routes/skins.js');
 const server=createApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const call=async(route,method='GET',body,token)=>{
  const res=await fetch(base+route,{method,headers:{'x-webskins-key-storage':'1',...(body?{'content-type':'application/json'}:{}),...(token?{authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:res.status,body:await res.json()};
 };
 const input=name=>({name,css:'body{color:#222;background:#eee}',domain:'example.invalid',authorName:'Synthetic QA',authorId:'public-id-is-not-authentication'});
 let child;
 try{
  assert.equal((await call('/health')).status,200);
  const privacy=await fetch(base+'/privacy');assert.equal(privacy.status,200);
  const policy=await privacy.text();assert.match(policy,/session-only/);assert.match(policy,/Anthropic/);
  assert.match(policy,/HMAC/);assert.match(policy,/private management key/);
  const keyOne=crypto.randomBytes(32).toString('base64url'),keyTwo=crypto.randomBytes(32).toString('base64url');
  const first=await call('/api/skins','POST',input('First'),keyOne);
  const second=await call('/api/skins','POST',input('Second'),keyTwo);
  assert.equal(first.status,201);assert.equal(second.status,201);
  const id=first.body.id,key=keyOne;
  assert.ok(key);assert.equal(first.body.manageKeyHash,undefined);
  const published=await call('/api/skins/'+id);
  assert.equal(published.body.manageKey,undefined);assert.equal(published.body.manageKeyHash,undefined);
  assert.equal((await call('/api/skins/'+id,'DELETE',{authorId:input('').authorId})).status,401);
  assert.equal((await call('/api/skins/'+id,'DELETE',null,keyTwo)).status,403);
  assert.equal((await call('/api/skins/'+id,'DELETE',null,key)).status,200);
  const keep=second.body;
  for(let i=0;i<5;i++)assert.equal((await call('/api/skins/'+keep.id+'/like','POST')).body.likes,1);
  for(let i=0;i<3;i++)assert.equal((await call('/api/skins/'+keep.id+'/install','POST')).body.installs,1);
  assert.equal((await call('/api/skins','POST',{...input('Unsafe'),css:'a{background:image-set("//tracker.invalid/a" 1x)}'},keyOne)).status,400);
  assert.equal((await call('/api/skins','POST',{...input('Huge'),css:'x'.repeat(100001)},keyOne)).status,400);
  const legacy=await prisma.skin.create({data:{...input('Legacy')}});
  assert.equal((await call('/api/skins/'+legacy.id,'DELETE',null,key)).status,409);
  await prisma.$executeRawUnsafe('ALTER TABLE Metric RENAME TO Metric_paused');
  assert.equal((await call('/health')).status,503);
  await prisma.$executeRawUnsafe('ALTER TABLE Metric_paused RENAME TO Metric');
  const snapshot=await backupStore();assert.ok(snapshot);assert.equal(fs.statSync(snapshot).mode&0o077,0);
  // Reach the durable per-network daily publication cap, independent of transient counters.
  for(let i=0;i<10;i++)await call('/api/skins','POST',input('Quota '+i),crypto.randomBytes(32).toString('base64url'));
  assert.ok(await prisma.metric.count({where:{kind:'publish'}})<=10);
  await new Promise(r=>server.close(r));await prisma.$disconnect();
  const restored=path.join(directory,'restored.db');fs.copyFileSync(snapshot,restored);
  const port=await new Promise(resolve=>{const s=net.createServer().listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>resolve(n));});});
  child=spawn(process.execPath,['src/index.js'],{cwd:process.cwd(),env:{...process.env,DATABASE_URL:'file:'+restored,PORT:String(port)},stdio:'ignore'});
  const restoredBase=`http://127.0.0.1:${port}`;let ready=false;
  for(let i=0;i<100;i++){try{if((await fetch(restoredBase+'/health')).status===200){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}
  assert.ok(ready,'restored service starts after migration/backup');
  const result=await fetch(restoredBase+'/api/skins/'+keep.id,{method:'DELETE',headers:{authorization:`Bearer ${keyTwo}`}});
  assert.equal(result.status,200,'private ownership survives a fresh restore');
  const broken=path.join(directory,'not-a-database');fs.writeFileSync(broken,'invalid fixture');
  const startup=spawnSync(process.execPath,['src/index.js'],{cwd:process.cwd(),env:{...process.env,DATABASE_URL:'file:'+broken,PORT:'0'},encoding:'utf8',timeout:10000});
  assert.equal(startup.status,1);assert.ok(!startup.stdout.includes('API ready'));
 }finally{
  if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}
  if(server.listening)await new Promise(r=>server.close(r));await prisma.$disconnect();fs.rmSync(directory,{recursive:true,force:true});
 }
});
