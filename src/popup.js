// WebSkins Popup — State Management & UI
import {
  getApiKey, setApiKey, getModel, setModel,
  getSkinsForDomain,
  setActiveSkin, deleteSkin, clearAllData, saveSkin,
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
  apiKey: null,
  apiKeySet: false,
  model: 'claude-opus-4-20250514',
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
};

// ===== Init =====

document.addEventListener('DOMContentLoaded', async () => {
  // Get current tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    state.tabId = tab.id;
    try {
      const url = new URL(tab.url);
      state.domain = url.hostname;
    } catch {
      state.domain = 'unknown';
    }
  }

  // Load settings
  state.apiKey = await getApiKey();
  state.apiKeySet = !!state.apiKey;
  state.model = await getModel();


  // Load skins for current domain
  await refreshSkins();

  // Setup UI
  setupEventListeners();
  render();

  // If API key exists, hide the section on home and show status
  if (state.apiKeySet) {
    const section = document.getElementById('api-key-section');
    section.classList.add('hidden');
  }

  // Load voted skins from storage
  const votedResult = await chrome.storage.local.get('webskins_voted');
  state.votedSkins = new Set(votedResult.webskins_voted || []);

  // Fetch community skins (non-blocking)
  loadCommunitySkins();

  // Listen for progress updates from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'generation-progress' && msg.tabId === state.tabId) {
      handleProgress(msg);
    }
  });
});

async function refreshSkins() {
  state.skins = await getSkinsForDomain(state.domain);

  // Check for active skin
  const activeResult = await chrome.storage.local.get('webskins_active');
  const activeMap = activeResult.webskins_active || {};
  const activeSkinId = activeMap[state.domain];

  if (activeSkinId) {
    state.activeSkin = state.skins.find(s => s.id === activeSkinId) || null;
  } else {
    state.activeSkin = null;
  }
}

// ===== Render =====

function render() {
  const homeView = document.getElementById('home-view');
  const chatView = document.getElementById('chat-view');
  const settingsView = document.getElementById('settings-view');

  homeView.classList.toggle('hidden', state.view !== 'home');
  chatView.classList.toggle('hidden', state.view !== 'chat');
  settingsView.classList.toggle('hidden', state.view !== 'settings');

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
  btn.disabled = state.isGenerating;

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
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  list.innerHTML = '';

  for (const skin of state.skins) {
    const isActive = state.activeSkin?.id === skin.id;
    const card = document.createElement('div');
    card.className = 'min-w-[120px] snap-start group skin-card cursor-pointer';
    card.innerHTML = `
      <div class="h-20 w-full rounded-xl mb-1.5 overflow-hidden relative shadow-sm ${isActive ? 'ring-2 ring-primary' : ''}">
        <div class="absolute inset-0 ${getGradient(skin.name)}"></div>
        <div class="skin-card-overlay absolute inset-0 flex items-center justify-center opacity-0 transition-opacity bg-on-background/10 backdrop-blur-sm">
          ${isActive
      ? '<button class="skin-remove-btn bg-white text-error text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-lg">REMOVE</button>'
      : '<button class="skin-apply-btn bg-white text-primary text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-lg">APPLY</button>'
    }
        </div>
      </div>
      <p class="text-[10px] font-bold truncate">${escapeHtml(skin.name)}</p>
      <p class="text-[8px] text-on-surface-variant font-medium">${timeAgo(skin.createdAt)}</p>
    `;

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
      openSkinChat(skin);
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
}

function renderSettings() {
  const keyInput = document.getElementById('settings-api-key');
  const modelSelect = document.getElementById('settings-model');

  if (state.apiKey) {
    const masked = state.apiKey.substring(0, 12) + '...';
    keyInput.value = masked;
    keyInput.dataset.masked = masked;
  }
  modelSelect.value = state.model;
}

// ===== Event Listeners =====

function setupEventListeners() {
  // Navigation
  document.getElementById('btn-settings').addEventListener('click', () => {
    state.view = 'settings';
    render();
  });
  document.getElementById('btn-settings-back').addEventListener('click', () => {
    state.view = 'home';
    render();
  });
  document.getElementById('btn-chat-back').addEventListener('click', () => {
    state.view = 'home';
    refreshSkins().then(render);
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
  document.getElementById('btn-settings-save-key').addEventListener('click', handleSettingsSaveKey);
  document.getElementById('settings-model').addEventListener('change', async (e) => {
    state.model = e.target.value;
    await setModel(state.model);
  });
  document.getElementById('btn-clear-history').addEventListener('click', async () => {
    if (confirm('Clear all skins? This cannot be undone.')) {
      await clearAllData();
      if (state.tabId) {
        chrome.runtime.sendMessage({ action: 'remove-skin', tabId: state.tabId, domain: state.domain });
      }
      await refreshSkins();
      render();
      showStatus('All skins cleared', 'warning');
    }
  });
}

// ===== Handlers =====

async function handleSaveKey() {
  const input = document.getElementById('api-key-input');
  const key = input.value.trim();

  if (!key) {
    showKeyStatus('api-key-status', 'Please enter an API key', 'error');
    return;
  }

  await setApiKey(key);
  state.apiKey = key;
  state.apiKeySet = true;
  input.value = '';

  document.getElementById('api-key-section').classList.add('hidden');
  showStatus('API key saved');
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

  await setApiKey(raw);
  state.apiKey = raw;
  state.apiKeySet = true;
  const masked = raw.substring(0, 12) + '...';
  input.value = masked;
  input.dataset.masked = masked;
  showKeyStatus('settings-key-status', 'Key saved!', 'success');
}

let lastGenerateTime = 0;

async function handleGenerate() {
  const now = Date.now();
  if (now - lastGenerateTime < 1000) return;
  lastGenerateTime = now;

  if (state.isGenerating) return;
  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) return;

  if (prompt.length > 2000) {
    showStatus('Prompt too long (max 2000 chars)', 'error');
    return;
  }

  if (!state.apiKeySet) {
    document.getElementById('api-key-section').classList.remove('hidden');
    showKeyStatus('api-key-status', 'Please enter your API key first', 'error');
    return;
  }

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
      chrome.runtime.sendMessage({
        action: 'save-skin',
        domain: state.domain,
        skin: state.currentSkin,
        activate: false,
      }).catch(() => {});
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
    await chrome.runtime.sendMessage({
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
    await chrome.runtime.sendMessage({
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
    await chrome.runtime.sendMessage({
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
}

function handleProgress(data) {
  state.progressMessage = data.message || '';
  if (state.view === 'home') renderHome();
  if (state.view === 'chat') renderChat();
}

// ===== Community / Marketplace =====

async function loadCommunitySkins() {
  const data = await fetchSkinsByDomain(state.domain, 1, state.communitySort);
  // Also fetch global trending if domain-specific is empty
  if (!data.skins?.length) {
    const global = await fetchTrendingSkins(null, state.communitySort);
    state.communitySkins = global.skins || [];
  } else {
    state.communitySkins = data.skins || [];
  }
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
  }

  if (!state.communitySkins.length) {
    list.innerHTML = '<p class="text-[10px] text-on-surface-variant text-center py-6">No skins yet — be the first to publish!</p>';
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
            <button class="community-like flex items-center gap-0.5 hover:opacity-70 transition-opacity" data-id="${skin.id}">
              <span class="material-symbols-outlined text-[10px] ${isVoted ? 'voted' : 'text-tertiary'}" style="font-variation-settings: 'FILL' 1;">favorite</span>
              <span class="text-[8px] font-bold text-on-surface-variant">${formatCount(skin.likes)}</span>
            </button>
            <span class="text-[8px] text-on-surface-variant">${formatCount(skin.installs)} installs</span>
          </div>
          <button class="community-install bg-secondary-container text-on-secondary-container text-[9px] font-extrabold px-2.5 py-0.5 rounded-full active:scale-95 transition-transform" data-id="${skin.id}">INSTALL</button>
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
    await chrome.runtime.sendMessage({
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
    await chrome.storage.local.set({ webskins_voted: [...state.votedSkins] });

    // Update count locally
    const skin = state.communitySkins.find(s => s.id === skinId);
    if (skin) skin.likes++;
    renderCommunity();
  } catch {
    // Silently fail
  }
}

async function handlePublishSkin() {
  if (!state.currentSkin) return;

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

function showStatus(message, type = 'success') {
  const bar = document.getElementById('status-bar');
  const text = document.getElementById('status-text');
  const dot = document.getElementById('status-dot');

  text.textContent = (message || 'Unknown error').toUpperCase();
  dot.className = `w-1.5 h-1.5 rounded-full ${type === 'error' ? 'bg-red-400' : type === 'warning' ? 'bg-yellow-400' : 'bg-emerald-400'}`;

  bar.classList.add('status-visible');
  setTimeout(() => bar.classList.remove('status-visible'), 2500);
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
  return div.innerHTML;
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
