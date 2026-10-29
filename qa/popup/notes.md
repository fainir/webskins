# Popup recovery and keyboard candidate - October 29

Version1.0.6 was built only into candidate-dist. The accepted installed1.0.5 and its13-file ZIP remain identical. This verifies the changed compiled popup with a synthetic Chrome API facade at its actual400x600 size, not a new installed extension or real Anthropic/provider acceptance.

Run after the build has finished:

```
npm run build:candidate
node qa/popup-ui.mjs
```

The test owns one ephemeral loopback server/headless Chrome and closes both. All marketplace routes use synthetic responses; all other external requests are blocked. No actual key, website content, message, model request or publication is used.

- Keyboard Enter opens a saved design, focuses chat, and keyboard Space/Enter apply/remove. Names containing quotes remain valid labels. All visible buttons have names. The400px document has no horizontal overflow.
- Simultaneous session-key/model/history/votes read failures leave navigation usable and show local Retry; successful retry restores the saved design without replacing it. A503 community response shows Retry, distinctly from a successful empty list. Loading and sort pressed states are visible.
- Model write rejection retains the previous selection. A later save succeeds. Clear All Skins uses an accessible in-page dialog: initial Cancel, Tab cycles inside actions, Escape cancels and restores focus. A failed delete preserves saved data and offers retry/cancel; retry completes.
- Background apply/save errors do not show success. Error feedback remains after five seconds of simulated time until dismissed. Like failures are visible. A synthetic delayed generation disables conflicting chat/save/publish actions and displays progress.
- No uncaught page errors or unexpected external requests. System fonts and packaged SVG icons stay usable offline. No remote font fetch is needed.
- Computed visible text contrast checks: chat5.31:1 minimum; Home/local/community recovery5.94:1; Settings/clear retry5.96:1. Disabled controls are excluded. This is a fixed popup, so the ledger's phone-web Lighthouse gate remains inapplicable.

Screenshots: [Home](home.jpg), [chat](chat.jpg), [local recovery](recovery.jpg), [community retry](community-retry.jpg), [Settings](settings.jpg), [clear retry](clear-retry.jpg).

All22 extension tests pass. The added list-client case distinguishes empty from failed/malformed responses and checks the bounded request signal. Existing capture/session-key/model/CSS/cancellation cases are retained. No backend runtime or data change was made.

The final disposable-source workflow also passed both clean npm installs, all22 extension cases, the existing synthetic backend ownership/counter/readiness/restore fixture, full normal build and both runtime dependency audits (zero vulnerabilities). The API policy source regenerates successfully. Unknown build output flags are rejected before modifying the candidate. The final UI fixture was stopped and reaped successfully.
