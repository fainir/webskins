// Shared contact UI for this owner's websites. No analytics or browser storage.
(() => {
  'use strict';
  const states = new WeakMap();
  document.addEventListener('submit', async event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-mail-contact]')) return;
    if (event.submitter?.hasAttribute('data-contact-draft')) {
      const previous = form.querySelector('[data-contact-status]');
      if (previous) { previous.hidden = true; previous.textContent = ''; }
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!form.reportValidity()) return;
    const status = form.querySelector('[data-contact-status]');
    const button = form.querySelector('[data-contact-send]');
    if (!status || !button) return;
    const field = name => String(new FormData(form).get(name) || '').trim();
    const subject = field('subject');
    const payload = {
      product: form.dataset.contactProduct,
      name: field('name'),
      email: field('email'),
      message: (subject ? 'Subject: ' + subject + '\n\n' : '') + field('message'),
      website: field('website'),
    };
    const signature = JSON.stringify(payload);
    let state = states.get(form);
    if (state?.busy) return;
    if (!state || state.signature !== signature) {
      if (!window.crypto?.randomUUID) {
        status.hidden = false;
        status.textContent = 'This browser cannot send the form securely. Please use the email link instead.';
        return;
      }
      state = { signature, requestId: crypto.randomUUID(), busy: false };
      states.set(form, state);
    }
    const draftStatus = form.querySelector('[data-form-status]');
    if (draftStatus) draftStatus.hidden = true;
    const draftPreview = form.parentElement?.querySelector('[data-email-draft]');
    if (draftPreview) draftPreview.hidden = true;
    state.busy = true;
    const label = button.textContent;
    button.disabled = true;
    button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    status.hidden = false;
    status.textContent = 'Sending your message…';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch('https://betterloopai.com/api/public/contact', {
        method: 'POST', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': state.requestId },
        body: signature, signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true || typeof result.reference !== 'string') {
        status.textContent = response.status === 429
          ? 'Too many messages were sent recently. Your text is kept here; please wait and retry, or use the email link.'
          : 'We could not confirm email delivery. Your text is kept here. Please retry or use the email link.';
        return;
      }
      const currentSubject = field('subject');
      const current = JSON.stringify({product:form.dataset.contactProduct,name:field('name'),email:field('email'),message:(currentSubject?'Subject: '+currentSubject+'\n\n':'')+field('message'),website:field('website')});
      if (current === signature) form.reset();
      states.delete(form);
      status.textContent = current === signature
        ? 'Your message was accepted for email delivery. No automatic confirmation email or reply deadline is promised.'
        : 'Your original message was accepted for email delivery. Your newer edits are still here and have not been sent.';
    } catch {
      status.textContent = 'We could not confirm email delivery. Your text is kept here. Please retry or use the email link.';
    } finally {
      clearTimeout(timer);
      state.busy = false;
      button.disabled = false;
      button.textContent = label;
      form.removeAttribute('aria-busy');
    }
  }, true);
  const enable = () => document.querySelectorAll('[data-mail-contact] [data-contact-send]').forEach(button => { button.disabled = false; });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enable, {once:true});
  else enable();
})();
