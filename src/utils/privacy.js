const CONSENTS='webskins_ai_consents_v1';
export async function aiConsent(tabId) {
  const tab=await chrome.tabs.get(tabId),url=new URL(tab.url);
  if(!['http:','https:'].includes(url.protocol))throw new Error('AI generation works on regular web pages only');
  const saved=await chrome.storage.local.get(CONSENTS);
  return {origin:url.origin,url:tab.url,granted:saved[CONSENTS]?.[url.origin]===true};
}
export async function recordAiConsent(tabId) {
  const context=await aiConsent(tabId),saved=await chrome.storage.local.get(CONSENTS);
  await chrome.storage.local.set({[CONSENTS]:{...(saved[CONSENTS]??{}),[context.origin]:true}});
  return {granted:true,origin:context.origin};
}
export async function requireAiConsent(tabId) {
  const context=await aiConsent(tabId);
  if(!context.granted)throw new Error('Allow sharing this site with Anthropic before generating');
  return context;
}
export async function revokeAiConsent(){await chrome.storage.local.remove(CONSENTS);}
