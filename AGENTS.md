# webskins - agent notes

## Working here
- When restoring the accepted WebSkins release, validate source in a private copy including PRIVACY.md; build-privacy.js consumes it before packaging, and npm run build replaces the installed dist. (2026-10-29)
- Use npm run build:candidate and package:candidate for popup fixes; they preserve the accepted installed dist. Wait for the build to finish before qa/popup-ui.mjs, which verifies the actual compiled 400x600 UI with synthetic Chrome APIs. (2026-10-29)
