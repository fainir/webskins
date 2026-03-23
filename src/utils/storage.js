// Chrome storage wrapper for WebSkins

const KEYS = {
  API_KEY: 'webskins_api_key',
  MODEL: 'webskins_model',
  CYCLES: 'webskins_cycles',
  SKINS: 'webskins_skins',
  ACTIVE_SKINS: 'webskins_active',
};

export async function getApiKey() {
  const result = await chrome.storage.local.get(KEYS.API_KEY);
  return result[KEYS.API_KEY] || null;
}

export async function setApiKey(key) {
  await chrome.storage.local.set({ [KEYS.API_KEY]: key });
}

export async function getModel() {
  const result = await chrome.storage.local.get(KEYS.MODEL);
  return result[KEYS.MODEL] || 'claude-opus-4-20250514';
}

export async function setModel(model) {
  await chrome.storage.local.set({ [KEYS.MODEL]: model });
}

export async function getCycles() {
  const result = await chrome.storage.local.get(KEYS.CYCLES);
  return result[KEYS.CYCLES] || 3;
}

export async function setCycles(cycles) {
  await chrome.storage.local.set({ [KEYS.CYCLES]: cycles });
}

// Skins stored as: { [domain]: [{ id, name, css, prompt, chatHistory, createdAt }] }
export async function getAllSkins() {
  const result = await chrome.storage.local.get(KEYS.SKINS);
  return result[KEYS.SKINS] || {};
}

export async function getSkinsForDomain(domain) {
  const all = await getAllSkins();
  return all[domain] || [];
}

export async function saveSkin(domain, skin) {
  const all = await getAllSkins();
  if (!all[domain]) all[domain] = [];

  const existing = all[domain].findIndex(s => s.id === skin.id);
  if (existing >= 0) {
    all[domain][existing] = skin;
  } else {
    all[domain].unshift(skin);
  }

  await chrome.storage.local.set({ [KEYS.SKINS]: all });
}

export async function deleteSkin(domain, skinId) {
  const all = await getAllSkins();
  if (all[domain]) {
    all[domain] = all[domain].filter(s => s.id !== skinId);
    if (all[domain].length === 0) delete all[domain];
  }
  await chrome.storage.local.set({ [KEYS.SKINS]: all });
}

// Active skins: { [domain]: skinId }
export async function getActiveSkin(domain) {
  const result = await chrome.storage.local.get(KEYS.ACTIVE_SKINS);
  const active = result[KEYS.ACTIVE_SKINS] || {};
  if (!active[domain]) return null;

  const skins = await getSkinsForDomain(domain);
  return skins.find(s => s.id === active[domain]) || null;
}

export async function setActiveSkin(domain, skinId) {
  const result = await chrome.storage.local.get(KEYS.ACTIVE_SKINS);
  const active = result[KEYS.ACTIVE_SKINS] || {};
  if (skinId) {
    active[domain] = skinId;
  } else {
    delete active[domain];
  }
  await chrome.storage.local.set({ [KEYS.ACTIVE_SKINS]: active });
}

export async function clearAllData() {
  await chrome.storage.local.remove([KEYS.SKINS, KEYS.ACTIVE_SKINS]);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
