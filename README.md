# WebSkins

A desktop Chrome extension for user-requested CSS appearances, optional community sharing, and a separate marketplace API. The accepted installed candidate is1.0.5; public Store publication still needs the owner. [Readiness](READINESS.md), [retained evidence](qa/accepted.md).

## Develop and check

Use Node24. In a clean checkout: `npm ci --ignore-scripts`, `npm ci --prefix backend`, `npm test`, `npm test --prefix backend`, `npm run build`. The backend test owns a disposable SQLite database and restores its synthetic publication-management key; it never uses production data. CI runs those commands and runtime audits without provider secrets.

`npm run build` replaces dist. Do not run it over the accepted owner's installed dist merely to update documentation. Validate source in an isolated checkout/copy. The already-checked Store ZIP is in the coordinator's prepared upload guide; preserve it until an actual defect requires a new version.

## Existing API service

The runtime is Node24/Prisma/SQLite. Only set the existing DATABASE_URL on its persistent volume and the existing RATE_LIMIT_SECRET through secure Railway configuration; see backend/.env.example. Run locally from backend with `npm start`. Startup verifies/backups the current database, applies the compatible schema and creates a fresh backup before listening. Readiness requires the database and a backup newer than48hours; scheduled backups retain the newest7 copies with private permissions.

Deploy only from backend to the existing verified webskins-api Railway context: check `railway status`, then `railway up --service webskins-api --detach`. Do not create a new service. Preserve the existing persistent volume and variables. Verify /health and /privacy after rollout; no live skin publication/deletion is needed for smoke checks. The accepted October27 deployment is71c6c0c8-bf8e-4a7b-8e74-5f9a7015671d.

For code rollback, redeploy the previous successful compatible API deployment, retaining current data/configuration. A data recovery is separate: stop writes, choose a verified private SQLite backup, run `PRAGMA quick_check` on a disposable restored copy, verify ownership/deletion there, then explicitly approve any production data replacement. Do not overwrite newer publications as a code rollback.

## Extension distribution

The owner uploads the existing1.0.5 ZIP and prepared accurate listing/privacy disclosures in the existing Chrome Store item, then submits for review. No console automation workaround is allowed. Observe the public listing after submission; do not call a local installed candidate publicly distributed. Keep the Store copy/data installed when switching between the accepted unpacked candidate and Store release.
