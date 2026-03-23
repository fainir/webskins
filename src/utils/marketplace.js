// Marketplace API client for WebSkins

const API_BASE = 'https://webskins-api-production.up.railway.app';

function getBaseUrl() {
  return API_BASE;
}

export async function fetchTrendingSkins(domain, sort = 'trending') {
  try {
    const params = new URLSearchParams({ sort, limit: '10' });
    if (domain) params.set('domain', domain);

    const res = await fetch(`${getBaseUrl()}/api/skins?${params}`);
    if (!res.ok) return { skins: [], pagination: {} };

    return res.json();
  } catch {
    return { skins: [], pagination: {} };
  }
}

export async function fetchSkinsByDomain(domain, page = 1, sort = 'trending') {
  try {
    const params = new URLSearchParams({ domain, page: String(page), limit: '20', sort });
    const res = await fetch(`${getBaseUrl()}/api/skins?${params}`);
    if (!res.ok) return { skins: [], pagination: {} };

    return res.json();
  } catch {
    return { skins: [], pagination: {} };
  }
}

export async function searchSkins(query, page = 1) {
  try {
    const params = new URLSearchParams({ search: query, page: String(page), limit: '20' });
    const res = await fetch(`${getBaseUrl()}/api/skins?${params}`);
    if (!res.ok) return { skins: [], pagination: {} };

    return res.json();
  } catch {
    return { skins: [], pagination: {} };
  }
}

export async function getSkinDetails(id) {
  const res = await fetch(`${getBaseUrl()}/api/skins/${id}`);
  if (!res.ok) throw new Error('Skin not found');
  return res.json();
}

export async function publishSkin({ name, description, css, domain, prompt, authorName, authorId, thumbnail }) {
  const res = await fetch(`${getBaseUrl()}/api/skins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, css, domain, prompt, authorName, authorId, thumbnail }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to publish');
  }

  return res.json();
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

export async function deleteSkin(id, authorId) {
  const res = await fetch(`${getBaseUrl()}/api/skins/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authorId }),
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
