import test from 'node:test';
import assert from 'node:assert/strict';
import {capturePageStructure} from '../src/utils/page-capture.js';
const text=value=>({nodeType:3,textContent:value});
const element=(tag,children=[],extra={})=>({tagName:tag,id:'',className:'',hidden:false,
  children:children.filter(x=>x.tagName),childNodes:children,getClientRects:()=>[{}],...extra});
const style=el=>({display:'block',visibility:'visible',opacity:'1',...el.style});

test('capture excludes hidden elements, embedded documents and all form-control text/values',()=>{
 const root=element('BODY',[
  element('P',[text('Visible paragraph')]),
  element('DIV',[text('HIDDEN_SECRET')],{style:{display:'none'}}),
  element('P',[text('INVISIBLE_SECRET')],{style:{visibility:'hidden'}}),
  element('P',[text('TRANSPARENT_SECRET')],{style:{opacity:'0'}}),
  element('TEXTAREA',[text('FORM_SECRET')]),
  element('SELECT',[element('OPTION',[text('OPTION_SECRET')])]),
  element('INPUT',[],{value:'PASSWORD_SECRET'}),
  element('IFRAME',[text('FRAME_SECRET')]),
 ]);
 const output=capturePageStructure(root,{computedStyle:style});
 assert.match(output,/Visible paragraph/);assert.match(output,/textarea/);assert.match(output,/input/);
 assert.doesNotMatch(output,/SECRET/);
});
test('display-contents containers retain rendered descendants while non-rendered nodes are excluded',()=>{
 const root=element('BODY',[
  element('DIV',[element('P',[text('Visible child')])],{style:{display:'contents'},getClientRects:()=>[]}),
  element('P',[text('NO_RECT_SECRET')],{getClientRects:()=>[]})
 ]);
 const output=capturePageStructure(root,{computedStyle:style});
 assert.match(output,/Visible child/);assert.doesNotMatch(output,/NO_RECT_SECRET/);
});
test('capture bounds nodes, selector length, depth and total output for large pages',()=>{
 const root=element('BODY',Array.from({length:10000},(_,i)=>element('P',[text('x'.repeat(1000))],{id:'id'+i+'y'.repeat(1000)})));
 let calls=0;const output=capturePageStructure(root,{computedStyle:el=>{calls++;return style(el);},maxNodes:30,maxChars:400});
 assert.ok(output.length<=400);assert.ok(calls<=30);assert.doesNotMatch(output,/y{81}/);
 let deep=element('P',[text('BEYOND_DEPTH_SECRET')]);
 for(let i=0;i<12;i++)deep=element('DIV',[deep]);
 assert.doesNotMatch(capturePageStructure(deep,{computedStyle:style,maxDepth:3}),/BEYOND_DEPTH_SECRET/);
 assert.equal(capturePageStructure(null,{computedStyle:style}),'body (empty)');
});
