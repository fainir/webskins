# Replacement candidate handoff - WebSkins1.0.6

This replaces the package targeted by the existing pending owner Store-upload action; do not ask the owner to load another unpacked extension or repeat their pending request. Installed1.0.5 acceptance remains valid evidence for unchanged background/content/provider behavior. Public Store1.0.2 is not updated by this source push.

## Package and review

- Source branch: codex/production-readiness in the existing private fainir/webskins repository; no merge into main or Store submission by this worker.
- Fixed build command: `npm run build:candidate`, then `npm run package:candidate`.
- Prepared ZIP: `/Users/nirfeinstein/Documents/GitHub/webskins/release/webskins-1.0.6.zip`.
- SHA-256: `c7d3485a34decb5354823927d6cec2e82035178248f1502f4b739e7e5929957e`.
- ZIP contains exactly the13 matching candidate-dist files, with manifest at its root. Manifest fields/permissions match accepted1.0.5 apart from version1.0.6. The accepted13-file dist still matches the old checked1.0.5 ZIP. Both are retained as rollback.
- [Changed popup acceptance](popup/notes.md): actual400x600 compiled UI, synthetic Chrome/storage/community/background only, no real API/provider calls. Six screenshots and22 extension cases. This does not claim installed1.0.6 or Store publication acceptance.
- Final disposable-source CI commands pass: root/backend clean installs,22 extension cases, the synthetic backend ownership/restore fixture, normal full build and both runtime audits with zero vulnerabilities. Unknown output flags are rejected before changing candidate files.

The coordinator should copy this ZIP to the existing prepared upload directory and replace its guide's1.0.5 package reference/release notes with1.0.6. Keep the existing exact manifest summary and detailed privacy/model/capture disclosures. The browser policy still makes developer-console upload/submission owner-only; no workaround is authorized.

Suggested release notes:

> Saved skins can now be opened, applied and removed with the keyboard. Local storage and community failures show clear retry controls. Settings retain your previous model if saving fails, and clearing skins uses a keyboard-accessible confirmation. Errors remain visible until dismissed. Popup icons and typography work offline without Google Fonts. Existing session-only API key, per-site AI consent and CSS safety protections remain.

## Version-aware public privacy update

Only PRIVACY.md and its generated backend/public/privacy.html change in the API package. They distinguish Google Fonts use in1.0.5 and earlier from packaged icons/system fonts in1.0.6. No API code, schema, environment, data, provider or new resource is required.

Coordinator command from the existing backend folder, after confirming the linked context with `railway status`:

```
railway up --service webskins-api --detach
```

Use only the existing webskins-api Railway service and preserve its SQLite volume, RATE_LIMIT_SECRET, DATABASE_URL and all variables. Compatible previous successful deployment:71c6c0c8-bf8e-4a7b-8e74-5f9a7015671d. Verify https://webskins-api-production.up.railway.app/health and /privacy after rollout; do not publish a real skin or send another email. Existing source workflow checks use a disposable synthetic database.

No fixture remains running after qa/popup-ui.mjs exits. This worker has not deployed the API or changed any installed extension/Store item.
