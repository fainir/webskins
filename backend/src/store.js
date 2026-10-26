import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {DatabaseSync,backup} from 'node:sqlite';

export function databaseFile() {
  const url=process.env.DATABASE_URL;
  if(!url?.startsWith('file:'))throw new Error('A persistent SQLite DATABASE_URL is required');
  const file=decodeURIComponent(url.slice(5).split('?')[0]);
  return path.isAbsolute(file)?file:path.resolve('prisma',file);
}
export async function backupStore() {
  const file=databaseFile();
  if(!fs.existsSync(file))return null;
  const directory=path.join(path.dirname(file),'backups');fs.mkdirSync(directory,{recursive:true,mode:0o700});
  const output=path.join(directory,`webskins-${Date.now()}.db`),partial=output+'.partial';
  const source=new DatabaseSync(file,{readOnly:true});
  try {
    await backup(source,partial);
    fs.chmodSync(partial,0o600);
    const restored=new DatabaseSync(partial,{readOnly:true});
    try {if(restored.prepare('PRAGMA quick_check').get().quick_check!=='ok')throw new Error('Backup verification failed');}
    finally {restored.close();}
    fs.renameSync(partial,output);
    const copies=fs.readdirSync(directory).filter(name=>/^webskins-\d+\.db$/.test(name)).sort();
    for(const old of copies.slice(0,-7))fs.unlinkSync(path.join(directory,old));
    return output;
  } finally {source.close();if(fs.existsSync(partial))fs.unlinkSync(partial);}
}
export async function initializeStore() {
  if(!process.env.RATE_LIMIT_SECRET)throw new Error('RATE_LIMIT_SECRET must be set');
  await backupStore();
  const cli=fileURLToPath(new URL('../node_modules/prisma/build/index.js',import.meta.url));
  execFileSync(process.execPath,[cli,'db','push','--skip-generate'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:process.env,stdio:'pipe',timeout:60000});
  await backupStore();
}

export function backupHealth() {
  const directory=path.join(path.dirname(databaseFile()),'backups');
  const stamps=fs.existsSync(directory)?fs.readdirSync(directory).map(name=>/^webskins-(\d+)\.db$/.exec(name)?.[1]).filter(Boolean).map(Number):[];
  const ageMs=stamps.length?Date.now()-Math.max(...stamps):null;
  return {ok:ageMs!==null&&ageMs<48*60*60*1000,ageMs};
}
