# WebSkins

A desktop Chrome extension for user-requested CSS appearances, optional community sharing, and a separate marketplace API. Installed1.0.5 acceptance is retained. Source1.0.6 is a separate popup recovery/accessibility candidate; public Store publication still needs the owner. [Readiness](READINESS.md), [retained evidence](qa/accepted.md).

## Develop and check

Use Node24. In a clean checkout: `npm ci --ignore-scripts`, `npm ci --prefix backend`, `npm test`, `npm test --prefix backend`, `npm run build`. The backend test owns a disposable SQLite database and restores its synthetic publication-management key; it never uses production data. CI runs those commands and runtime audits without provider secrets.

`npm run build` replaces dist. Do not run it over the accepted owner's installed dist merely to update documentation. Validate source in an isolated checkout/copy. The already-checked Store ZIP is in the coordinator's prepared upload guide; preserve it until an actual defect requires a new version.

For this popup fix, use `npm run build:candidate` then `npm run package:candidate`. These fixed outputs are `candidate-dist/` and `release/webskins-1.0.6.zip`; they never replace installed dist or the earlier checked ZIP. Run `node qa/popup-ui.mjs` after the candidate build completes for the owned400x600 synthetic popup. It blocks external requests and uses a synthetic Chrome API facade, not an installed extension or real Anthropic call. The local QA module imports the bundled Playwright path on this Mac. [Candidate scope and exact pending upload replacement](qa/store-candidate.md).

## Existing API service

The runtime is Node24/Prisma/SQLite. Only set the existing DATABASE_URL on its persistent volume and the existing RATE_LIMIT_SECRET through secure Railway configuration; see backend/.env.example. Run locally from backend with `npm start`. Startup verifies/backups the current database, applies the compatible schema and creates a fresh backup before listening. Readiness requires the database and a backup newer than48hours; scheduled backups retain the newest7 copies with private permissions.

Deploy only from backend to the existing verified webskins-api Railway context: check `railway status`, then `railway up --service webskins-api --detach`. Do not create a new service. Preserve the existing persistent volume and variables. Verify /health and /privacy after rollout; no live skin publication/deletion is needed for smoke checks. The accepted October27 deployment is71c6c0c8-bf8e-4a7b-8e74-5f9a7015671d.

For code rollback, redeploy the previous successful compatible API deployment, retaining current data/configuration. A data recovery is separate: stop writes, choose a verified private SQLite backup, run `PRAGMA quick_check` on a disposable restored copy, verify ownership/deletion there, then explicitly approve any production data replacement. Do not overwrite newer publications as a code rollback.

## Extension distribution

The existing owner upload action now has a separate1.0.6 replacement candidate described in qa/store-candidate.md. Keep the accepted1.0.5 ZIP as rollback and do not overwrite its installed dist. The owner uses the same existing Chrome Store item and prepared accurate listing/privacy disclosures, then submits for review. No console automation workaround is allowed. Observe the public listing after submission; do not call a local candidate publicly distributed. Keep the Store copy/data installed when switching between an unpacked candidate and Store release.

## Public website analytics

The existing API serves an owned website at `/`, plus the version-specific `/privacy` document. Only the owned landing page may load optional Google Analytics, Mixpanel and Betterloop, after a local device choice; browser privacy signals override it. The extension, community API, installed dist/ZIP and candidate package are unchanged. Set optional `GA_ID`, `MIXPANEL_TOKEN` and `BETTERLOOP_KEY` public identifiers on the existing `webskins-api` service; unset identifiers stay disabled. `/analytics-config.json` exposes only those public browser identifiers. No new hosting, API secrets or browser permissions are needed.
