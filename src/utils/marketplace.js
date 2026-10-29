// Marketplace API client for WebSkins

const API_BASE = 'https://webskins-api-production.up.railway.app';

function getBaseUrl() {
  return API_BASE;
}

export async function fetchTrendingSkins(domain, sort = 'trending') {
  const params = new URLSearchParams({ sort, limit: '10' });
  if (domain) params.set('domain', domain);

  const res = await fetch(`${getBaseUrl()}/api/skins?${params}`, {signal: AbortSignal.timeout(10000)});
  return readSkinList(res);
}

export async function fetchSkinsByDomain(domain, page = 1, sort = 'trending') {
  const params = new URLSearchParams({ domain, page: String(page), limit: '20', sort });
  const res = await fetch(`${getBaseUrl()}/api/skins?${params}`, {signal: AbortSignal.timeout(10000)});
  return readSkinList(res);
}

async function readSkinList(res) {
  if (!res.ok) throw new Error('Community is unavailable. Your saved skins are still on this device.');
  const data = await res.json();
  if (!Array.isArray(data.skins)) throw new Error('Community returned an unreadable list.');
  return data;
}

export async function getSkinDetails(id) {
  const res = await fetch(`${getBaseUrl()}/api/skins/${id}`);
  if (!res.ok) throw new Error('Skin not found');
  return res.json();
}

export async function publishSkin({ name, description, css, domain, prompt, authorName, authorId, thumbnail }) {
  const token=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
  const nonce=crypto.randomUUID();
  const before=await chrome.storage.local.get('webskins_pending_publications');
  const pending={...(before.webskins_pending_publications??{}),[nonce]:{key:token,name,domain,at:Date.now()}};
  // Retain the private key before making the publication irreversible on the server.
  await chrome.storage.local.set({webskins_pending_publications:pending});
  const res = await fetch(`${getBaseUrl()}/api/skins`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json',Authorization:`Bearer ${token}`,'X-WebSkins-Key-Storage':'1' },
    body: JSON.stringify({ name, description, css, domain, prompt, authorName, authorId, thumbnail }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to publish');
  }

  const skin=await res.json();
  const stored=await chrome.storage.local.get(['webskins_management_keys','webskins_pending_publications']);
  const remaining={...(stored.webskins_pending_publications??{})};delete remaining[nonce];
  await chrome.storage.local.set({webskins_management_keys:{...(stored.webskins_management_keys??{}),[skin.id]:token},webskins_pending_publications:remaining});
  return skin;
}

export async function installSkin(id) {
  const res = await fetch(`${getBaseUrl()}/api/skins/${id}/install`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to install');
  return res.json();
}

export async function likeSkin(id) {
  const res = await fetch(`${getBaseUrl()}/api/skins/${id}/like`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to like');
  return res.json();
}

export async function deleteSkin(id) {
  const stored=await chrome.storage.local.get('webskins_management_keys');
  const token=stored.webskins_management_keys?.[id];
  if(!token) throw new Error('This installation has no private management key for that skin');
  const res = await fetch(`${getBaseUrl()}/api/skins/${id}`, {
    method: 'DELETE',
    headers: {Authorization:`Bearer ${token}`},
  });
  if (!res.ok) throw new Error('Failed to delete');
  return res.json();
}

// Get or create anonymous author ID
export async function getAuthorId() {
  const result = await chrome.storage.local.get('webskins_author_id');
  if (result.webskins_author_id) return result.webskins_author_id;

  const id = crypto.randomUUID();
  await chrome.storage.local.set({ webskins_author_id: id });
  return id;
}
