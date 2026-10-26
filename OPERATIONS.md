# WebSkins release and recovery

The readiness source targets Node24 and extension1.0.3. Build the extension with `npm ci`,
`npm test`, and `npm run build`. Load/package only `dist`, which contains no backend environment
files, database, management keys or local user data. Chrome Web Store publication and an actual
installed-extension check are separate release steps; a fixture is not evidence of that check.

The backend requires a persistent SQLite `DATABASE_URL` and a random `RATE_LIMIT_SECRET`.
Keep both in the hosting environment. It makes a verified private SQLite copy before schema
synchronization, applies additive schema changes, makes a current-schema copy, and only then
listens. Migration failure stops startup. `/health` checks the real schema, configuration and
backup freshness and returns503 on a problem. Deployment must wait for this endpoint to pass.

## Ownership

Public author IDs/display names are labels, not authentication. Extension1.0.3 creates a random
private key for each publication and retains it locally before uploading; the server stores
only its SHA-256 hash. API publication requires the private key and the key-retention protocol
header, so older clients must update before publishing. Public reads never expose the key or
its hash. Deletion requires the private key in an Authorization header. Preserve extension data
if you want to manage your publications. Pending publication keys remain locally retained if
network or storage completion fails; never send them in chat or put them in a public issue.

Legacy skins without a private ownership proof remain readable/installable and cannot be
claimed or deleted using a public author ID. An operator must independently verify any
moderation/recovery request. There is no public ownership-reset endpoint.

## Limits and CSS

Publication is limited to10 per network/day,250 total/day and10000 stored skins. CSS is capped
at100000 bytes and thumbnail data at100000 characters. Writes also have a per-process network
rate limit. Likes/installs deduplicate each skin/network/day in the database; these are usage
counters, not independently verified people. HMAC network identifiers are retained for quota
accounting and old metric rows are pruned after90 days on startup.

The shared CSS parser removes resource URLs, imports, webfonts, raw syntax and page-variable
indirection (safe variables defined by the skin are resolved to literal values), including escaped forms and image-set strings. Generation uses literal values
and system fonts to match this policy. On first AI use for each origin, the user sees the
Anthropic destination, visible-text/layout and screenshot disclosure, selected model and up to
five paid requests. Settings can revoke consent. Local application/removal needs no AI call.
Visual reviews check the intended active tab before/after capture and stop if navigation changes.

## Restore

Snapshots are in the private `backups` directory beside the SQLite file; seven verified copies
are retained. Daily copies run while the service is up. This protects recovery within the
volume; it does not claim an independent cloud copy or zero data loss after volume loss.
Keep an independently secured copy of the volume if that failure must be covered.

Stop the service, retain the damaged database for investigation, and restore a chosen verified
copy into a new private path. Point `DATABASE_URL` there and retain the rate secret. Start the
current release, which backs up and checks/migrates before listening. Verify `/health`, row
counts and a known private management key in a separate test deployment before changing live
routing. Review publications/deletions since the snapshot; never assume the snapshot contains
later deletion requests. `backend/test/api.test.js` exercises a real fresh restore and proves
private ownership survives it using disposable synthetic rows only.

New generation defaults to Claude Sonnet 5.5 for balanced CSS/design quality and cost. Claude Opus 5.5 remains an explicit advanced option. Retired or unknown saved model IDs resolve to the current Sonnet default before a provider request; API keys, saved skins and explicit current model choices are retained.

Sonnet5.5 uses medium reasoning effort for the balanced design option; explicit Opus5.5 uses high effort. The wrapper rejects token-limited, refused or otherwise incomplete responses before parsing or applying CSS. A real synthetic Sonnet5.5 check returned local-only, sanitized CSS with body, button, input and focus coverage in18 seconds (1252input/2093output tokens, about$0.0234 at standard base token rates). This is provider-wrapper evidence, not an installed-extension test.
