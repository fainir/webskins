// Chrome storage wrapper for WebSkins

const KEYS = {
  API_KEY: 'webskins_api_key',
  MODEL: 'webskins_model',
  CYCLES: 'webskins_cycles',
  SKINS: 'webskins_skins',
  ACTIVE_SKINS: 'webskins_active',
};

export async function getApiKey() {
  const session = keySession();
  const current = (await session.get(KEYS.API_KEY))[KEYS.API_KEY];
  const legacy = (await chrome.storage.local.get(KEYS.API_KEY))[KEYS.API_KEY];
  if (legacy) {
    await setApiKey(legacy);
    return legacy;
  }
  return current || null;
}

function keySession() {
  if (!chrome.storage.session) throw new Error('Update Chrome to use session-only API key storage');
  return chrome.storage.session;
}

export async function setApiKey(key) {
  const session = keySession();
  if (typeof key !== 'string' || !key.trim()) throw new Error('Enter an API key');
  await session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'});
  await session.set({ [KEYS.API_KEY]: key.trim() });
  if ((await session.get(KEYS.API_KEY))[KEYS.API_KEY] !== key.trim()) {
    throw new Error('API key could not be retained for this browser session; existing local settings were preserved');
  }
  // Delete a legacy plaintext key only after the session copy is verified.
  await chrome.storage.local.remove(KEYS.API_KEY);
}

export async function removeApiKey() {
  await keySession().remove(KEYS.API_KEY);
  await chrome.storage.local.remove(KEYS.API_KEY);
}

// Models the settings menu offers. A saved model that is no longer offered
// (Claude Opus 4 and Sonnet 4 were retired) falls back to the default.
export const MODELS = ['claude-sonnet-5-5', 'claude-opus-5-5'];
export const DEFAULT_MODEL = MODELS[0];
export const normalizeModel = model => MODELS.includes(model) ? model : DEFAULT_MODEL;

export async function getModel() {
  const result = await chrome.storage.local.get(KEYS.MODEL);
  return normalizeModel(result[KEYS.MODEL]);
}

export async function setModel(model) {
  await chrome.storage.local.set({ [KEYS.MODEL]: normalizeModel(model) });
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

// Included allowance is independent of a visitor's optional provider key.
export async function getAiMode() {
  const value=(await chrome.storage.local.get('webskins_ai_mode')).webskins_ai_mode;
  return value==='byok'?'byok':'included';
}
export async function setAiMode(mode) {
  if(!['included','byok'].includes(mode))throw new Error('Choose an AI mode');
  await chrome.storage.local.set({webskins_ai_mode:mode});
}
export async function getAiActor() {
  const key='webskins_ai_actor';
  const saved=(await chrome.storage.local.get(key))[key];
  if(typeof saved==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(saved))return saved;
  const actor=crypto.randomUUID();
  await chrome.storage.local.set({[key]:actor});
  return actor;
}
