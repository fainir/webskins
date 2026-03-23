# WebSkins Chrome Extension — Project Plan

## Vision
AI-powered Chrome extension that lets users transform any website's appearance with natural language prompts. Uses Claude API (user's own key). Skins are per-domain, can be saved locally and published to a community marketplace.

## Success Criteria
- Extension loads in Chrome, popup matches designer's UI
- User enters API key, writes a prompt → website style changes
- Multi-cycle AI improvement (generate → screenshot → refine)
- Chat mode for iterative refinement after first generation
- Skins persist per-domain, auto-apply on revisit
- Marketplace backend on Railway for sharing skins

---

## Phase 1: Extension Foundation
- [x] Project setup (package.json, tailwind, build system)
- [x] manifest.json (Manifest V3)
- [x] Popup HTML/CSS (adapted from designer's code.html)
- [x] Icon generation
- [x] Build script

## Phase 2: Core Functionality
- [x] Content script (CSS injection, DOM capture, auto-apply)
- [x] Background service worker (message routing, screenshot capture)
- [x] Storage utility (Chrome storage wrapper)
- [x] Claude API utility (Messages API via fetch)

## Phase 3: AI Skin Generation
- [x] Popup JS (state management, views, events)
- [x] Prompt → CSS generation flow
- [x] Multi-cycle improvement (generate → screenshot → evaluate → refine)
- [x] Chat mode for follow-up refinements

## Phase 4: Skin Management
- [x] Save/load skins per domain
- [x] History display in popup
- [x] Apply/remove skins from history
- [x] Auto-apply saved skins on page load

## Phase 5: Marketplace Backend (Railway)
- [x] Express + Prisma + PostgreSQL API
- [x] Endpoints: browse, publish, install, like
- [x] Integration with extension (community trending section)
- [ ] Deploy to Railway (needs `railway up` with DATABASE_URL)

---

## Architecture

```
Extension (Chrome MV3)
├── popup.html/js/css  — UI (Home, Chat, Settings views)
├── background.js      — Service worker (Claude API, orchestration)
├── content.js         — Content script (CSS inject, DOM capture)
└── utils/             — Shared modules (storage, claude-api)

Backend (Railway) — Phase 5
├── Express API
├── Prisma ORM
└── PostgreSQL
```

## Key Decisions
- No JS framework for popup — vanilla JS with simple state management
- Tailwind CSS compiled at build time (no CDN in MV3)
- Content script always injected (needed for auto-apply)
- Claude API called directly via fetch from background worker
- Screenshots via chrome.tabs.captureVisibleTab for visual AI evaluation
