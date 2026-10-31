# WebSkins Privacy Policy

Last updated: October 31, 2026

## Purpose and AI consent

WebSkins changes website appearance with CSS. Applying or removing a saved skin does not require AI. Before AI use on each website origin, WebSkins asks for permission to send rendered page text and layout (which can include content outside the current viewport), your design prompt, and visual-review screenshots to Anthropic. Those captures may include private messages, photos or other information visible on the page. Settings can revoke this page access. Starting with version 1.0.7, choose Free included Claude or My Claude key (BYOK). A new per-site consent is required for each mode. Included mode sends bounded page text/layout and your instruction through Nir’s shared Betterloop AI service to Anthropic Haiku 5.5. It makes one text-only request, with no screenshots or automatic reviews. BYOK sends directly to Anthropic and can make up to five paid requests using your Anthropic account. Included availability is limited by daily installation/network limits and a shared operator budget; it is not guaranteed and no payment is taken when it is exhausted.

## Anthropic API key

Starting with version 1.0.4, the API key uses session-only Chrome storage restricted to trusted extension contexts. It is kept in memory for the current browser session, rather than intentionally written to persistent extension storage. You must enter it again after Chrome restarts. The Remove API key control clears the extension's copy; it does not revoke the key at Anthropic.

Earlier versions stored the key in Chrome local extension storage. When version 1.0.4 first loads the key, it migrates that value into session storage and removes the local copy only after verifying the session copy. If migration fails, it preserves the original value and does not return it for an AI request. Removing the key clears both copies.

When BYOK is selected, your key is sent directly to Anthropic to authenticate your requests. It is not sent to the WebSkins marketplace server. Anthropic's own data-handling policies apply to the prompts, page captures and screenshots it receives.

## Data on your device

Version 1.0.5 excludes hidden elements and form-control text/values from DOM capture. Captures are bounded to 500 nodes, eight levels and 30,000 characters to limit unnecessary data and provider input. Visual-review screenshots can still include information visible on the active page.

Chrome local extension storage retains your model and skin preferences, saved CSS skins, design prompts and chat history, per-origin consent choices, marketplace votes, a random author identifier, and private publication-management keys. Saved local data is not a secure vault. Protect access to your browser profile. A random installation identifier is also retained locally for included-AI quotas. It is a quota hint, not verified identity. Raw captured page layout and screenshots are used during AI processing; WebSkins does not intentionally save those raw captures as a local history.

## Public marketplace

Opening the popup or browsing community skins sends the current website domain to the marketplace to find matching skins. That lookup does not include the full URL, page contents or your API key.

Publishing is optional and has a separate confirmation. A published skin can expose its name, description, CSS, prompt, target domain, chosen display name and author identifier. If a thumbnail is supplied, that image is also uploaded. Do not publish private page details or confidential prompts.

The marketplace receives a private management key for each publication and retains only its hash for ownership verification. The extension keeps the private management key locally. A public author ID or display name does not prove ownership. Older publications without this proof require independent operator review for removal.

## Network information and retention

Marketplace and included-AI requests include the network information needed to handle an HTTP request. The shared AI service retains protected installation/network identifiers, request identifiers and usage/reservation amounts to enforce limits and prevent duplicate provider work. Prompt/result content is not logged or stored in plaintext; completed included results have encrypted recovery access for one hour to recover a lost response; expired ciphertext is deleted opportunistically and may remain in routine recovery copies until those rotate. Unknown provider outcomes retain a reservation and are never automatically reissued. No provider key is included in the extension for free mode.

Marketplace requests include the network information needed to handle an HTTP request. The server uses secret-keyed HMAC network identifiers for abuse prevention, daily quotas and deduplicated like/install counts. Old metric rows are pruned after 90 days when the service starts. Counts are usage metrics, not verified unique people.

Publications remain on the marketplace until removed. The service retains up to seven verified recovery copies; recent data may remain in those backups until they rotate out. Operators must review removals when recovering a backup. Version 1.0.5 and earlier popup screens load typography and icon fonts from Google Fonts, which receives the network information needed for those requests. Starting with version 1.0.6, the popup uses system fonts and packaged icons without Google Fonts requests. Hosting infrastructure, Google Fonts (for earlier versions) and Anthropic have their own data-handling policies. WebSkins does not sell user data or use page captures for advertising.

## Removal and control

Clear All Skins removes local saved skins and active-skin selections. It does not unpublish marketplace copies or remove your API key, consent settings or private publication keys. Revoke AI page access clears the origin approvals. Remove API key clears the locally held API credential. Removing the key or revoking AI access cancels in-progress generation and refinement where possible. Data already transmitted may already be processed or billed by Anthropic.

Uninstalling the extension removes its local Chrome storage, including private publication keys. It does not remove public marketplace records or copies saved by other users. A publication can be removed through the marketplace API with its private management key. Contact support for help; requests without that key require independent ownership verification. Never send API keys or private management keys in email or public issues.

## Optional public website analytics

The public WebSkins landing page can load Google Analytics, Mixpanel and Betterloop only after you allow them in Analytics choices on that website. They remain off by default. If allowed, those services receive basic page and fixed button events, with random device identifiers or cookies. Query strings, fragments, form values, page captures, prompts, API keys and publication keys are not sent. Advertising features, text capture and session replay are disabled. Do Not Track and Global Privacy Control keep website analytics off; Analytics choices can withdraw a previous choice and clear this website's analytics identifiers. Website analytics are not added to the extension or the websites you browse. The separate privacy page and marketplace API do not load these trackers.

## Contact messages

The website contact form sends your name, email address and message through Nir's Betterloop support service and Resend for delivery to fainir2006@gmail.com. Your email is used as Reply-To so Nir can answer from the support inbox. Delivery and abuse-prevention records may be retained by the support service, and emails remain in the support mailbox as needed to handle your request. No automatic confirmation email or response deadline is promised. Do not submit API keys, publication-management keys, passwords or private page captures. You may instead email the same address directly; you can ask about access or removal of your contact message there. The contact page does not load website analytics.

## Contact and limited use

Questions and data-removal requests: fainir2006@gmail.com.

WebSkins limits its handling of user data to the appearance-generation, local skin-management and optional marketplace features described here. Its use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.
