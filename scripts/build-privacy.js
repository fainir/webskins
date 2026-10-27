import fs from 'node:fs';
import crypto from 'node:crypto';

const source=fs.readFileSync('PRIVACY.md','utf8');
const digest=crypto.createHash('sha256').update(source).digest('hex');
const escape=text=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const content=source.trim().split(/\n\n+/).map(part=>part.startsWith('# ')?`<h1>${escape(part.slice(2))}</h1>`
 :part.startsWith('## ')?`<h2>${escape(part.slice(3))}</h2>`:`<p>${escape(part)}</p>`).join('');
const page=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="privacy-source-sha256" content="${digest}"><title>WebSkins Privacy Policy</title><style>body{font:17px/1.65 system-ui,sans-serif;margin:0;background:#f7f8fc;color:#202335}main{max-width:850px;margin:48px auto;padding:24px}h1{font-size:2rem;line-height:1.2}h2{font-size:1.2rem;margin-top:2rem}p{overflow-wrap:anywhere}</style></head><body><main>${content}</main></body></html>`;
fs.mkdirSync('backend/public',{recursive:true});fs.writeFileSync('backend/public/privacy.html',page);
console.log('Public privacy page generated from PRIVACY.md');
