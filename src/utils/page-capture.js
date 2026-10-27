// Capture rendered structure, never hidden content or form-control values.
const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','TEMPLATE','SVG','PATH','LINK','META',
  'BR','HR','WBR','IFRAME','OBJECT','EMBED']);
const CONTROLS = new Set(['INPUT','TEXTAREA','SELECT','OPTION']);

export function capturePageStructure(root, {computedStyle = el => getComputedStyle(el),
  maxNodes = 500, maxChars = 30000, maxDepth = 8} = {}) {
  let visited = 0, remaining = maxChars;
  const lines = [];
  function visit(el, depth) {
    if (!el || depth > maxDepth || visited >= maxNodes || remaining <= 0) return;
    visited++;
    if (SKIP.has(el.tagName) || el.hidden) return;
    const style = computedStyle(el);
    if (style.display === 'none' || ['hidden','collapse'].includes(style.visibility)
      || style.opacity === '0' || style.contentVisibility === 'hidden') return;
    if (!el.getClientRects().length && style.display !== 'contents') return;
    const parts = [el.tagName.toLowerCase()];
    if (el.id) parts.push('#' + el.id.slice(0,80));
    if (typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).slice(0,4).map(c => c.slice(0,48)).filter(Boolean);
      if (classes.length) parts.push('.' + classes.join('.'));
    }
    let text = '';
    if (!CONTROLS.has(el.tagName)) {
      let examined = 0;
      for (const node of el.childNodes) {
        if (++examined > 100 || text.length >= 60) break;
        if (node.nodeType === 3) text += node.textContent.trim().slice(0,40) + ' ';
      }
    }
    const line = ('  '.repeat(depth) + parts.join('')
      + (text.trim() ? ' ' + JSON.stringify(text.trim().slice(0,60)) : '')).slice(0,remaining);
    lines.push(line);remaining -= line.length + 1;
    if (CONTROLS.has(el.tagName)) return;
    for (const child of el.children) {
      if (visited >= maxNodes || remaining <= 0) break;
      visit(child,depth+1);
    }
  }
  visit(root,0);
  return lines.join('\n') || 'body (empty)';
}
