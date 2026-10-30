# WebSkins optional website analytics - accepted October 30

Google Analytics, Mixpanel and Betterloop are configured and live-accepted on the owned public API landing page. This instruments only https://webskins-api-production.up.railway.app/, not the installed extension, Store page or websites the user browses. Existing installed1.0.5, accepted dist, separate1.0.6 Store candidate and marketplace data/keys remain unchanged.

## Final production acceptance

- Existing-image Railway deployment `b3fe9a8a-c498-409e-a4b2-2a1578d70862` is SUCCESS. It reuses the accepted `cb7e0fc1` image and `/data`, with only the two matching public Google/Mixpanel identifiers added. No source upload/build, private API credential or paid resource was created. Health/policy return200 and public assets match accepted source. [Release readback](analytics-runtime-release.log).
- Google property561625458 / stream16238098301 belongs to the existing ai-tools account. Its website is the actual API landing origin. Enhanced measurement was explicitly disabled and the saved stream reopened/visually verified; the public Google tag has no enhanced event collectors.
- Mixpanel project4079107, “WebSkins website,” belongs to the existing Nir organization, US residency and Asia/Jerusalem reporting. This separate website project avoids mixing extension browsing with public website usage. Only its public write token is used.
- Betterloop uses the existing portfolio self-project and approved origin; quotas stay unchanged. The shared accepted SDK supports exact includePaths and discard shutdown. No replay, autocapture, advertising or text/form capture is enabled.

Actual own-site Chrome contexts at375px and1440px receive genuine Google HTTP204, Mixpanel HTTP200/body1 and Betterloop HTTP200/ok. No vendor response is intercepted. Exactly one manual Google pageview and one Betterloop pageview are sent after opt-in; payloads contain only the product, exact public path and random consented device identifier. Query/hash sentinel, identity, form values and private work are absent.

Default off, withdrawal, accessible identifier/cookie cleanup, disabled Google flag, reload, saved-allow policy exclusion and DNT/GPC pass. Both consent screenshots were visually reviewed; no overflow, page errors or unrelated own-site write occurred. These are provider transport acknowledgements; downstream dashboard processing is a separate outcome.

[Actual live result](analytics-live-all.log), [phone](analytics/live-all-375.jpg), [desktop](analytics/live-all-1440.jpg). The bounded runner is `node qa/check-analytics-live.mjs /Users/nirfeinstein/Documents/shelf/node_modules/playwright/index.mjs`, with matching public IDs in `WEBSKINS_QA_GA_ID` and `WEBSKINS_QA_MIXPANEL_TOKEN`. It waits for the asynchronously loaded analytics stylesheet before activating real controls. No repeated provider test is needed without a changed release or new concern.

## Retained source and actual-server checks

All24 intercepted real-server UI checks pass at375/1440: no vendors before permission; sanitized links; supported fixed events only; stop/discard and identifier cleanup; saved withdrawal/reload; DNT/GPC; blocked storage; opt-in before configuration; failed withdrawal while delayed configuration remains; late SDK completion after withdrawal; missing settings; and saved allowance on a private surface. Dialog focus returns to Analytics choices. Provider doubles in these earlier tests are source/UI proof, separate from the genuine result above.

[Phone source UI](analytics/public-375.png), [desktop source UI](analytics/public-1440.png), [HTTP log](website-analytics-http.log), [browser log](website-analytics-browser.log). Source command: `node qa/check-website-analytics-http.mjs`. Node24 website HTTP tests passed from backend with `node --experimental-sqlite --test test/website.test.js`. No extension build/package command was run.

Runtime configuration `GET /analytics-config.json` is no-store and exposes only gaId, mixpanelToken and betterloopKey. Variables are `GA_ID`, `MIXPANEL_TOKEN`, `BETTERLOOP_KEY`; missing/invalid identifiers leave a provider off. `/privacy` is a policy-only surface without analytics. The landing page truthfully separates the prepared update from the currently published Store version. Existing Store submission remains owner-only.

Earlier Betterloop-only receipt is retained as historical partial proof in [its log](analytics-live-partial.log); the three-provider release above supersedes its incomplete activation status.
