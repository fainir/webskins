import {parse,walk,generate,ident,clone} from 'css-tree';

const RULES=new Set(['media','supports','container','layer','keyframes','-webkit-keyframes','starting-style']);
const FUNCTIONS=new Set(['rgb','rgba','hsl','hsla','hwb','lab','lch','oklab','oklch','color','color-mix','light-dark',
  'linear-gradient','radial-gradient','conic-gradient','repeating-linear-gradient','repeating-radial-gradient','repeating-conic-gradient',
  'calc','min','max','clamp','round','mod','rem','abs','sign','sqrt','pow','hypot','log','exp','sin','cos','tan','asin','acos','atan','atan2',
  'translate','translatex','translatey','translatez','translate3d','scale','scalex','scaley','scalez','scale3d','rotate','rotatex','rotatey','rotatez','rotate3d',
  'skew','skewx','skewy','matrix','matrix3d','perspective','cubic-bezier','steps','linear','blur','brightness','contrast','drop-shadow','grayscale','hue-rotate','invert','opacity','saturate','sepia']);
const SYSTEM_FONTS=new Set(['system-ui','ui-sans-serif','ui-serif','ui-monospace','sans-serif','serif','monospace','cursive','fantasy','emoji','math','fangsong']);
const decoded=value=>{try{return ident.decode(value).toLowerCase();}catch{return '';}};

/** No URL-bearing values, imports, webfonts, raw syntax or page-variable indirection. */
export function sanitizeCss(css) {
  if(typeof css!=='string'||css.length>100_000) return '';
  let ast;
  try {ast=parse(css,{parseCustomProperty:true,onParseError(){throw new Error('Invalid CSS');}});}catch{return '';}
  // Preserve existing generated palettes by resolving their own unambiguous definitions.
  // Never consult page variables or emit a custom property that could affect page resources.
  const definitions=new Map();
  walk(ast,{visit:'Declaration',enter(node){
    if(!node.property.startsWith('--'))return;
    const name=ident.decode(node.property),value=generate(node.value);
    if(!definitions.has(name))definitions.set(name,node.value);
    else if(definitions.get(name)&&generate(definitions.get(name))!==value)definitions.set(name,null);
  }});
  // Bound total cloning, including repeated references in a deliberately expanding palette.
  // Input size alone does not bound the size of recursively substituted custom properties.
  let remainingNodes=100_000;
  function resolveValue(value,stack=new Set()) {
    let count=0;
    walk(value,()=>{if(++count>remainingNodes)throw new Error('CSS expansion limit');});
    remainingNodes-=count;
    const result=clone(value);let invalid=false;
    walk(result,node=>{
      if(node.type!=='Function'||decoded(node.name)!=='var')return;
      const args=node.children.toArray(),first=args[0];
      if(first?.type!=='Identifier'){invalid=true;return;}
      const name=ident.decode(first.name);
      if(stack.has(name)||stack.size>=16){invalid=true;return;}
      const definition=definitions.get(name);
      let target;
      if(definition){target=resolveValue(definition,new Set([...stack,name]));}
      else {
        const comma=args.findIndex(n=>n.type==='Operator'&&n.value===',');
        if(comma>=0){const fallback=clone(node);fallback.type='Value';fallback.children.fromArray(args.slice(comma+1));target=resolveValue(fallback,new Set([...stack,name]));}
      }
      if(!target){invalid=true;return;}
      Object.assign(node,target);
    });
    return invalid?null:result;
  }
  walk(ast,{visit:'Atrule',enter(node,item,list){
    if(!RULES.has(decoded(node.name))||!node.block) {list?.remove(item);return;}
    let unsafe=false;
    if(node.prelude)walk(node.prelude,n=>{if(n.type==='Url'||n.type==='Raw')unsafe=true;});
    if(unsafe)list?.remove(item);
  }});
  walk(ast,{visit:'Declaration',enter(node,item,list){
    const property=decoded(node.property);
    let unsafe=!property||property.startsWith('--')||['behavior','-moz-binding','font','src'].includes(property);
    if(unsafe){list?.remove(item);return;}
    let resolved;
    try {resolved=resolveValue(node.value);}catch{list?.remove(item);return;}
    if(!resolved){list?.remove(item);return;}
    node.value=resolved;
    walk(node.value,n=>{
      if(n.type==='Raw'||n.type==='Url')unsafe=true;
      if(n.type==='Function'&&!FUNCTIONS.has(decoded(n.name)))unsafe=true;
      if(property==='font-family' && n.type!=='Value' && n.type!=='Operator' && n.type!=='WhiteSpace' &&
        !(n.type==='Identifier'&&SYSTEM_FONTS.has(decoded(n.name))))unsafe=true;
    });
    if(unsafe)list?.remove(item);
  }});
  // Unknown/raw recovered constructs are never forwarded to a browser's different parser.
  let raw=false,declarations=0;walk(ast,node=>{if(node.type==='Raw')raw=true;if(node.type==='Declaration')declarations++;});
  const result=raw||!declarations?'':generate(ast);
  return result.length>100_000?'':result;
}
