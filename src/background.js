// WebSkins Background Service Worker
// Handles Claude API calls, screenshot capture, and orchestration

import { generateSkin, evaluateSkin, chatRefine } from './utils/claude-api.js';
import {
  getApiKey, getModel,
  saveSkin, setActiveSkin, getActiveSkin, getSkinsForDomain,
  generateId,
} from './utils/storage.js';

// Dynamic cycle config
const MIN_QUALITY = 8;   // Keep improving until this quality
const MAX_CYCLES = 4;    // Hard cap on evaluation cycles

const activeAbortControllers = new Map();

// ===== Message Handler =====

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(err => sendResponse({ error: err.message }));
  return true; // Keep channel open for async
});

async function handleMessage(message, sender) {
  switch (message.action) {
    case 'generate-skin':
      return handleGenerate(message);

    case 'chat-refine':
      return handleChatRefine(message);

    case 'apply-skin':
      return handleApplySkin(message);

    case 'remove-skin':
      return handleRemoveSkin(message);

    case 'save-skin':
      return handleSaveSkin(message);

    case 'get-state':
      return handleGetState(message);

    case 'cancel-generation':
      return handleCancelGeneration(message);

    default:
      throw new Error('Unknown action: ' + message.action);
  }
}

// ===== Cancel Generation =====

async function handleCancelGeneration({ tabId }) {
  const controller = activeAbortControllers.get(tabId);
  if (controller) {
    controller.abort();
    activeAbortControllers.delete(tabId);
  }
  return { success: true };
}

// ===== Friendly Error Messages =====

function friendlyError(err) {
  const msg = err.message || String(err);
  if (msg.includes('401') || msg.includes('authentication')) return 'Invalid API key. Check your key in Settings.';
  if (msg.includes('429') || msg.includes('rate')) return 'Rate limited. Please wait a moment and try again.';
  if (msg.includes('500') || msg.includes('server')) return 'Anthropic servers are having issues. Try again later.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Network error. Check your internet connection.';
  if (msg.includes('abort') || msg.includes('AbortError')) return 'Generation cancelled.';
  return msg.length > 100 ? msg.substring(0, 100) + '...' : msg;
}

// ===== Generate Skin (Multi-Cycle) =====

async function handleGenerate({ tabId, prompt }) {
  if (!navigator.onLine) throw new Error('You appear to be offline. Please check your connection.');

  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API key not set');

  const model = await getModel();

  const controller = new AbortController();
  activeAbortControllers.set(tabId, controller);
  const { signal } = controller;

  try {

  // Get page structure from content script
  const pageData = await sendToTab(tabId, { action: 'capture-page' });
  const pageStructure = pageData.structure;

  // Get domain early
  const domainData = await sendToTab(tabId, { action: 'get-domain' });
  const domain = domainData.domain;

  // Notify popup: starting
  broadcastProgress(tabId, { stage: 'generating', cycle: 1, totalCycles: '?', message: 'Designing your skin with Opus...' });

  // Cycle 1: Generate initial skin from prompt + DOM
  const result = await generateSkin(apiKey, model, pageStructure, prompt, null, signal);

  // Apply CSS to page
  await sendToTab(tabId, { action: 'apply-css', css: result.css });
  broadcastProgress(tabId, { stage: 'applied', cycle: 1, totalCycles: '?', message: 'Initial skin applied — reviewing...' });

  let currentCss = result.css;
  let currentName = result.name || 'Custom Skin';
  let currentDescription = result.description || '';
  let suggestions = result.suggestions || [];
  let lastQuality = 0;

  // Dynamic improvement: keep going until quality >= MIN_QUALITY or MAX_CYCLES hit
  for (let i = 0; i < MAX_CYCLES; i++) {
    const cycleNum = i + 2;
    broadcastProgress(tabId, {
      stage: 'improving',
      cycle: cycleNum,
      totalCycles: MAX_CYCLES + 1,
      message: `Reviewing & improving (cycle ${cycleNum})...`,
    });

    // Wait for CSS to render before taking screenshot
    await delay(1000);

    // Take screenshot of current result
    let screenshotBase64;
    try {
      screenshotBase64 = await captureScreenshot(tabId);
    } catch {
      break; // Can't capture, stop improving
    }

    // Re-capture page structure (DOM may have shifted with new styles)
    let freshStructure = pageStructure;
    try {
      const fresh = await sendToTab(tabId, { action: 'capture-page' });
      freshStructure = fresh.structure;
    } catch { /* use original */ }

    // Send screenshot + DOM + current CSS to AI for evaluation
    let improved;
    try {
      improved = await evaluateSkin(apiKey, model, screenshotBase64, currentCss, prompt, freshStructure, signal);
    } catch (err) {
      // Per-cycle error recovery — keep best CSS so far, skip this cycle
      broadcastProgress(tabId, { stage: 'improving', message: `Cycle ${cycleNum} error, keeping current result...` });
      continue;
    }

    // Update if we got valid CSS (sanity check: not drastically smaller)
    if (improved.css && improved.css.length > currentCss.length * 0.3) {
      currentCss = improved.css;
    }
    currentName = improved.name || currentName;
    currentDescription = improved.description || currentDescription;
    suggestions = improved.suggestions || suggestions;
    lastQuality = improved.quality_score || 0;

    // Apply improved CSS
    await sendToTab(tabId, { action: 'apply-css', css: currentCss });
    broadcastProgress(tabId, {
      stage: 'applied',
      cycle: cycleNum,
      totalCycles: MAX_CYCLES + 1,
      message: `Cycle ${cycleNum} done (quality: ${lastQuality}/10)`,
    });

    // Stop when quality is good enough
    if (lastQuality >= MIN_QUALITY) {
      broadcastProgress(tabId, { stage: 'applied', message: `Quality ${lastQuality}/10 — looks good!` });
      break;
    }
  }

  // Create skin object
  const skin = {
    id: generateId(),
    name: currentName,
    css: currentCss,
    prompt,
    description: currentDescription,
    domain,
    chatHistory: [
      { role: 'user', content: prompt, timestamp: Date.now() },
      {
        role: 'assistant',
        content: currentDescription,
        timestamp: Date.now(),
        skinData: { css: currentCss, name: currentName, description: currentDescription, suggestions },
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Save and activate
  await saveSkin(domain, skin);
  await setActiveSkin(domain, skin.id);

  broadcastProgress(tabId, { stage: 'complete', message: 'Skin complete!' });

  return { success: true, skin, suggestions };

  } catch (err) {
    throw new Error(friendlyError(err));
  } finally {
    activeAbortControllers.delete(tabId);
  }
}

// ===== Chat Refine =====

async function handleChatRefine({ tabId, skinId, domain, message: userMessage, chatHistory }) {
  if (!navigator.onLine) throw new Error('You appear to be offline. Please check your connection.');

  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('API key not set');

  const model = await getModel();

  // Get current page structure
  const pageData = await sendToTab(tabId, { action: 'capture-page' });

  broadcastProgress(tabId, { stage: 'refining', message: 'Refining skin...' });

  let result;
  try {
    result = await chatRefine(apiKey, model, pageData.structure, chatHistory, userMessage);
  } catch (err) {
    throw new Error(friendlyError(err));
  }

  // Apply initial refined CSS
  let currentCss = result.css;
  let currentName = result.name;
  let currentDescription = result.description;
  let suggestions = result.suggestions || [];

  await sendToTab(tabId, { action: 'apply-css', css: currentCss });
  broadcastProgress(tabId, { stage: 'applied', message: 'Applied — reviewing for improvements...' });

  // Multi-cycle improvement: screenshot → evaluate → improve
  for (let i = 0; i < MAX_CYCLES; i++) {
    const cycleNum = i + 1;
    broadcastProgress(tabId, {
      stage: 'improving',
      message: `Reviewing & improving (cycle ${cycleNum}/${MAX_CYCLES})...`,
    });

    await delay(1000);

    let screenshotBase64;
    try {
      screenshotBase64 = await captureScreenshot(tabId);
    } catch {
      break;
    }

    let freshStructure = pageData.structure;
    try {
      const fresh = await sendToTab(tabId, { action: 'capture-page' });
      freshStructure = fresh.structure;
    } catch { /* use original */ }

    let improved;
    try {
      improved = await evaluateSkin(apiKey, model, screenshotBase64, currentCss, userMessage, freshStructure);
    } catch {
      broadcastProgress(tabId, { stage: 'improving', message: `Cycle ${cycleNum} error, keeping current...` });
      continue;
    }

    if (improved.css && improved.css.length > currentCss.length * 0.3) {
      currentCss = improved.css;
    }
    currentName = improved.name || currentName;
    currentDescription = improved.description || currentDescription;
    suggestions = improved.suggestions || suggestions;
    const quality = improved.quality_score || 0;

    await sendToTab(tabId, { action: 'apply-css', css: currentCss });
    broadcastProgress(tabId, {
      stage: 'applied',
      message: `Cycle ${cycleNum} done (quality: ${quality}/10)`,
    });

    if (quality >= MIN_QUALITY) {
      broadcastProgress(tabId, { stage: 'applied', message: `Quality ${quality}/10 — looks good!` });
      break;
    }
  }

  broadcastProgress(tabId, { stage: 'complete', message: 'Skin updated!' });

  return {
    success: true,
    skinData: {
      css: currentCss,
      name: currentName,
      description: currentDescription,
      suggestions,
    },
  };
}

// ===== Apply Skin =====

async function handleApplySkin({ tabId, domain, skinId, css }) {
  await sendToTab(tabId, { action: 'apply-css', css });
  await setActiveSkin(domain, skinId);
  return { success: true };
}

// ===== Remove Skin =====

async function handleRemoveSkin({ tabId, domain }) {
  await sendToTab(tabId, { action: 'remove-css' });
  await setActiveSkin(domain, null);
  return { success: true };
}

// ===== Save Skin =====

async function handleSaveSkin({ domain, skin, activate }) {
  skin.updatedAt = Date.now();
  await saveSkin(domain, skin);
  if (activate) {
    await setActiveSkin(domain, skin.id);
  }
  return { success: true };
}

// ===== Get State =====

async function handleGetState({ domain }) {
  const skins = await getSkinsForDomain(domain);
  const active = await getActiveSkin(domain);
  return { skins, activeSkin: active };
}

// ===== Helpers =====

async function sendToTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    throw new Error('Cannot modify this page. WebSkins works on regular web pages only.');
  }
}

async function captureScreenshot(tabId) {
  const tab = await chrome.tabs.get(tabId);
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  return dataUrl.split(',')[1];
}

function broadcastProgress(tabId, data) {
  chrome.runtime.sendMessage({ action: 'generation-progress', tabId, ...data }).catch(() => {});
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
