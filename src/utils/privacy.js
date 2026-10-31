import {getAiMode} from './storage.js';
const CONSENTS='webskins_ai_consents_v3';
const LEGACY_CONSENTS='webskins_ai_consents_v1';
export async function aiConsent(tabId) {
  const tab=await chrome.tabs.get(tabId),url=new URL(tab.url);
  if(!['http:','https:'].includes(url.protocol))throw new Error('AI generation works on regular web pages only');
  const mode=await getAiMode(),saved=await chrome.storage.local.get(CONSENTS);
  return {origin:url.origin,url:tab.url,mode,granted:saved[CONSENTS]?.[url.origin+'|'+mode]===true};
}
export async function recordAiConsent(tabId) {
  const context=await aiConsent(tabId),saved=await chrome.storage.local.get(CONSENTS);
  await chrome.storage.local.set({[CONSENTS]:{...(saved[CONSENTS]??{}),[context.origin+'|'+context.mode]:true}});
  await chrome.storage.local.remove([LEGACY_CONSENTS,'webskins_ai_consents_v2']);
  return {granted:true,origin:context.origin};
}
export async function requireAiConsent(tabId) {
  const context=await aiConsent(tabId);
  if(!context.granted)throw new Error('Allow sharing this site with Anthropic before generating');
  return context;
}
export async function revokeAiConsent(){await chrome.storage.local.remove([CONSENTS,LEGACY_CONSENTS,'webskins_ai_consents_v2']);}
