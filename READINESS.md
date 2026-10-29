# WebSkins - Readiness

Every row serves [GOAL.md](GOAL.md) and portfolio PT07. Done is verified, cut, owner or waiting. Existing installed1.0.5 acceptance and public API release are retained; Store distribution is separate.

## Scope

- Installed accepted extension1.0.5; public Chrome Store still1.0.2 on October29. No Store check again before October30.
- API/privacy: https://webskins-api-production.up.railway.app/health and /privacy.
- Source is this existing private repository; Node24 for API and checks. [Run/deploy/rollback](README.md).
- Prior evidence: [acceptance index](qa/accepted.md). Preserve approved ZIP and dist; no rebuild in place for ledger work.

## Flows and gates

| ID | Flow/gate | Status | Evidence/next step | Serves |
|---|---|---|---|---|
| F1 | Actual installed generation/refinement/apply/save/reload/remove and restored reload | verified | October27 actual1.0.5 Settings and page DOM; owner-entered session key never read/exported. [Retained proof](qa/accepted.md) | [Goal](GOAL.md) |
| F2 | Bounded rendered capture, per-origin consent/revocation, hidden/form exclusion and session-only key | verified |21 extension checks; compiled capture/resource probes and actual Settings accepted. [Proof](qa/accepted.md) | [Goal](GOAL.md) |
| F3 | Public skins, private management keys, scoped deletion, quotas and restore | verified | Actual synthetic API ownership/counter/health/SQLite restore and published privacy source accepted. [Proof](qa/accepted.md) | [Goal](GOAL.md) |
| U1 | Remaining popup screens, keyboard/focus, visible empty/loading/error feedback and contrast | todo | Preserve real installed flow acceptance. Finish only missing cross-screen UX checks on a synthetic compiled popup; do not claim it establishes a second installed-extension/provider acceptance | [Goal](GOAL.md) |
| G1 | Reproducible source-only checks, dependency audit and documented deployment/rollback | verified | [Isolated workflow proof](qa/ci.md):21 extension checks, backend ownership/restore, both clean installs/build and zero runtime vulnerabilities. Accepted dist/ZIP unchanged | [Goal](GOAL.md) |
| G2 | Phone web-app Lighthouse gate for extension popup | cut (not applicable) | This is a fixed desktop Chrome extension popup, not a phone website. Verify its real viewport/keyboard UI in U1; API has no application screen. Public privacy document remains covered by API/public-policy acceptance | [Goal](GOAL.md) |
| G3 |1.0.5 package, manifest, privacy and accurate Store copy match | verified | All13 accepted dist files match ZIP; exact manifest summary, detailed listing, release notes/privacy prepared. [Proof](qa/accepted.md) | [Goal](GOAL.md) |
| G4 | Hosted CI execution | owner | Existing shared Actions budget; local source workflow must pass, no paid increase authorized | [Goal](GOAL.md) |
| O1 | Upload checked1.0.5 ZIP and prepared listing/privacy text; Submit for Review | owner | Pending exact owner action already requested. [Prepared guide](/Users/nirfeinstein/Documents/ChatGPT/almost%20finished%20projects%20+%20marketing/artifacts/production-readiness-2026-10-26/webskins-store-upload-guide.html). Browser policy blocks automated developer-console operation | [Goal](GOAL.md) |
| W1 | Store review and public1.0.5 publication | waiting | Check public listing day after owner submission, at most daily; existing public1.0.2 remains separate | [Goal](GOAL.md) |

## Log (last10)

-2026-10-29 - Distilled still-valid installed/API/package acceptance into a short ledger. No accepted package/runtime code, browser permission, provider call or Store submission changed. Missing broad popup UX and reproducible CI/docs remain buildable.
