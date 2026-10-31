// WebSkins Popup — State Management & UI
import {
  getApiKey, setApiKey, getModel, setModel, getAiMode, setAiMode,
  getSkinsForDomain,
  clearAllData, saveSkin,
} from './utils/storage.js';
import {
  fetchTrendingSkins, fetchSkinsByDomain,
  installSkin as apiInstallSkin,
  likeSkin as apiLikeSkin, publishSkin as apiPublishSkin,
  getAuthorId,
} from './utils/marketplace.js';

// ===== State =====

const state = {
  view: 'home', // 'home' | 'chat' | 'settings'
  aiMode: 'included',
  apiKey: null,
  apiKeySet: false,
  model: 'claude-sonnet-5-5',
  domain: '',
  tabId: null,
  isGenerating: false,
  activeSkin: null,
  skins: [],
  currentSkin: null,
  chatMessages: [],
  progressMessage: '',
  generationCancelled: false,
  communitySkins: [],
  communitySort: 'trending', // 'trending' | 'newest'
  votedSkins: new Set(),
  communityLoading: true,
  communityError: false,
  localReady: false,
};

// ===== Init =====

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation and recovery stay usable even when one storage area is unavailable.
  setupEventListeners();
  render();
  let tab;
  try {[tab] = await chrome.tabs.query({ active: true, currentWindow: true });}
  catch {showStatus('Could not read the active tab. Reopen WebSkins on a website.', 'error');}
  if (tab) {
    state.tabId = tab.id;
    try {
      const url = new URL(tab.url);
      state.domain = url.hostname;
    } catch {
      state.domain = 'unknown';
    }
  }

  await loadLocalState();

  // Fetch community skins (non-blocking)
  loadCommunitySkins();

  // Listen for progress updates from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'generation-progress' && msg.tabId === state.tabId) {
      handleProgress(msg);
    }
  });
});

async function loadLocalState() {
  const retry = document.getElementById('btn-retry-storage');
  retry.disabled = true;
  retry.textContent = 'Loading…';
  const results = await Promise.allSettled([
    getApiKey().then(key => {state.apiKey = key;state.apiKeySet = !!key;}),
    getModel().then(model => {state.model = model;}),
    getAiMode().then(mode => {state.aiMode = mode;}),
    refreshSkins(),
    chrome.storage.local.get('webskins_voted').then(data => {state.votedSkins = new Set(data.webskins_voted || []);}),
  ]);
  state.localReady = results.every(result => result.status === 'fulfilled');
  document.getElementById('storage-error').classList.toggle('hidden', state.localReady);
  document.getElementById('api-key-section').classList.toggle('hidden', state.apiKeySet || state.aiMode==='included');
  retry.disabled = false;
  retry.textContent = 'Retry local storage';
  render();
}

async function refreshSkins() {
  const skins = await getSkinsForDomain(state.domain);

  // Check for active skin
  const activeResult = await chrome.storage.local.get('webskins_active');
  const activeMap = activeResult.webskins_active || {};
  const activeSkinId = activeMap[state.domain];

  if (activeSkinId) {
    state.activeSkin = skins.find(s => s.id === activeSkinId) || null;
  } else {
    state.activeSkin = null;
  }
  state.skins = skins;
}

function navigate(view, focusId) {
  state.view = view;
  render();
  document.getElementById(focusId)?.focus();
}

// ===== Render =====

function render() {
  const homeView = document.getElementById('home-view');
  const chatView = document.getElementById('chat-view');
  const settingsView = document.getElementById('settings-view');

  homeView.classList.toggle('hidden', state.view !== 'home');
  chatView.classList.toggle('hidden', state.view !== 'chat');
  settingsView.classList.toggle('hidden', state.view !== 'settings');

  document.getElementById('ai-mode').value=state.aiMode;
  document.getElementById('ai-mode').disabled=state.isGenerating;
  document.getElementById('settings-ai-mode').value=state.aiMode;
  document.getElementById('settings-ai-mode').disabled=state.isGenerating;
  if (state.view === 'home') renderHome();
  if (state.view === 'chat') renderChat();
  if (state.view === 'settings') renderSettings();
}

function renderHome() {
  // Active skin banner
  const banner = document.getElementById('active-skin-banner');
  if (state.activeSkin) {
    banner.classList.remove('hidden');
    document.getElementById('active-skin-name').textContent = state.activeSkin.name;
  } else {
    banner.classList.add('hidden');
  }

  // History section
  renderHistory();

  // Generate button state
  const btn = document.getElementById('btn-generate');
  const btnText = document.getElementById('generate-btn-text');
  const cancelBtn = document.getElementById('btn-cancel-generate');
  btn.disabled = state.isGenerating || !state.localReady;

  if (state.isGenerating) {
    btnText.textContent = state.progressMessage || 'Generating...';
    cancelBtn.classList.remove('hidden');
  } else {
    btnText.textContent = 'Generate Skin';
    cancelBtn.classList.add('hidden');
  }
}

function renderHistory() {
  const section = document.getElementById('history-section');
  const list = document.getElementById('history-list');

  if (state.skins.length === 0) {
    section.classList.remove('hidden');
    list.innerHTML = `<p class="text-xs text-on-surface-variant py-2">${state.localReady ? 'No saved skins for this site yet.' : 'Saved skins will appear when local storage is available.'}</p>`;
    return;
  }

  section.classList.remove('hidden');
  list.innerHTML = '';

  for (const skin of state.skins) {
    const isActive = state.activeSkin?.id === skin.id;
    const card = document.createElement('div');
    card.className = 'w-[140px] flex-shrink-0 snap-start skin-card';
    card.innerHTML = `
      <button class="skin-open-btn h-20 w-full rounded-xl mb-1.5 overflow-hidden relative shadow-sm ${isActive ? 'ring-2 ring-primary' : ''}" aria-label="Edit ${escapeHtml(skin.name)}">
        <div class="absolute inset-0 ${getGradient(skin.name)}"></div>
        <span class="absolute bottom-1.5 left-1.5 rounded bg-white px-2 py-1 text-xs font-bold text-primary">Edit</span>
      </button>
      <p class="text-xs font-bold truncate">${escapeHtml(skin.name)}</p>
      <p class="text-[10px] text-on-surface-variant font-medium mb-1">${timeAgo(skin.createdAt)}</p>
          ${isActive
      ? '<button class="skin-remove-btn bg-white text-error text-xs font-bold px-3 py-1.5 rounded-lg">Remove</button>'
      : '<button class="skin-apply-btn bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-lg">Apply</button>'
    }
    `;
    const action = card.querySelector('.skin-apply-btn, .skin-remove-btn');
    action.setAttribute('aria-label', `${isActive ? 'Remove' : 'Apply'} ${skin.name}`);

    // Click card to open chat
    card.addEventListener('click', (e) => {
      if (e.target.closest('.skin-apply-btn')) {
        handleApplySkin(skin);
        e.stopPropagation();
        return;
      }
      if (e.target.closest('.skin-remove-btn')) {
        handleRemoveSkin();
        e.stopPropagation();
        return;
      }
      if (e.target.closest('.skin-open-btn')) openSkinChat(skin);
    });

    list.appendChild(card);
  }
}

function renderChat() {
  const messagesEl = document.getElementById('chat-messages');
  const nameEl = document.getElementById('chat-skin-name');
  const domainEl = document.getElementById('chat-domain');

  nameEl.textContent = state.currentSkin?.name || 'Editing Skin';
  domainEl.textContent = state.domain;

  messagesEl.innerHTML = '';

  for (const msg of state.chatMessages) {
    const bubble = document.createElement('div');

    if (msg.role === 'system') {
      bubble.className = 'msg-system py-2 px-4';
      bubble.textContent = msg.content;
    } else if (msg.role === 'user') {
      bubble.className = 'msg-user px-4 py-3 max-w-[85%] ml-auto text-sm';
      bubble.textContent = msg.content;
    } else {
      bubble.className = 'msg-assistant px-4 py-3 max-w-[85%] text-sm';

      let html = `<p class="font-medium text-xs mb-1">${escapeHtml(msg.skinData?.description || msg.content)}</p>`;

      if (msg.skinData?.suggestions?.length) {
        html += '<div class="mt-2 flex flex-wrap gap-1">';
        for (const s of msg.skinData.suggestions) {
          html += `<button class="suggestion-chip text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors">${escapeHtml(s)}</button>`;
        }
        html += '</div>';
      }

      bubble.innerHTML = html;

      // Handle suggestion chip clicks
      bubble.querySelectorAll('.suggestion-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          document.getElementById('chat-input').value = chip.textContent;
          handleChatSend();
        });
      });
    }

    messagesEl.appendChild(bubble);
  }

  // Loading indicator
  if (state.isGenerating) {
    const loading = document.createElement('div');
    loading.className = 'msg-assistant px-4 py-3 max-w-[85%] text-sm';
    loading.innerHTML = `
      <div class="loading-dots flex gap-1">
        <span class="w-2 h-2 bg-primary rounded-full inline-block"></span>
        <span class="w-2 h-2 bg-primary rounded-full inline-block"></span>
        <span class="w-2 h-2 bg-primary rounded-full inline-block"></span>
      </div>
      <p class="text-[10px] text-on-surface-variant mt-1">${escapeHtml(state.progressMessage || 'Thinking...')}</p>
    `;
    messagesEl.appendChild(loading);
  }

  // Scroll to bottom
  messagesEl.scrollTop = messagesEl.scrollHeight;

  // Disable input while generating
  document.getElementById('chat-input').disabled = state.isGenerating;
  document.getElementById('btn-chat-send').disabled = state.isGenerating;
  document.getElementById('btn-save-skin').disabled = state.isGenerating || !state.currentSkin;
  document.getElementById('btn-publish-skin').disabled = state.isGenerating || !state.currentSkin;
}

function renderSettings() {
  const keyInput = document.getElementById('settings-api-key');
  const modelSelect = document.getElementById('settings-model');

  if (state.apiKey) {
    const masked = '••••••••';
    keyInput.value = masked;
    keyInput.dataset.masked = masked;
  }
  modelSelect.value = state.model;
}

// ===== Event Listeners =====

function setupEventListeners() {
  for(const id of ['ai-mode','settings-ai-mode'])document.getElementById(id).addEventListener('change',async e=>{
    try {await setAiMode(e.target.value);state.aiMode=e.target.value;await loadLocalState();}
    catch {showStatus('Could not save AI mode. Retry local storage.','error');}
  });
  document.getElementById('btn-retry-storage').addEventListener('click', loadLocalState);
  document.getElementById('btn-dismiss-status').addEventListener('click', () => document.getElementById('status-bar').classList.add('hidden'));
  // Navigation
  document.getElementById('btn-settings').addEventListener('click', () => {
    navigate('settings', 'btn-settings-back');
  });
  document.getElementById('btn-settings-back').addEventListener('click', () => {
    navigate('home', 'btn-settings');
  });
  document.getElementById('btn-chat-back').addEventListener('click', () => {
    navigate('home', 'prompt-input');
    refreshSkins().then(render).catch(() => showStatus('Could not refresh saved skins. Retry local storage on Home.', 'error'));
  });

  // API Key (home)
  document.getElementById('btn-save-key').addEventListener('click', handleSaveKey);

  // Generate
  document.getElementById('btn-generate').addEventListener('click', handleGenerate);
  document.getElementById('btn-cancel-generate').addEventListener('click', handleCancelGenerate);
  document.getElementById('prompt-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  });

  // Active skin banner
  document.getElementById('btn-edit-skin').addEventListener('click', () => {
    if (state.activeSkin) openSkinChat(state.activeSkin);
  });
  document.getElementById('btn-remove-skin').addEventListener('click', handleRemoveSkin);

  // Chat
  document.getElementById('btn-chat-send').addEventListener('click', handleChatSend);
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleChatSend();
    }
  });

  // Save skin from chat
  document.getElementById('btn-save-skin').addEventListener('click', handleSaveSkinFromChat);
  document.getElementById('btn-publish-skin').addEventListener('click', handlePublishSkin);

  // Sort tabs
  document.getElementById('sort-hot').addEventListener('click', () => {
    state.communitySort = 'trending';
    loadCommunitySkins();
  });
  document.getElementById('sort-new').addEventListener('click', () => {
    state.communitySort = 'newest';
    loadCommunitySkins();
  });

  // Settings
  document.getElementById('btn-revoke-ai-access').addEventListener('click',async()=>{
    try {const result=await chrome.runtime.sendMessage({action:'revoke-ai-access'});
      if(result?.error)throw new Error('Revocation failed');
      showStatus('AI page access revoked and generation stopped. Next generation asks again.');
    }catch{showStatus('Could not revoke AI access. Try again.','error');}
  });
  document.getElementById('btn-settings-save-key').addEventListener('click', handleSettingsSaveKey);
  document.getElementById('btn-settings-remove-key').addEventListener('click',async()=>{
    try {
      const result=await chrome.runtime.sendMessage({action:'remove-api-key'});
      if(result?.error)throw new Error('Key removal failed');
      state.apiKey=null;state.apiKeySet=false;document.getElementById('api-key-input').value='';
      const input=document.getElementById('settings-api-key');input.value='';delete input.dataset.masked;
      render();showKeyStatus('settings-key-status','API key removed from this browser.','success');
    } catch {showKeyStatus('settings-key-status','Could not remove the key. Try again.','error');}
  });
  document.getElementById('settings-model').addEventListener('change', async (e) => {
    const select = e.target;
    select.disabled = true;
    try {await setModel(select.value);state.model = select.value;showStatus('Model saved for the next generation.');}
    catch {select.value = state.model;showStatus('Could not save the model. Previous choice retained. Try again.', 'error');}
    finally {select.disabled = false;}
  });
  const clearDialog = document.getElementById('clear-dialog');
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    clearDialog.showModal();document.getElementById('btn-clear-cancel').focus();
  });
  document.getElementById('btn-clear-cancel').addEventListener('click', () => clearDialog.close());
  document.getElementById('btn-clear-confirm').addEventListener('click', async () => {
    const button = document.getElementById('btn-clear-confirm');button.disabled = true;
    try {
      if (state.tabId) await sendToBackground({action: 'remove-skin', tabId: state.tabId, domain: state.domain});
      await clearAllData();
      await refreshSkins();
      clearDialog.close();
      render();
      showStatus('All skins cleared', 'warning');
    } catch {document.getElementById('clear-error').textContent = 'Could not finish clearing skins. Your saved data may still be present. Retry or cancel.';}
    finally {button.disabled = false;}
  });
  clearDialog.addEventListener('close', () => {document.getElementById('clear-error').textContent = '';document.getElementById('btn-clear-history').focus();});
  clearDialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const buttons = [...clearDialog.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0], last = buttons.at(-1);
    if ((!event.shiftKey && document.activeElement === last) || (event.shiftKey && document.activeElement === first)) {
      event.preventDefault();(event.shiftKey ? last : first).focus();
    }
  });
}

async function sendToBackground(message) {
  const response = await chrome.runtime.sendMessage(message);
  if (response?.error) throw new Error(response.error);
  return response;
}

// ===== Handlers =====

async function handleSaveKey() {
  const input = document.getElementById('api-key-input');
  const key = input.value.trim();

  if (!key) {
    showKeyStatus('api-key-status', 'Please enter an API key', 'error');
    return;
  }

  try {await setApiKey(key);}
  catch {showKeyStatus('api-key-status','Could not retain the key for this session. Try again.','error');return;}
  state.apiKey = key;
  state.apiKeySet = true;
  input.value = '';

  document.getElementById('api-key-section').classList.add('hidden');
  showStatus('API key ready for this Chrome session');
}

async function handleSettingsSaveKey() {
  const input = document.getElementById('settings-api-key');
  const raw = input.value.trim();

  if (!raw) {
    showKeyStatus('settings-key-status', 'Please enter an API key', 'error');
    return;
  }

  // Ignore if the user hasn't changed the masked placeholder
  if (raw === input.dataset.masked) return;

  try {await setApiKey(raw);}
  catch {showKeyStatus('settings-key-status','Could not retain the key for this session. Try again.','error');return;}
  state.apiKey = raw;
  state.apiKeySet = true;
  const masked = '••••••••';
  input.value = masked;
  input.dataset.masked = masked;
  showKeyStatus('settings-key-status', 'Key ready for this Chrome session.', 'success');
}

let lastGenerateTime = 0;

async function ensureAiConsent() {
  try {
  const context=await sendToBackground({action:'get-ai-consent',tabId:state.tabId});
  if(context.error){showStatus(context.error,'error');return false;}
  if(context.granted)return true;
  const included=context.mode==='included';
  const approved=confirm(`Allow AI styling on ${context.origin}?\n\n${included
    ? 'Free included Claude sends rendered page text/layout and your instruction through Nir’s shared Betterloop AI service to Anthropic Haiku 5.5. It makes one text-only request, with no screenshots or automatic reviews. Daily and shared budget limits apply; availability is not guaranteed. A random installation ID and a protected network identifier enforce limits.'
    : `Your Claude key sends rendered page text/layout, your instruction and up to four screenshots directly to Anthropic using ${state.model}. Up to five requests can be charged to your Anthropic account.`}\n\nPage captures may include private messages or other visible content, including content outside the viewport. Only proceed on pages you are comfortable sharing. You can revoke access in Settings.\n\nAllow this mode for this site?`);

  if(!approved)return false;
  const result=await chrome.runtime.sendMessage({action:'record-ai-consent',tabId:state.tabId});
  if(result.error){showStatus(result.error,'error');return false;}
  return true;
  } catch {showStatus('Could not contact WebSkins. Reopen the popup and try again. No AI request was started.', 'error');return false;}
}

async function handleGenerate() {
  const now = Date.now();
  if (now - lastGenerateTime < 1000) return;
  lastGenerateTime = now;

  if (state.isGenerating) return;
  if (!state.localReady) {showStatus('Retry local storage on Home before starting a generation.', 'error');return;}
  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) return;

  if (prompt.length > 2000) {
    showStatus('Prompt too long (max 2000 chars)', 'error');
    return;
  }

  if (state.aiMode==='byok'&&!state.apiKeySet) {
    document.getElementById('api-key-section').classList.remove('hidden');
    showKeyStatus('api-key-status', 'Please enter your API key first', 'error');
    return;
  }

  if(!await ensureAiConsent())return;
  state.isGenerating = true;
  state.generationCancelled = false;
  state.progressMessage = 'Designing your skin...';

  // Immediately switch to chat view with the user's prompt visible
  state.currentSkin = null;
  state.chatMessages = [
    { role: 'user', content: prompt, timestamp: Date.now() },
  ];
  state.view = 'chat';
  document.getElementById('prompt-input').value = '';
  render();

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generate-skin',
      tabId: state.tabId,
      prompt,
    });

    if (state.generationCancelled) return;
    if (response.error) throw new Error(response.error);

    state.isGenerating = false;
    state.currentSkin = response.skin;
    state.chatMessages = response.skin.chatHistory || [];

    await refreshSkins();
    render();

    showStatus('Skin generated!');
  } catch (err) {
    state.isGenerating = false;
    render();
    showStatus(err.message, 'error');
  }
}

function handleCancelGenerate() {
  state.generationCancelled = true;
  state.isGenerating = false;
  state.progressMessage = '';
  if (state.tabId) {
    chrome.runtime.sendMessage({ action: 'cancel-generation', tabId: state.tabId }).catch(() => {});
  }
  render();
  showStatus('Generation cancelled', 'warning');
}

async function handleChatSend() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message || state.isGenerating) return;

  if(!await ensureAiConsent())return;

  // Add user message
  state.chatMessages.push({
    role: 'user',
    content: message,
    timestamp: Date.now(),
  });

  input.value = '';
  state.isGenerating = true;
  state.progressMessage = 'Refining...';
  render();

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'chat-refine',
      tabId: state.tabId,
      skinId: state.currentSkin?.id,
      domain: state.domain,
      message,
      chatHistory: state.chatMessages,
    });

    if (response.error) throw new Error(response.error);

    // Add assistant response
    state.chatMessages.push({
      role: 'assistant',
      content: response.skinData.description,
      timestamp: Date.now(),
      skinData: response.skinData,
    });

    // Update current skin and auto-save
    if (state.currentSkin) {
      state.currentSkin.css = response.skinData.css;
      state.currentSkin.name = response.skinData.name || state.currentSkin.name;
      state.currentSkin.chatHistory = [...state.chatMessages];
      state.currentSkin.updatedAt = Date.now();

      // Auto-save so closing popup doesn't lose work (don't auto-activate)
      await sendToBackground({
        action: 'save-skin',
        domain: state.domain,
        skin: state.currentSkin,
        activate: false,
      });
    }

    state.isGenerating = false;
    render();
  } catch (err) {
    state.isGenerating = false;
    render();
    showStatus(err.message, 'error');
  }
}

async function handleApplySkin(skin) {
  try {
    await sendToBackground({
      action: 'apply-skin',
      tabId: state.tabId,
      domain: state.domain,
      skinId: skin.id,
      css: skin.css,
    });
    await refreshSkins();
    render();
    showStatus(`Applied "${skin.name}"`);
  } catch (err) {
    showStatus(err.message, 'error');
  }
}

async function handleRemoveSkin() {
  try {
    await sendToBackground({
      action: 'remove-skin',
      tabId: state.tabId,
      domain: state.domain,
    });
    await refreshSkins();
    render();
    showStatus('Skin removed');
  } catch (err) {
    showStatus(err.message, 'error');
  }
}

async function handleSaveSkinFromChat() {
  if (!state.currentSkin) return;

  state.currentSkin.chatHistory = [...state.chatMessages];
  state.currentSkin.updatedAt = Date.now();

  try {
    await sendToBackground({
      action: 'save-skin',
      domain: state.domain,
      skin: state.currentSkin,
      activate: true,
    });
    showStatus('Skin saved!');
  } catch (err) {
    showStatus(err.message, 'error');
  }
}

function openSkinChat(skin) {
  state.currentSkin = skin;
  state.chatMessages = skin.chatHistory || [
    { role: 'system', content: `Skin "${skin.name}" loaded`, timestamp: skin.createdAt },
  ];
  state.view = 'chat';
  render();
  document.getElementById('chat-input').focus();
}

function handleProgress(data) {
  state.progressMessage = data.message || '';
  document.getElementById('ai-mode').value=state.aiMode;
  document.getElementById('ai-mode').disabled=state.isGenerating;
  document.getElementById('settings-ai-mode').value=state.aiMode;
  document.getElementById('settings-ai-mode').disabled=state.isGenerating;
  if (state.view === 'home') renderHome();
  if (state.view === 'chat') renderChat();
}

// ===== Community / Marketplace =====

let communityRequest = 0;
async function loadCommunitySkins() {
  const request = ++communityRequest;
  state.communityLoading = true;
  state.communityError = false;
  renderCommunity();
  try {
  const data = await fetchSkinsByDomain(state.domain, 1, state.communitySort);
  // Also fetch global trending if domain-specific is empty
  if (!data.skins?.length) {
    const global = await fetchTrendingSkins(null, state.communitySort);
    if (request !== communityRequest) return;
    state.communitySkins = global.skins || [];
  } else {
    if (request !== communityRequest) return;
    state.communitySkins = data.skins || [];
  }
  } catch {
    if (request !== communityRequest) return;
    state.communityError = true;
  }
  if (request !== communityRequest) return;
  state.communityLoading = false;
  renderCommunity();
}

function renderCommunity() {
  const list = document.getElementById('community-list');

  // Update sort tab styling
  const hotTab = document.getElementById('sort-hot');
  const newTab = document.getElementById('sort-new');
  if (hotTab && newTab) {
    hotTab.classList.toggle('sort-tab-active', state.communitySort === 'trending');
    hotTab.classList.toggle('text-on-surface-variant', state.communitySort !== 'trending');
    newTab.classList.toggle('sort-tab-active', state.communitySort === 'newest');
    newTab.classList.toggle('text-on-surface-variant', state.communitySort !== 'newest');
    hotTab.setAttribute('aria-pressed', String(state.communitySort === 'trending'));
    newTab.setAttribute('aria-pressed', String(state.communitySort === 'newest'));
  }

  list.setAttribute('aria-busy', String(state.communityLoading));
  if (state.communityLoading) {
    list.innerHTML = '<p class="text-xs text-on-surface-variant py-4" role="status">Loading community skins…</p>';
    return;
  }
  if (state.communityError) {
    list.innerHTML = '<p class="text-xs text-error py-2" role="status">Community could not load. Your saved skins are still on this device.</p><button id="btn-retry-community" class="retry-button">Retry community</button>';
    document.getElementById('btn-retry-community').addEventListener('click', loadCommunitySkins);
    return;
  }

  if (!state.communitySkins.length) {
    list.innerHTML = '<p class="text-xs text-on-surface-variant py-4" role="status">No community skins yet. You can create a private skin above.</p>';
    return;
  }

  list.innerHTML = '';
  for (const skin of state.communitySkins.slice(0, 10)) {
    const isVoted = state.votedSkins.has(skin.id);
    const card = document.createElement('div');
    card.className = 'flex gap-3 p-2 rounded-2xl bg-surface-container-lowest shadow-[0_4px_20px_rgba(44,47,49,0.04)] hover:shadow-md transition-shadow';
    card.innerHTML = `
      <div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
        <div class="absolute inset-0 ${getGradient(skin.name)}"></div>
      </div>
      <div class="flex-grow flex flex-col justify-center min-w-0">
        <h3 class="font-bold text-[11px] truncate">${escapeHtml(skin.name)}</h3>
        <p class="text-[9px] text-on-surface-variant mb-1.5">by @${escapeHtml(skin.authorName)}</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <button class="community-like flex items-center gap-0.5 hover:opacity-70 transition-opacity" aria-label="Like ${escapeHtml(skin.name)}" aria-pressed="${isVoted}" ${isVoted ? 'disabled' : ''}>
              <span aria-hidden="true" class="${isVoted ? 'voted' : 'text-tertiary'}">♥</span>
              <span class="text-[8px] font-bold text-on-surface-variant">${formatCount(skin.likes)}</span>
            </button>
            <span class="text-[8px] text-on-surface-variant">${formatCount(skin.installs)} installs</span>
          </div>
          <button class="community-install bg-secondary-container text-on-secondary-container text-xs font-extrabold px-2.5 py-1.5 rounded-full active:scale-95 transition-transform" aria-label="Install ${escapeHtml(skin.name)}">INSTALL</button>
        </div>
      </div>
    `;

    card.querySelector('.community-install').addEventListener('click', async (e) => {
      e.stopPropagation();
      await handleInstallCommunity(skin.id);
    });

    card.querySelector('.community-like').addEventListener('click', async (e) => {
      e.stopPropagation();
      await handleVoteSkin(skin.id);
    });

    list.appendChild(card);
  }
}

async function handleInstallCommunity(skinId) {
  try {
    const data = await apiInstallSkin(skinId);
    // Save to local storage and apply
    const skin = {
      id: data.id + '_community',
      name: data.name,
      css: data.css,
      domain: data.domain || state.domain,
      prompt: '',
      description: 'Installed from marketplace',
      chatHistory: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveSkin(state.domain, skin);

    // Apply it
    await sendToBackground({
      action: 'apply-skin',
      tabId: state.tabId,
      domain: state.domain,
      skinId: skin.id,
      css: skin.css,
    });

    await refreshSkins();
    render();
    showStatus(`Installed "${data.name}"`);
  } catch (err) {
    showStatus('Failed to install', 'error');
  }
}

async function handleVoteSkin(skinId) {
  if (state.votedSkins.has(skinId)) return; // Already voted

  try {
    await apiLikeSkin(skinId);
    state.votedSkins.add(skinId);
    // Update count locally
    const skin = state.communitySkins.find(s => s.id === skinId);
    if (skin) skin.likes++;
    renderCommunity();
    try {await chrome.storage.local.set({ webskins_voted: [...state.votedSkins] });}
    catch {showStatus('Like recorded, but this device could not remember it. Do not vote again.', 'warning');}
  } catch {
    showStatus('Could not record the like. Try again.', 'error');
  }
}

async function handlePublishSkin() {
  if (!state.currentSkin) return;

  if(!confirm('Publish this skin publicly? Its CSS, prompt, site name and your display name will be visible to everyone. Do not publish private page details.'))return;
  const authorName = prompt('Your display name for the marketplace:');
  if (!authorName) return;

  try {
    const authorId = await getAuthorId();
    await apiPublishSkin({
      name: state.currentSkin.name,
      description: state.currentSkin.description || state.currentSkin.prompt,
      css: state.currentSkin.css,
      domain: state.domain,
      prompt: state.currentSkin.prompt,
      authorName,
      authorId,
    });
    showStatus('Published to marketplace!');
  } catch (err) {
    showStatus(err.message, 'error');
  }
}

function formatCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

// ===== UI Helpers =====

let statusTimer;
function showStatus(message, type = 'success') {
  const bar = document.getElementById('status-bar');
  const text = document.getElementById('status-text');
  text.textContent = message || 'Unknown error';
  bar.classList.toggle('feedback-error', type === 'error');
  bar.classList.remove('hidden');
  clearTimeout(statusTimer);
  if (type === 'success') statusTimer = setTimeout(() => bar.classList.add('hidden'), 4500);
}

function showKeyStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  el.textContent = message;
  el.className = `text-[10px] mt-1.5 px-1 ${type === 'error' ? 'text-error' : type === 'success' ? 'text-primary' : 'text-on-surface-variant'}`;
  el.classList.remove('hidden');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML.replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function getGradient(name) {
  // Generate a consistent gradient from the skin name
  const gradients = [
    'bg-gradient-to-tr from-indigo-500 via-purple-400 to-pink-300',
    'bg-gradient-to-br from-emerald-400 to-cyan-500',
    'bg-gradient-to-bl from-orange-400 to-rose-500',
    'bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600',
    'bg-gradient-to-tr from-yellow-200 to-orange-400',
    'bg-gradient-to-br from-slate-700 to-slate-900',
    'bg-gradient-to-r from-pink-400 to-violet-500',
    'bg-gradient-to-bl from-teal-400 to-blue-500',
  ];

  let hash = 0;
  for (const ch of name) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return gradients[Math.abs(hash) % gradients.length];
}
