import {parse,walk,generate,ident} from 'css-tree';

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
  walk(ast,{visit:'Atrule',enter(node,item,list){
    if(!RULES.has(decoded(node.name))||!node.block) {list?.remove(item);return;}
    let unsafe=false;
    if(node.prelude)walk(node.prelude,n=>{if(n.type==='Url'||n.type==='Raw')unsafe=true;});
    if(unsafe)list?.remove(item);
  }});
  walk(ast,{visit:'Declaration',enter(node,item,list){
    const property=decoded(node.property);
    let unsafe=!property||property.startsWith('--')||['behavior','-moz-binding','font','src'].includes(property);
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
  return raw||!declarations?'':generate(ast);
}
