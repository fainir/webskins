import {capturePageStructure} from './utils/page-capture.js';
import {sanitizeCss} from "../backend/src/css-safety.js";
// WebSkins Content Script
// Runs on every page — handles CSS injection, DOM capture, and auto-apply

(function () {
  'use strict';

  const STYLE_ID = 'webskins-injected-style';
  const STORAGE_KEY_ACTIVE = 'webskins_active';
  const STORAGE_KEY_SKINS = 'webskins_skins';

  // ===== CSS Sanitization =====

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
        sendResponse({ structure: capturePageStructure(document.body) });
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
