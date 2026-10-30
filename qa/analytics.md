# Optional website analytics - source acceptance, October 30, 2026

Google Analytics, Mixpanel and Betterloop are available only after an explicit browser choice, and only when their public identifiers are configured. No account, private provider credential, payment commitment, real email or AI request was created by this change. No live analytics or deployment acceptance is claimed here.

The real served HTML/runtime was exercised at375px and1440px with third-party responses intercepted. All24 checks pass: no vendors before permission; sanitized query/hash-free page data; fixed event transport and rejection of unknown events; stop/discard and identifier cleanup; saved withdrawal/reload; DNT/GPC; blocked storage; opt-in before configuration arrives; failed withdrawal while old allowed storage and delayed configuration remain; late Betterloop script after withdrawal; missing settings; and a private surface with saved permission. Both screenshots were visually reviewed; native dialog focus returns to Analytics choices and the layout fits both widths.

- [Phone](analytics/public-375.png), [desktop](analytics/public-1440.png).
- Runtime configuration is `GET /analytics-config.json` with only `gaId`, `mixpanelToken` and `betterloopKey`, no-store. Service variables: `GA_ID`, `MIXPANEL_TOKEN`, `BETTERLOOP_KEY`. Missing or invalid identifiers leave the corresponding provider disabled.
- Betterloop script uses `/sdk.js?v=20261030`, `includePaths` and `shutdown({discard:true})`; the coordinator must release that compatible SDK before live configuration.
- No text capture, session replay, advertising features, arbitrary URL/title or identity fields. Analytics identifiers are created only after permission and removed on withdrawal. Already received events cannot be recalled by a browser opt-out.

## Live acceptance remaining

The coordinator owns the existing dashboards, project/stream selection, Google enhanced-measurement settings, service variables, deployment and actual provider receipt. Do not fill missing configuration with another product's identifiers or describe intercepted responses as genuine receipt. Preserve existing service data, authentication and financial gates.

## This product

This adds an owned normal public landing page at the existing API origin. It does not instrument the installed extension, Store page, user browsing, page capture or accepted packages. The landing page truthfully separates the prepared update from the currently published Store version. `/privacy` remains a policy-only page without the analytics script.

Node24 website HTTP test passes: `node --experimental-sqlite --test test/website.test.js` from backend. Final actual-server UI command: `node qa/check-website-analytics-http.mjs` from the repository root (24 browser checks). Logs: `qa/website-analytics-http.log`, `qa/website-analytics-browser.log`. No extension build/package command was run; installed1.0.5/dist and separate1.0.6 candidate remain unchanged.

Existing rollout from backend: `railway up --service webskins-api --detach`. Preserve the marketplace volume/keys and existing Store owner action.

## Remaining activation dependency

Portfolio O9 Chrome recovery unblocks matching Google/Mixpanel dashboard setup, then the owned API landing rollout and real receipts. Installed extension, accepted packages and owner-only Store publication remain unchanged. The single pending connection action is in the portfolio READINESS O9; no duplicate owner request or live receipt claim is made here. Source/local acceptance above remains valid.
