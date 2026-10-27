# WebSkins Privacy Policy

Last updated: October 27, 2026

## Purpose and AI consent

WebSkins changes website appearance with CSS. Applying or removing a saved skin does not require AI. Before AI use on each website origin, WebSkins asks for permission to send visible page text and layout, your design prompt, and visual-review screenshots to Anthropic. Those captures may include private messages, photos or other information visible on the page. Settings can revoke this page access. Each generation or refinement can make up to five paid requests using your Anthropic account.

## Anthropic API key

Starting with version 1.0.4, the API key uses session-only Chrome storage restricted to trusted extension contexts. It is kept in memory for the current browser session, rather than intentionally written to persistent extension storage. You must enter it again after Chrome restarts. The Remove API key control clears the extension's copy; it does not revoke the key at Anthropic.

Earlier versions stored the key in Chrome local extension storage. When version 1.0.4 first loads the key, it migrates that value into session storage and removes the local copy only after verifying the session copy. If migration fails, it preserves the original value and does not return it for an AI request. Removing the key clears both copies.

Your key is sent directly to Anthropic to authenticate your requests. It is not sent to the WebSkins marketplace server. Anthropic's own data-handling policies apply to the prompts, page captures and screenshots it receives.

## Data on your device

Chrome local extension storage retains your model and skin preferences, saved CSS skins, design prompts and chat history, per-origin consent choices, marketplace votes, a random author identifier, and private publication-management keys. Saved local data is not a secure vault. Protect access to your browser profile. Raw captured page layout and screenshots are used during AI processing; WebSkins does not intentionally save those raw captures as a local history.

## Public marketplace

Publishing is optional and has a separate confirmation. A published skin can expose its name, description, CSS, prompt, target domain, chosen display name and author identifier. If a thumbnail is supplied, that image is also uploaded. Do not publish private page details or confidential prompts.

The marketplace receives a private management key for each publication and retains only its hash for ownership verification. The extension keeps the private management key locally. A public author ID or display name does not prove ownership. Older publications without this proof require independent operator review for removal.

## Network information and retention

Marketplace requests include the network information needed to handle an HTTP request. The server uses secret-keyed HMAC network identifiers for abuse prevention, daily quotas and deduplicated like/install counts. Old metric rows are pruned after 90 days when the service starts. Counts are usage metrics, not verified unique people.

Publications remain on the marketplace until removed. The service retains up to seven verified recovery copies; recent data may remain in those backups until they rotate out. Operators must review removals when recovering a backup. Hosting infrastructure and Anthropic have their own data-handling policies. WebSkins does not sell user data or use page captures for advertising.

## Removal and control

Clear All Skins removes local saved skins and active-skin selections. It does not unpublish marketplace copies or remove your API key, consent settings or private publication keys. Revoke AI page access clears the origin approvals. Remove API key clears the locally held API credential.

Uninstalling the extension removes its local Chrome storage, including private publication keys. It does not remove public marketplace records or copies saved by other users. A publication can be removed through the marketplace API with its private management key. Contact support for help; requests without that key require independent ownership verification. Never send API keys or private management keys in email or public issues.

## Contact and limited use

Questions and data-removal requests: fainir2006@gmail.com.

WebSkins limits its handling of user data to the appearance-generation, local skin-management and optional marketplace features described here. Its use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.
