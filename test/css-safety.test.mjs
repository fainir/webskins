import test from 'node:test';
import assert from 'node:assert/strict';
import {sanitizeCss} from '../backend/src/css-safety.js';
import {parse,walk} from 'css-tree';

test('malicious CSS cannot retain resources through escaped or indirect syntax',()=>{
 const fixtures=[
  '@import "//tracker.example/theme.css";a{color:red}',
  'a{background:url(//tracker.example/a)}',
  'a{background:u\\72l(https://tracker.example/a)}',
  'a{background:image-set("https://tracker.example/a" 1x)}',
  'a{background:-webkit-image-set("/track" 1x)}',
  'a{--asset:url(https://tracker.example/a);background:var(--asset)}',
  'a{--asset:"/track";background:image-set(var(--asset))}',
  'a{background:var(--preexisting-page-url)}',
  '@font-face{font-family:Tracker;src:url(//tracker.example/font)}a{font-family:Tracker}',
  'a{cursor:url(data:image/svg+xml,bad),auto;mask:url(#anything);behavior:url(a.htc)}',
  '@\\69mport "//tracker.example/x";a{background:\\69mage-set("//tracker.example/x" 1x)}',
 ];
 for(const css of fixtures){
  const clean=sanitizeCss(css);let unsafe=false;
  walk(parse(clean),node=>{if(node.type==='Url'||node.type==='Raw'||node.type==='Function'&&['var','image-set','-webkit-image-set'].includes(node.name))unsafe=true;});
  assert.equal(unsafe,false,css);assert.ok(!clean.includes('tracker.example'),css);
 }
});
test('keeps useful local styles, gradients, layout and media rules',()=>{
 const clean=sanitizeCss('@media(min-width:600px){.card{color:#eee;background:linear-gradient(90deg,#111,#222);padding:calc(8px + 1vw);border-radius:12px;font-family:system-ui,sans-serif;transform:translateY(2px)}}');
 assert.match(clean,/@media/);assert.match(clean,/linear-gradient/);assert.match(clean,/color:#eee/);assert.match(clean,/font-family:system-ui,sans-serif/);
});
test('rejects oversized and malformed CSS',()=>{assert.equal(sanitizeCss('x'.repeat(100001)),'');assert.equal(sanitizeCss('a{background:url("unterminated}'),'');});
