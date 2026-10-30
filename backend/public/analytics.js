// Optional website analytics. Only public, explicitly listed pages are measured.
(() => {
  'use strict';
  const APP = { name: "WebSkins website", key: "webskins.website.analytics.v1", paths: ["/"], events: ["store_opened", "privacy_opened"] };
  if (window.PortfolioAnalytics || !APP.paths.includes(location.pathname)) return;
  const CONFIG_URL = '/analytics-config.json';
  const choiceEvent = APP.key + ':changed';
  let suspended = false, failedChoice = false;
  const sensitiveEntry = APP.sensitiveQueries?.some(key => new URLSearchParams(location.search).has(key)) || false;
  const publicSurface = () => !sensitiveEntry && APP.paths.includes(location.pathname) && (!APP.publicHashes || APP.publicHashes.includes(location.hash));
  const optedOut = () => navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  const read = () => { try { return localStorage.getItem(APP.key) === 'allowed'; } catch { return false; } };
  const allowed = () => read() && !optedOut() && !suspended && !failedChoice && publicSurface();
  const page = () => ({ page_location: location.origin + location.pathname, page_title: APP.name, page_referrer: '' });
  let config = {}, configReady = false, generation = 0, active = false, gaStarted = false, betterloopStarted = false, device = '';
  const requests = new Set();
  let dialog, status, trigger, gaScript, betterloopScript;
  const removeIdentifiers = () => {
    device = '';
    try { localStorage.removeItem(APP.key + ':device'); } catch { /* Remains off in memory. */ }
    try { sessionStorage.removeItem('_fp_sid'); } catch { /* Storage may be blocked. */ }
    const domains = ['', location.hostname, '.' + location.hostname];
    const parts = location.hostname.split('.'); if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    for (const value of document.cookie.split(';')) {
      const name = value.trim().split('=')[0];
      if (!/^(_ga(?:_|$)|_fp_sid$)/.test(name)) continue;
      for (const domain of domains) document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax' + (domain ? '; Domain=' + domain : '');
    }
  };
  const stop = () => {
    generation++; active = false;
    if (config.gaId) window['ga-disable-' + config.gaId] = true;
    try { window.Betterloop?.shutdown?.({ discard: true }); } catch { /* Analytics cannot break the product. */ }
    betterloopStarted = false;
    for (const request of requests) request.abort(); requests.clear();
    // A late vendor script may finish downloading; its callback checks the generation.
    gaScript?.remove(); betterloopScript?.remove(); gaScript = betterloopScript = null;
    if (window.dataLayer) window.dataLayer.length = 0;
    removeIdentifiers(); updateStatus();
  };
  const fixedEvent = name => typeof name === 'string' && APP.events.includes(name);
  const mixpanel = name => {
    if (!active || !allowed() || !config.mixpanelToken) return;
    if (!device) {
      try {
        device = localStorage.getItem(APP.key + ':device') || crypto.randomUUID();
        localStorage.setItem(APP.key + ':device', device);
      } catch { device = ''; return; }
    }
    const body = new URLSearchParams({ data: JSON.stringify({ event: name, properties: { token: config.mixpanelToken, distinct_id: device, path: location.pathname, product: APP.name, $current_url: location.origin + location.pathname, $referrer: '', $ip: '0' } }), ip: '0' });
    const controller = new AbortController(); requests.add(controller);
    fetch('https://api.mixpanel.com/track?ip=0', { method: 'POST', body, credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal }).catch(() => {}).finally(() => requests.delete(controller));
  };
  const track = name => {
    if (!active || !allowed() || !fixedEvent(name)) return;
    try { if (config.gaId) window.gtag?.('event', name, page()); } catch { /* Optional. */ }
    mixpanel(name);
    try { if (betterloopStarted) window.Betterloop?.track?.(name); } catch { /* Optional. */ }
  };
  function updateStatus() {
    if (!status) return;
    const open = document.getElementById('portfolio-analytics-open'); if (open) open.hidden = suspended || !publicSurface();
    if ((suspended || !publicSurface()) && dialog?.open) dialog.close();
    status.textContent = optedOut() ? 'Analytics is off because this browser sends a privacy preference.' : active ? 'Optional analytics is on for this browser.' : 'Optional analytics is off for this browser.';
    const allow = dialog?.querySelector('[data-analytics-allow]'); if (allow) allow.disabled = optedOut();
  }
  function start() {
    if (!allowed()) { stop(); return; }
    if (active || !configReady || !Object.values(config).some(Boolean)) return;
    active = true; const current = ++generation; updateStatus();
    if (config.gaId) {
      window['ga-disable-' + config.gaId] = false;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      window.gtag('js', new Date());
      window.gtag('config', config.gaId, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, ignore_referrer: true, ...page() });
      const sendPage = () => { if (current === generation && active && allowed()) window.gtag?.('event', 'page_view', page()); };
      if (gaStarted) sendPage();
      else {
        gaScript = document.createElement('script'); gaScript.async = true; gaScript.referrerPolicy = 'no-referrer';
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.gaId);
        gaScript.onload = () => { gaStarted = true; sendPage(); };
        document.head.appendChild(gaScript);
      }
    }
    mixpanel('Page View');
    if (config.betterloopKey) {
      const init = () => {
        if (current !== generation || !active || !allowed() || !window.Betterloop?.init) return;
        window.Betterloop.init({ key: config.betterloopKey, endpoint: 'https://betterloopai.com/api/ingest', captureText: false, respectDNT: true, includePaths: APP.paths, excludePaths: ['/owner.html', '/join.html', '/api', '/v1'], excludeSelectors: ['form', '[data-private]', '[data-analytics-private]', '#portfolio-analytics-dialog', '#portfolio-analytics-open'] });
        betterloopStarted = true;
      };
      if (window.Betterloop?.init) init();
      else {
        betterloopScript = document.createElement('script'); betterloopScript.async = true; betterloopScript.referrerPolicy = 'no-referrer';
        // Deliberately no data-key: consent is checked again before explicit init.
        betterloopScript.src = 'https://betterloopai.com/sdk.js?v=20261030'; betterloopScript.onload = init;
        document.head.appendChild(betterloopScript);
      }
    }
  }
  function choose(value) {
    try {
      localStorage.setItem(APP.key, value ? 'allowed' : 'off');
      if (localStorage.getItem(APP.key) !== (value ? 'allowed' : 'off')) throw new Error('storage');
    } catch { failedChoice = true; stop(); status.textContent = 'Your choice could not be saved. Analytics remains off. Check browser storage and try again.'; return; }
    failedChoice = false;
    if (value) start(); else stop();
    window.dispatchEvent(new Event(choiceEvent));
  }
  function mount() {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/analytics.css'; document.head.appendChild(css);
    const open = document.createElement('button'); open.id = 'portfolio-analytics-open'; open.type = 'button'; open.textContent = 'Analytics choices'; open.setAttribute('aria-haspopup', 'dialog'); document.body.appendChild(open);
    dialog = document.createElement('dialog'); dialog.id = 'portfolio-analytics-dialog'; dialog.setAttribute('aria-labelledby', 'portfolio-analytics-heading');
    dialog.innerHTML = '<h2 id="portfolio-analytics-heading">Optional website analytics</h2><p>With your permission, Google Analytics, Mixpanel and Betterloop receive basic page and usage events to help improve this website. Analytics may use a random device identifier and cookies. We do not send your name, email, form values, prompts, designs, private work or full links. Advertising features, session replay and text capture are off.</p><p data-analytics-status role="status"></p><div class="analytics-actions"><button type="button" data-analytics-off>Keep analytics off</button><button type="button" data-analytics-allow>Allow analytics</button><button type="button" data-analytics-close>Close</button></div>';
    document.body.appendChild(dialog); status = dialog.querySelector('[data-analytics-status]');
    open.addEventListener('click', () => { trigger = document.activeElement; dialog.showModal(); dialog.querySelector('[data-analytics-off]').focus(); });
    dialog.querySelector('[data-analytics-off]').addEventListener('click', () => choose(false));
    dialog.querySelector('[data-analytics-allow]').addEventListener('click', () => choose(true));
    dialog.querySelector('[data-analytics-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => trigger?.isConnected && trigger.focus());
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target.closest('[data-analytics-event]') : null;
      if (!target || target.closest('form,[data-private],[data-analytics-private]')) return;
      track(target.getAttribute('data-analytics-event'));
    });
    window.addEventListener('storage', event => { if (event.key === APP.key || event.key === null) { if (allowed()) start(); else stop(); } });
    window.addEventListener('pagehide', () => { if (!allowed()) stop(); });
    window.addEventListener('hashchange', () => { if (allowed()) start(); else stop(); });
    window.addEventListener('popstate', () => { if (allowed()) start(); else stop(); });
    updateStatus();
    fetch(CONFIG_URL, { credentials: 'same-origin', cache: 'no-store', referrerPolicy: 'no-referrer' }).then(response => response.ok ? response.json() : {}).then(value => {
      config = { gaId: /^G-[A-Z0-9]{5,20}$/.test(value.gaId || '') ? value.gaId : '', mixpanelToken: /^[a-f0-9]{32}$/i.test(value.mixpanelToken || '') ? value.mixpanelToken : '', betterloopKey: /^bl_[a-zA-Z0-9_-]{8,120}$/.test(value.betterloopKey || '') ? value.betterloopKey : '' };
      configReady = true; if (allowed()) start();
    }).catch(() => {});
  }
  window.PortfolioAnalytics = { track, stop() { suspended = true; stop(); }, setPrivate(value) { suspended = Boolean(value); if (allowed()) start(); else stop(); updateStatus(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount();
})();
