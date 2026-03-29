// WebSkins Content Script
// Runs on every page — handles CSS injection, DOM capture, and auto-apply

(function () {
  'use strict';

  const STYLE_ID = 'webskins-injected-style';
  const STORAGE_KEY_ACTIVE = 'webskins_active';
  const STORAGE_KEY_SKINS = 'webskins_skins';

  // ===== CSS Sanitization =====

  function sanitizeCss(css) {
    // Remove dangerous CSS patterns that could be used for tracking or data exfiltration
    return css
      // Remove @import rules (can load external stylesheets)
      .replace(/@import\s+[^;]+;?/gi, '/* @import removed */')
      // Remove url() values pointing to external resources (keep data: and local refs)
      .replace(/url\s*\(\s*(['"]?)\s*(?!data:|#)https?:\/\/[^)]+\1\s*\)/gi, 'url(about:blank)')
      // Remove -moz-binding (Firefox XSS vector)
      .replace(/-moz-binding\s*:[^;]+;?/gi, '')
      // Remove behavior (IE XSS vector)
      .replace(/behavior\s*:[^;]+;?/gi, '')
      // Remove expression() (IE XSS vector)
      .replace(/expression\s*\([^)]*\)/gi, '')
      // Remove @font-face blocks with external URLs
      .replace(/@font-face\s*\{[^}]*src\s*:[^}]*url\s*\([^)]*https?:\/\/[^}]*\}/gi, '/* @font-face removed */')
      // Remove cursor with external URLs
      .replace(/cursor\s*:[^;]*url\s*\(\s*(['"]?)\s*(?!data:|#)https?:\/\/[^)]+\1\s*\)[^;]*;?/gi, 'cursor: default !important;')
      // Remove -webkit-mask-image with external URLs
      .replace(/-webkit-mask-image\s*:[^;]*url\s*\(\s*(['"]?)\s*(?!data:|#)https?:\/\/[^)]+\1\s*\)[^;]*;?/gi, '')
      // Remove mask-image with external URLs
      .replace(/mask-image\s*:[^;]*url\s*\(\s*(['"]?)\s*(?!data:|#)https?:\/\/[^)]+\1\s*\)[^;]*;?/gi, '');
  }

  // ===== CSS Injection =====

  function applyCss(css) {
    removeCss();
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = sanitizeCss(css);
    document.head.appendChild(style);
  }

  function removeCss() {
    const existing = document.getElementById(STYLE_ID);
    if (existing) existing.remove();
  }

  function getCurrentCss() {
    const el = document.getElementById(STYLE_ID);
    return el ? el.textContent : null;
  }

  // ===== DOM Capture =====

  function capturePageStructure() {
    const SKIP_TAGS = new Set([
      'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'LINK', 'META',
      'BR', 'HR', 'WBR', 'IFRAME', 'OBJECT', 'EMBED',
    ]);

    function processElement(el, depth) {
      if (depth > 8) return null;
      if (SKIP_TAGS.has(el.tagName)) return null;
      if (el.tagName === 'DIV' && el.id === STYLE_ID) return null;

      const tag = el.tagName.toLowerCase();
      const parts = [tag];

      if (el.id) parts.push(`#${el.id}`);
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/).slice(0, 4).join('.');
        if (classes) parts.push(`.${classes}`);
      }

      const selector = parts.join('');
      const children = [];

      for (const child of el.children) {
        const processed = processElement(child, depth + 1);
        if (processed) children.push(processed);
      }

      // Get direct text content (not from children)
      let text = '';
      for (const node of el.childNodes) {
        if (node.nodeType === 3) {
          const t = node.textContent.trim();
          if (t) text += t.substring(0, 40) + ' ';
        }
      }
      text = text.trim();

      // Build output
      let line = selector;
      if (text) line += ` "${text.substring(0, 60)}"`;

      if (children.length === 0) return line;

      const indent = '  '.repeat(depth);
      let result = line + '\n';
      for (const child of children) {
        result += indent + '  ' + child + '\n';
      }
      return result.trimEnd();
    }

    const body = processElement(document.body, 0);
    return body || 'body (empty)';
  }

  // ===== Auto-Apply on Page Load =====

  async function autoApply() {
    try {
      const domain = window.location.hostname;
      const result = await chrome.storage.local.get([STORAGE_KEY_ACTIVE, STORAGE_KEY_SKINS]);
      const active = result[STORAGE_KEY_ACTIVE] || {};
      const skins = result[STORAGE_KEY_SKINS] || {};

      const activeSkinId = active[domain];
      if (!activeSkinId) return;

      const domainSkins = skins[domain] || [];
      const skin = domainSkins.find(s => s.id === activeSkinId);
      if (skin && skin.css) {
        applyCss(skin.css);
      }
    } catch (err) {
      console.error('[WebSkins] Auto-apply failed:', err);
    }
  }

  // ===== Message Handling =====

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'apply-css':
        applyCss(message.css);
        sendResponse({ success: true });
        break;

      case 'remove-css':
        removeCss();
        sendResponse({ success: true });
        break;

      case 'get-current-css':
        sendResponse({ css: getCurrentCss() });
        break;

      case 'capture-page':
        sendResponse({ structure: capturePageStructure() });
        break;

      case 'get-domain':
        sendResponse({ domain: window.location.hostname });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  });

  // Run auto-apply
  autoApply();
})();
