# WebSkins - Readiness

Every row serves [GOAL.md](GOAL.md) and portfolio PT07. Done is verified, cut, owner or waiting. Existing installed1.0.5 acceptance and public API release are retained; Store distribution is separate.

## Scope

- Installed accepted extension1.0.5 is preserved. Separate1.0.6 popup candidate closes U1; public Chrome Store still1.0.2 on October29. No Store check again before October30.
- API/privacy: https://webskins-api-production.up.railway.app/health and /privacy.
- Source is this existing private repository; Node24 for API and checks. [Run/deploy/rollback](README.md).
- Prior evidence: [acceptance index](qa/accepted.md). Preserve approved ZIP and dist; no rebuild in place for ledger work.

## Flows and gates

| ID | Flow/gate | Status | Evidence/next step | Serves |
|---|---|---|---|---|
| F1 | Actual installed generation/refinement/apply/save/reload/remove and restored reload | verified | October27 actual1.0.5 Settings and page DOM; owner-entered session key never read/exported. [Retained proof](qa/accepted.md) | [Goal](GOAL.md) |
| F2 | Bounded rendered capture, per-origin consent/revocation, hidden/form exclusion and session-only key | verified |21 extension checks; compiled capture/resource probes and actual Settings accepted. [Proof](qa/accepted.md) | [Goal](GOAL.md) |
| F3 | Public skins, private management keys, scoped deletion, quotas and restore | verified | Actual synthetic API ownership/counter/health/SQLite restore and published privacy source accepted. [Proof](qa/accepted.md) | [Goal](GOAL.md) |
| U1 | Remaining popup screens, keyboard/focus, visible empty/loading/error feedback and contrast | verified | October29 separate1.0.6 candidate: actual compiled400x600 DOM with synthetic Chrome facade. Keyboard history, focus/dialog loop/Escape, persistent truthful errors, storage/community/model/clear retry; six screenshots, text contrast≥5.31:1, no uncaught errors or external requests. [Proof](qa/popup/notes.md). Does not replace retained installed/provider acceptance | [Goal](GOAL.md) |
| G1 | Reproducible source-only checks, dependency audit and documented deployment/rollback | verified | [Isolated workflow proof](qa/ci.md):21 extension checks, backend ownership/restore, both clean installs/build and zero runtime vulnerabilities. Accepted dist/ZIP unchanged | [Goal](GOAL.md) |
| G2 | Phone web-app Lighthouse gate for extension popup | cut (not applicable) | This is a fixed desktop Chrome extension popup, not a phone website. Verify its real viewport/keyboard UI in U1; The extension popup is unchanged; the new owned public landing page is covered separately by A1 | [Goal](GOAL.md) |
| G3 |1.0.5 package, manifest, privacy and accurate Store copy match | verified | All13 accepted dist files match ZIP; exact manifest summary, detailed listing, release notes/privacy prepared. [Proof](qa/accepted.md) | [Goal](GOAL.md) |
| G5 |1.0.6 replacement candidate package and source workflow | verified | All22 extension tests, synthetic backend ownership/restore, clean installs/build and both runtime audits pass in disposable source copy. Candidate ZIP matches all13 files, manifest differs from1.0.5 only in version, accepted dist/ZIP unchanged. [Candidate](qa/store-candidate.md) | [Goal](GOAL.md) |
| R1 | Publish the version-aware privacy document on existing API | verified | Existing rollout SUCCESS; public health/backup200, exact current privacy and375/1440 version-disclosure checks pass without external requests or page errors. [Public release/rollback](qa/privacy-release.md) | [Goal](GOAL.md) |
| G4 | Hosted CI execution | owner | Existing shared Actions budget; local source workflow must pass, no paid increase authorized | [Goal](GOAL.md) |
| O1 | Upload checked replacement1.0.6 ZIP and prepared listing/privacy text; Submit for Review | owner | Same pending owner action, not requested again. [Replacement details](qa/store-candidate.md), [coordinator guide](/Users/nirfeinstein/Documents/ChatGPT/almost%20finished%20projects%20+%20marketing/artifacts/production-readiness-2026-10-26/webskins-store-upload-guide.html). Browser policy blocks automated developer-console operation | [Goal](GOAL.md) |
| W1 | Store review and public replacement publication | waiting | Check public listing day after owner submission, at most daily; existing public1.0.2 remains separate | [Goal](GOAL.md) |

## October30 analytics request

| ID | Flow / gate | Status | Evidence / next step |
|---|---|---|---|
| A1 | Optional public website analytics, safe fixed events, consent/withdrawal and private-surface exclusion | verified | [Source and actual-server browser acceptance](qa/analytics.md);24 checks at375/1440, build/config checks and visually reviewed screenshots. No genuine provider receipt is claimed |
| A2 | Configure the correct existing projects/stream privacy settings, deploy and verify real receipt | owner | Portfolio O9 Chrome recovery unblocks matching Google/Mixpanel dashboard setup, then the owned API landing rollout and real receipts. Installed extension, accepted packages and owner-only Store publication remain unchanged. [Evidence](qa/analytics.md). Do not repeat the already pending Chrome action. |

## Log (last10)

-2026-10-29 - Version-aware API privacy is live/public-accepted at375/1440. Separate1.0.6 popup/package/workflow gates pass and existing pending Store guide points to replacement ZIP; installed1.0.5 remains unchanged. No buildable row remains; Store/hosted-CI owner and review waits retained.

-2026-10-29 - Fixed concrete popup recovery/keyboard/contrast defects in separate1.0.6 candidate. Actual400x600 synthetic UI passes; no real AI/community publication, key access, installed extension or accepted package mutation. Coordinator owns privacy rollout and pending Store guide replacement.
-2026-10-29 - Distilled still-valid installed/API/package acceptance into a short ledger. No accepted package/runtime code, browser permission, provider call or Store submission changed. Missing broad popup UX and reproducible CI/docs remain buildable.
