---
title: How I Built an AI Website Skin Generator with Chrome MV3 + Claude API
published: false
description: Building a Chrome extension that transforms any website's appearance using natural language — and why a single AI prompt isn't enough.
tags: ai, chrome-extension, javascript, webdev
cover_image:
---

# How I Built an AI Website Skin Generator with Chrome MV3 + Claude API

I wanted to restyle websites with plain English. Not "inspect element, find the class, write CSS, refresh, repeat." Just say "make this site dark mode with a cyberpunk vibe" and have it happen.

So I built **WebSkins** — a Chrome extension that takes a natural language prompt, generates CSS using Claude, injects it into the page, and then *looks at what it did* to fix its own mistakes. That last part turned out to be everything.

Here's how it works, what I learned, and why the screenshot feedback loop was the breakthrough.

---

## The Problem: CSS Generation Is Unreliable

There's no shortage of "AI generates CSS" demos. The issue isn't generating CSS — it's generating *good* CSS for a page you've never seen before.

A modern website has hundreds of nested divs, framework-specific class names, inline styles, shadow DOM components, and CSS specificity wars. When you ask an LLM to generate a dark theme for an arbitrary website, you get:

- **Missed areas.** The body turns dark, but every card, modal, dropdown, and tooltip stays white. You get white text on white backgrounds.
- **Broken selectors.** The AI guesses `.header` when the site uses `[data-testid="nav-bar"]`.
- **Specificity losses.** Without `!important` on everything, existing stylesheets win.
- **Incomplete coverage.** 15 CSS rules when you need 80+.

A single prompt produces something that looks 60% right and 40% broken. That's worse than nothing — it feels like a bug, not a feature.

I needed a way to *close the gap* between what the AI imagines and what actually renders.

---

## The Solution: Generate, Screenshot, Evaluate, Refine

The core insight: **give the AI eyes.**

Instead of a single generation pass, WebSkins runs a multi-cycle refinement loop:

1. **Generate** — Claude receives the page's DOM structure + the user's description and produces CSS
2. **Inject** — The content script drops that CSS into the page
3. **Screenshot** — `chrome.tabs.captureVisibleTab` captures what the page actually looks like now
4. **Evaluate** — The screenshot goes back to Claude with a detailed QA checklist: "find every visual problem and fix it"
5. **Repeat** — 2-3 more cycles until a quality score hits 8/10 or we cap out

The difference is dramatic. Cycle 1 produces a rough sketch. By cycle 3, you have a polished skin with themed scrollbars, hover states, and consistent contrast.

---

## Architecture: Three Scripts, One Message Bus

WebSkins is a standard Chrome MV3 extension with three components that talk to each other through `chrome.runtime.sendMessage`:

```
Popup (UI)  <-->  Background (Service Worker)  <-->  Content Script (Page)
```

**Popup** (`popup.js`) — The user interface. Vanilla JS with Tailwind CSS (compiled at build time — no CDN allowed in MV3). Manages three views: Home (prompt input + skin history), Chat (conversational refinement), and Settings. All state lives in a plain object:

```js
const state = {
  view: 'home',     // 'home' | 'chat' | 'settings'
  isGenerating: false,
  activeSkin: null,
  skins: [],
  chatMessages: [],
  progressMessage: '',
  // ...
};
```

No React, no framework. For a popup this size, a `render()` function that toggles `classList.hidden` is all you need.

**Background** (`background.js`) — The orchestrator. Handles all Claude API calls, coordinates the screenshot loop, and manages skin storage. This is where the multi-cycle logic lives.

**Content Script** (`content.js`) — Runs on every page. Three jobs: inject/remove CSS, capture a simplified DOM structure for the AI, and auto-apply saved skins on page load.

---

## The AI Loop in Detail

Let's walk through what happens when you type "dark academia theme with warm sepia tones" and hit Generate.

### Step 1: Capture the DOM

The content script walks the DOM tree (depth-limited to 8 levels) and builds a compact text representation:

```js
function capturePageStructure() {
  function processElement(el, depth) {
    if (depth > 8) return null;
    const tag = el.tagName.toLowerCase();
    const parts = [tag];
    if (el.id) parts.push(`#${el.id}`);
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.trim().split(/\s+/).slice(0, 4).join('.');
      if (classes) parts.push(`.${classes}`);
    }
    // ... recurse children, capture text snippets
  }
  return processElement(document.body, 0);
}
```

This gives Claude actual selectors to target — not guesses. The output looks like:

```
body
  header#site-header.dark.sticky
    nav.main-nav
      a.nav-link "Home"
      a.nav-link "About"
    div.search-bar
      input.search-input
  main.content-wrapper
    article.post-card
      h2.post-title "How to..."
```

### Step 2: First Generation

The DOM structure + user prompt go to Claude with a system prompt that encodes hard-won lessons about CSS override strategies:

```js
const SYSTEM_PROMPT = `You are WebSkins AI, an expert web designer...

CRITICAL CSS RULES:
1. COVERAGE: Style EVERY visible area — body, header, nav, main, sidebar, footer...
2. SELECTORS: Use broad selectors aggressively — body, *, header, nav, [role="banner"]...
3. !important: Use on EVERY property. You are overriding an existing website's styles.
...
10. CONSISTENCY: Use CSS custom properties at the top:
    :root { --ws-bg: #1a1a2e; --ws-text: #eee; --ws-accent: #e94560; }
`;
```

The system prompt alone took several iterations. Early versions produced 15-rule stylesheets that missed half the page. The explicit "50-150+ CSS rules" instruction and the mandate to use CSS custom properties were both added after watching real failures.

Claude responds with JSON containing the CSS, a creative name, a description, and follow-up suggestions.

### Step 3: The Screenshot Loop

Here's where it gets interesting. After injecting the first CSS, the background script enters the evaluation loop:

```js
for (let i = 0; i < MAX_CYCLES; i++) {
  // Wait for CSS to render
  await delay(1000);

  // Capture what the page actually looks like
  const screenshotBase64 = await captureScreenshot(tabId);

  // Re-capture DOM (styles may have shifted layout)
  const fresh = await sendToTab(tabId, { action: 'capture-page' });

  // Send screenshot + DOM + current CSS to Claude for evaluation
  const improved = await evaluateSkin(
    apiKey, model, screenshotBase64, currentCss, prompt, fresh.structure
  );

  // Apply improved CSS
  if (improved.css && improved.css.length > currentCss.length * 0.3) {
    currentCss = improved.css;
  }
  await sendToTab(tabId, { action: 'apply-css', css: currentCss });

  // Stop early if quality is good enough
  if (improved.quality_score >= 8) break;
}
```

The evaluation prompt is a different persona — a "meticulous visual QA reviewer" with a 10-point checklist covering coverage, text readability, contrast, form fields, scrollbars, hover states, and more. It scores its own work on a 1-10 scale.

Two details worth noting:

- **The sanity check** (`improved.css.length > currentCss.length * 0.3`) prevents the AI from accidentally nuking a working stylesheet with a tiny fragment. It happened.
- **The quality threshold** (`>= 8`) means the loop is dynamic. A simple site might converge in 2 cycles. A complex one uses all 4.

The `captureScreenshot` function is surprisingly simple — one API call:

```js
async function captureScreenshot(tabId) {
  const tab = await chrome.tabs.get(tabId);
  const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  return dataUrl.split(',')[1]; // strip data:image/png;base64, prefix
}
```

The screenshot is sent to Claude as a base64 image using the vision API. Claude literally sees the page, identifies white-on-white text in the sidebar, notices the unstyled dropdown menu, and rewrites the full CSS to fix everything.

---

## Chat Mode: Conversational Refinement

After the initial generation, the popup switches to a chat view. The user can say things like "make the accent color more red" or "the sidebar text is hard to read" and get targeted updates.

The chat maintains full conversation history so Claude has context on what's already been tried. Each refinement re-captures the DOM (because styles may have shifted layout), appends the user's request with page context, and returns a complete updated stylesheet.

The AI also suggests follow-up ideas after each response — things like "Add a gradient header" or "Try rounded corners on cards." These render as clickable chips in the chat that auto-fill the input, making it feel more like a creative collaboration than a command line.

---

## Community Marketplace

Skins are personal by default — saved per-domain in Chrome's local storage and auto-applied when you revisit the site. But the fun part is sharing.

The marketplace backend is Express + Prisma + PostgreSQL, deployed on Railway. The data model is minimal:

```prisma
model Skin {
  id          String   @id @default(cuid())
  name        String
  description String?
  css         String   @db.Text
  domain      String
  prompt      String?
  authorName  String
  authorId    String   // anonymous fingerprint
  likes       Int      @default(0)
  installs    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([domain])
  @@index([likes(sort: Desc)])
  @@index([installs(sort: Desc)])
}
```

Users can browse by domain or globally, sort by trending/newest, like skins, and install them with one click. Publishing sends your skin's CSS, name, and domain to the API. No accounts — just an anonymous fingerprint generated client-side.

The extension's popup shows a "Community" section on the home view with trending skins for whatever site you're on. If no domain-specific skins exist, it falls back to global trending.

---

## Key Lessons Learned

**1. MV3 service workers are not persistent.** The background script can be killed at any time. I had to make sure all state that mattered was in `chrome.storage`, not in memory. The generation loop runs as a single async function so it completes before the worker idles out, but chat history is auto-saved after every message in case the popup closes.

**2. CSS sanitization is not optional.** The content script sanitizes all injected CSS — stripping `@import` (can load external stylesheets), external `url()` references (tracking pixels), `-moz-binding` and `expression()` (XSS vectors). AI-generated CSS is still user-facing code.

```js
function sanitizeCss(css) {
  return css
    .replace(/@import\s+[^;]+;?/gi, '/* @import removed */')
    .replace(/url\s*\(\s*(['"]?)\s*(?!data:|#)https?:\/\/[^)]+\1\s*\)/gi, 'url(about:blank)')
    .replace(/-moz-binding\s*:[^;]+;?/gi, '')
    .replace(/behavior\s*:[^;]+;?/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '');
}
```

**3. The system prompt is the product.** I spent more time iterating on the system prompt than on the extension's UI. The rules about `!important` on every property, CSS custom properties for consistency, and the explicit 50-150 rule target were all discovered by watching real failures.

**4. Extended thinking is worth the tokens.** The Claude API call enables extended thinking with a 16k token budget. For CSS generation specifically, letting the model reason about selector specificity, color contrast, and coverage before writing the stylesheet produced noticeably better first-pass results.

```js
const body = {
  model,
  max_tokens: 32000,
  system: systemPrompt,
  messages,
  thinking: {
    type: 'enabled',
    budget_tokens: 16000,
  },
};
```

**5. Vanilla JS is fine.** The popup is ~780 lines of JavaScript with no framework. A `state` object, a `render()` function, and `classList.toggle` handle three views, real-time progress updates, skin history, community browsing, and chat. For a Chrome extension popup, adding React would have been pure overhead.

**6. Progress feedback matters more than speed.** The multi-cycle loop takes 30-60 seconds. Without progress updates, users think it's frozen. Broadcasting cycle-by-cycle status ("Cycle 2 done, quality: 6/10... Cycle 3 done, quality: 8/10 — looks good!") turns a slow process into a satisfying one.

---

## Try It

WebSkins is free and open source. You bring your own Claude API key — no data leaves your browser except the API calls you make.

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/webskins) | [GitHub](https://github.com/nicholasfein/webskins)

The screenshot-based feedback loop is the pattern I'm most excited about. It's not specific to CSS — any time an LLM generates something visual, giving it eyes to evaluate its own output and iterate is a massive quality multiplier. Try it on your favorite site and see what three cycles of self-critique can do.
