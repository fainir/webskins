# WebSkins Social Media Content Pack

> Ready-to-post content for all platforms. Replace `[CWS_LINK]` with the Chrome Web Store URL.
> Insert screenshots/GIFs where you see `[BEFORE_AFTER_IMG]`.
> GitHub: https://github.com/fainir/webskins

---

## 1. Reddit Posts

### r/chrome -- Extension Features Focus

**Suggested flair:** Extension

**Title:** I built a free Chrome extension that redesigns any website from a text prompt -- no CSS needed

**Body:**

I just shipped WebSkins, a Chrome extension that transforms how any website looks using plain English.

You type something like "dark academia reading mode" or "make this look like a retro arcade" and it generates a full visual makeover of whatever page you're on.

**How it works:**

- Open the popup on any site and type your prompt
- AI generates custom CSS and applies it to the page instantly
- It then screenshots the result, sends it back to the AI, and asks "what needs improving?"
- This loops 2-3 times automatically, so each skin gets polished before you see it
- After that, you can chat with it: "make the text bigger" or "tone down the colors"

Skins save per-domain and auto-apply every time you visit that site. So once you set up YouTube to look the way you want, it stays that way.

There's also a community marketplace where people share their best skins. You can browse what others have made and install them in one click.

**The pricing model:** It's free. You bring your own Claude API key (BYOK). Each skin generation costs roughly $0.01 in API usage. No subscription, no account needed for the extension itself.

Chrome Web Store: [CWS_LINK]

[BEFORE_AFTER_IMG]

I've been using it on Reddit, YouTube, and Wikipedia daily. Would love to hear what sites you'd want to reskin first.

---

### r/ClaudeAI -- Claude API and Refinement Loop Focus

**Suggested flair:** Discussion

**Title:** Built a Chrome extension that uses Claude's vision capabilities in a multi-cycle refinement loop to generate website skins

**Body:**

I want to share something I built that leans heavily on Claude's API -- specifically the vision + text generation combo in a feedback loop.

**The problem:** When you ask any LLM to generate CSS for a website, the output is hit-or-miss. The AI has no idea what the page actually looks like after applying its CSS. It's generating blind.

**The solution -- a visual refinement loop:**

1. User types a prompt like "cyberpunk neon theme for GitHub"
2. Claude generates CSS based on the prompt and the page's DOM structure
3. The extension injects the CSS and takes a screenshot of the result using `chrome.tabs.captureVisibleTab`
4. That screenshot gets sent back to Claude along with the prompt: "Here's what your CSS produced. Evaluate it against the original request and generate an improved version."
5. Steps 3-4 repeat for 2-3 cycles

The difference between cycle 1 and cycle 3 is dramatic. First pass often has color clashes, missed elements, or readability issues. By cycle 3, Claude has seen its own output and fixed the problems.

After the automated cycles, there's a chat mode where the user can make targeted requests: "the sidebar is too bright" or "increase the font size on article text." Claude gets the current screenshot with each message, so it always knows the current state.

**Technical notes:**
- Uses the Messages API with `claude-sonnet-4-20250514` by default (configurable)
- DOM structure is captured and sent as context alongside the screenshot
- Each full generation (3 cycles + a couple chat messages) runs about $0.01-0.03 in API costs
- Extension uses Manifest V3, all API calls go through the background service worker
- BYOK model -- users provide their own API key

The screenshot-as-feedback pattern feels like it could be useful for a lot of other tools beyond website styling. Any time an AI generates something visual, letting it see the output and iterate is a massive quality boost.

Chrome Web Store: [CWS_LINK]
Source code: https://github.com/fainir/webskins

[BEFORE_AFTER_IMG]

Curious what other use cases people see for this kind of visual feedback loop with Claude.

---

### r/webdev -- Technical Architecture Focus

**Suggested flair:** Showoff Saturday

**Title:** How a screenshot feedback loop makes AI-generated CSS actually usable -- open source Chrome extension

**Body:**

I've been working on WebSkins, a Chrome extension that generates CSS skins for any website from natural language prompts. I want to talk about the architecture because the approach to getting reliable CSS out of an LLM might be useful for other projects.

**The core problem:** Single-pass CSS generation from AI is unreliable. The model doesn't know the page's visual state, so it guesses at selectors, gets specificity wrong, and produces color combinations that look terrible in context.

**The multi-cycle refinement approach:**

```
User prompt
    |
    v
[Claude API] -- generates CSS based on prompt + DOM snapshot
    |
    v
[Content script] -- injects CSS into page
    |
    v
[Background worker] -- captures screenshot via chrome.tabs.captureVisibleTab
    |
    v
[Claude API] -- receives screenshot + original prompt
               "Evaluate this result and generate improved CSS"
    |
    v
(repeat 2-3 cycles)
    |
    v
[Chat mode] -- user sends follow-up refinements with live screenshots
```

**Why this works:** By cycle 2-3, Claude has seen what its CSS actually produces. It catches its own mistakes -- color contrast issues, missed elements, broken layouts, elements that didn't get styled because the selectors were wrong.

**Stack:**
- Vanilla JS (no framework for the popup -- keeps it fast and small)
- Tailwind CSS compiled at build time (no CDN, MV3 doesn't allow it)
- Chrome Manifest V3 with background service worker
- Claude Messages API via direct fetch from the service worker
- Content script handles CSS injection, DOM snapshot capture, and auto-apply on page load
- Backend: Express + Prisma + PostgreSQL on Railway for the community marketplace

**Things I learned building this:**

1. DOM snapshots need to be selective. Sending the full DOM of a complex page blows past token limits fast. I capture a simplified structure with key selectors and class names.

2. `chrome.tabs.captureVisibleTab` only captures the viewport. For long pages, the skin might look great above the fold but break below it. The chat mode helps users fix these cases iteratively.

3. CSS specificity battles with existing site styles are the biggest source of bugs. Wrapping generated styles with high-specificity selectors helps but isn't bulletproof.

4. MV3's service worker lifecycle is annoying for stateful operations. The worker can go dormant mid-generation. I had to build state persistence into Chrome storage so it can resume.

Source: https://github.com/fainir/webskins
Extension: [CWS_LINK]

[BEFORE_AFTER_IMG]

Happy to dive deeper into any part of the architecture.

---

### r/SideProject -- Indie Maker Story

**Suggested flair:** Share My Project

**Title:** I shipped WebSkins -- AI that transforms any website's look from a text prompt. Free, open source, no subscription.

**Body:**

Just launched my side project and wanted to share the story.

**What it is:** A Chrome extension where you describe how you want a website to look ("dark mode with warm tones", "minimalist reading view", "retro terminal aesthetic") and AI generates a complete visual transformation. It saves per-site and auto-applies when you revisit.

**Why I built it:** I spend a lot of time on sites that are either visually noisy or just boring to look at. Dark Reader is great but it's one-dimensional -- dark mode and that's it. I wanted the ability to completely reimagine how a site looks, without writing CSS myself.

**The build:**
- ~2 weeks from idea to Chrome Web Store submission
- Chrome extension (Manifest V3) with vanilla JS
- Claude API for the AI generation (users bring their own key)
- Express + Prisma + PostgreSQL backend for the community marketplace
- The key insight was adding a screenshot feedback loop: the AI generates CSS, screenshots the result, and improves it over 2-3 cycles. This is what makes the output actually good instead of random.

**Business model:** Free. BYOK (bring your own API key). Each skin costs about $0.01 in Claude API usage. I have zero server costs for the core functionality -- only the marketplace backend runs on Railway.

The BYOK model is interesting because it means I can give the extension away completely free with no usage limits. Users pay Anthropic directly for what they use. My only cost is the marketplace database.

**What's next:**
- Growing the community marketplace with curated skins for popular sites
- Considering a "skin challenges" feature where the community votes on the best skin for a given site
- Maybe a gallery page showcasing the most creative transformations

Chrome Web Store: [CWS_LINK]
GitHub: https://github.com/fainir/webskins

[BEFORE_AFTER_IMG]

Happy to answer questions about the tech, the launch process, or anything else.

---

### r/InternetIsBeautiful -- Visual Transformations Focus

**Suggested flair:** Website

**Title:** This free tool lets you completely redesign how any website looks by describing it in plain English

**Body:**

WebSkins is a Chrome extension that transforms any website's appearance from a text prompt.

Some examples of what it can do:

- "Make YouTube look like a cozy library with warm wood tones" -- turns the whole interface into a warm, inviting reading space
- "Give Wikipedia a real book feel with serif fonts and cream pages" -- makes it look like you're reading a physical book
- "Cyberpunk neon theme for GitHub" -- dark background with electric blue and pink accents on all the code and UI
- "Make Google look like a 1990s GeoCities page" -- complete with that early internet aesthetic
- "Clean minimal Reddit with lots of whitespace" -- strips away the visual noise

[BEFORE_AFTER_IMG]

It uses AI that actually looks at what it created and improves it over multiple cycles, so the results are surprisingly polished. After the initial generation, you can chat with it to fine-tune specific parts.

There's a community marketplace where people share their best skins, so you can browse and install transformations other people have made.

Free Chrome extension: [CWS_LINK]

It's been fun just experimenting with different prompts and seeing how creative the transformations get.

---

## 2. Hacker News

**Title:** Show HN: WebSkins -- Transform any website's appearance with natural language (Chrome ext)

**Body:**

I built a Chrome extension that uses Claude AI to generate CSS skins for any website from text prompts.

The interesting technical bit: single-pass CSS generation from LLMs is unreliable because the model can't see the result. WebSkins runs a multi-cycle refinement loop -- generate CSS, screenshot the page, send the screenshot back to the AI with "evaluate and improve this," repeat 2-3 times. The quality difference between cycle 1 and cycle 3 is significant.

After the automated refinement, there's a chat mode for targeted follow-ups ("make the sidebar darker", "increase contrast on the body text"). Each message includes a fresh screenshot so the AI always has current visual context.

Other details:
- BYOK (bring your own Claude API key) -- no subscription, ~$0.01 per skin in API costs
- Skins persist per-domain and auto-apply on revisit
- Community marketplace for sharing skins (Express + Prisma + PostgreSQL backend)
- Chrome Manifest V3, vanilla JS, no framework overhead
- The DOM is captured as a simplified snapshot alongside the screenshot to give the AI structural context for selector generation

The visual feedback loop pattern -- letting an AI see its own output and iterate -- seems broadly applicable beyond CSS generation. Anywhere you're asking a model to produce something visual, closing the loop with a screenshot makes the output dramatically better.

Chrome Web Store: [CWS_LINK]
GitHub: https://github.com/fainir/webskins

---

## 3. Twitter/X

### Launch Announcement Thread (7 tweets)

**Tweet 1 (hook):**

I just launched WebSkins -- a Chrome extension that lets you redesign any website with a text prompt.

"Make YouTube look like a cozy library"
"Give Wikipedia a real book feel"
"Cyberpunk neon GitHub"

It uses AI that actually looks at what it created and fixes it. Here's how it works:

**Tweet 2:**

The problem with asking AI for CSS: it's guessing blind. It has no idea what the page looks like after applying its styles.

WebSkins fixes this with a visual feedback loop:

Generate CSS -> Screenshot the result -> Send screenshot back to AI -> "Improve this" -> Repeat

2-3 cycles = polished output.

**Tweet 3:**

[BEFORE_AFTER_IMG]

Here's a YouTube transformation. Left is stock YouTube, right is after the prompt "warm dark mode with wood grain textures."

The AI caught its own color contrast issues by cycle 2 and fixed the sidebar styling by cycle 3.

**Tweet 4:**

After generation, you can keep chatting:

"Make the headers bigger"
"Add more contrast to the sidebar"
"Change the accent color to teal"

Every message includes a fresh screenshot, so the AI always knows the current state. It's like pair-designing with an AI that can actually see.

**Tweet 5:**

Skins save per-domain and auto-apply when you revisit.

Your custom YouTube stays custom. Your clean Wikipedia stays clean. Every site remembers its skin.

There's also a community marketplace -- browse and install skins other people have made.

**Tweet 6:**

The pricing model: free.

You bring your own Claude API key. Each skin costs about $0.01 in API usage. No subscription. No account required. No tracking.

I pay $0 to run the core product. Users pay Anthropic directly for what they use.

BYOK is underrated as a business model for AI tools.

**Tweet 7:**

Try it:

Chrome Web Store: [CWS_LINK]
Source code: https://github.com/fainir/webskins

Built with vanilla JS, Chrome MV3, Claude API, and an Express/Prisma/PostgreSQL backend for the marketplace.

I want to see what skins you create -- reply with screenshots.

---

### Standalone Tweet 1 -- Community Marketplace Feature

The WebSkins community marketplace is live.

Browse skins other people made for popular sites. Install in one click. No prompting needed.

Someone already made a "Dark Forest" Reddit skin that's beautiful.

[CWS_LINK]

[BEFORE_AFTER_IMG]

---

### Standalone Tweet 2 -- Chat Refinement Feature

My favorite WebSkins feature is chat mode.

After the AI generates a website skin, you can keep talking to it:

"The sidebar is too bright"
"Make the code blocks stand out more"
"I like it but make everything slightly warmer"

It sees a fresh screenshot with every message. Iteration is instant.

[BEFORE_AFTER_IMG]

---

### Standalone Tweet 3 -- BYOK Model

Hot take: more AI tools should use the BYOK (bring your own key) model.

WebSkins uses your own Claude API key. Each website skin costs ~$0.01 in API usage.

- No subscription
- No usage limits
- No vendor lock-in
- I have zero marginal cost per user

Users get a free tool. I get zero infrastructure burden. Everyone wins.

[CWS_LINK]

---

## 4. Product Hunt

### Tagline (60 chars max)

```
AI website skins from text prompts. Free, open source.
```
(55 characters)

### Short Description (260 chars max)

```
Transform any website's appearance by describing what you want. WebSkins uses Claude AI with a multi-cycle screenshot refinement loop to generate polished CSS skins. Chat to fine-tune. Skins auto-apply per site. Free with BYOK (bring your own API key).
```
(255 characters)

### Full Description

**WebSkins transforms any website's visual appearance using natural language.**

Describe what you want -- "dark mode with warm tones," "retro 90s aesthetic," "clean minimalist reading view" -- and AI generates a complete CSS skin that reshapes the entire page.

**What makes it different:**

Most AI CSS tools generate once and hope for the best. WebSkins uses a multi-cycle visual refinement loop:

1. You write a prompt describing the look you want
2. AI generates custom CSS and applies it to the page
3. The extension takes a screenshot of the result
4. That screenshot goes back to the AI: "Evaluate this against the original request and improve it"
5. This repeats 2-3 times automatically

By the final cycle, the AI has seen its own output and fixed color clashes, missed elements, and readability issues. The quality difference versus single-pass generation is dramatic.

**After the automated refinement, chat mode lets you fine-tune:**
- "Make the headers bigger"
- "Tone down the sidebar"
- "Change the accent to forest green"

Every message includes a live screenshot, so the AI always has current visual context.

**Key features:**
- Works on any website
- Skins save per-domain and auto-apply on revisit
- Community marketplace to share and discover skins
- Chat mode for iterative refinement
- BYOK -- bring your own Claude API key (~$0.01 per skin)
- No subscription, no account required
- Open source on GitHub

**Built with:** Vanilla JavaScript, Chrome Manifest V3, Claude API, Express + Prisma + PostgreSQL for the marketplace backend.

### Maker Comment

Hey Product Hunt! I built WebSkins because I wanted to do more than just toggle dark mode on websites. I wanted to say "make this site feel like a cozy reading nook" or "give this a cyberpunk aesthetic" and have it actually happen.

The breakthrough was the visual feedback loop. Early versions just asked Claude to generate CSS in a single pass, and the results were inconsistent -- color clashes, broken layouts, unstyled elements. When I added the screenshot-evaluate-improve cycle, everything changed. Letting the AI see what it produced and fix its own mistakes made the output genuinely usable.

The BYOK model means the extension is completely free with no usage limits. You bring your own Claude API key, and each skin costs about a penny in API usage. I wanted to remove every possible barrier to trying it.

I'm most excited about the community marketplace. Right now there are starter skins for popular sites, but I can't wait to see what creative themes people come up with. The best skins will be ones I never imagined.

Would love your feedback, and I'd love to see screenshots of what you create with it.

### Suggested Topics/Tags

1. Chrome Extensions
2. Artificial Intelligence
3. Design Tools

---

## 5. LinkedIn Post

I just launched WebSkins -- an open source Chrome extension that transforms any website's visual appearance using natural language and AI.

You describe what you want ("professional dark theme," "warm reading mode," "minimalist layout") and it generates a complete CSS transformation. The key differentiator is a multi-cycle visual refinement loop: the AI generates CSS, the extension takes a screenshot of the result, and the screenshot goes back to the AI for evaluation and improvement. This happens 2-3 times automatically before the user sees the final result.

The technical insight: single-pass visual generation from AI is unreliable because the model has no feedback on what it produced. Closing the loop with screenshots -- letting the AI see its own output -- dramatically improves quality. This pattern extends well beyond CSS to any domain where AI generates visual artifacts.

The extension is free with a BYOK (bring your own API key) model. Users provide their own Claude API key, and each skin costs approximately $0.01 in API usage. There's no subscription, no user tracking, and the full source code is on GitHub.

There's also a community marketplace where users can share and discover skins for popular websites.

For the technically curious: Chrome Manifest V3, vanilla JavaScript (no framework), Tailwind CSS at build time, and an Express/Prisma/PostgreSQL backend for the marketplace.

Chrome Web Store: [CWS_LINK]
GitHub: https://github.com/fainir/webskins

[BEFORE_AFTER_IMG]

If you spend hours on websites that strain your eyes or just look dated, give it a try. I'd be interested to hear what sites you'd want to transform first.

#ChromeExtension #AI #WebDevelopment #OpenSource #SideProject #ClaudeAI

---

## 6. Indie Hackers

**Title:** Launched WebSkins -- AI website skin generator. Free, BYOK, zero marginal cost.

**Body:**

Hey IH! I just launched WebSkins and wanted to share the story, the tech, and the business model thinking.

**What it is**

A Chrome extension that transforms any website's appearance from a text prompt. Type "cozy dark mode" or "retro arcade theme" and AI generates a complete visual makeover. Skins persist per-site and auto-apply on revisit. There's a community marketplace for sharing skins.

**The journey**

I've been using Dark Reader for years but always wanted more control. Not just "dark mode on/off" but full creative control over how sites look. The idea crystallized when I realized Claude's vision capabilities could close the feedback loop -- the AI could actually see what its CSS looked like and fix problems.

The build took about two weeks. I kept the stack intentionally simple: vanilla JS for the extension (no React, no framework), Tailwind compiled at build time, and Express/Prisma/PostgreSQL for the marketplace backend.

The breakthrough moment was adding the screenshot refinement loop. V1 just did single-pass CSS generation, and the results were mediocre. V2 added the loop (generate -> screenshot -> evaluate -> improve -> repeat) and the quality jumped dramatically. Letting the AI see its own output is the entire difference between "cool demo" and "actually usable tool."

**The business model**

This is where it gets interesting for the IH crowd.

BYOK -- Bring Your Own Key. Users provide their own Claude API key. Each skin costs about $0.01 in API usage, paid directly to Anthropic.

What this means:
- The extension is completely free
- I have zero marginal cost per user
- No need for usage tiers, subscriptions, or payments infrastructure
- Users have no vendor lock-in -- their API key works with other tools too
- My only running cost is the marketplace database on Railway

The tradeoff: I'm not capturing recurring revenue. But I'm also not spending money, which means the project is sustainable indefinitely even at zero income. If the marketplace grows enough, there are natural monetization paths (featured skins, premium marketplace listings, curated collections) that don't require changing the core free model.

**Launch day metrics**

[Fill in after launch: installs, marketplace skins published, engagement]

**What I'd do differently**

[Fill in: lessons learned from launch]

Chrome Web Store: [CWS_LINK]
GitHub: https://github.com/fainir/webskins

Happy to answer questions about the tech, the BYOK model, or anything else.

---

## 7. Dev.to Social Blurb

**Short version (for sharing the Dev.to article):**

I wrote up how I built WebSkins -- a Chrome extension that uses Claude AI's vision capabilities in a multi-cycle screenshot feedback loop to generate CSS skins for any website. The post covers the architecture, the refinement loop, MV3 gotchas, and why single-pass AI CSS generation doesn't work.

Read the full technical deep-dive: [DEV.TO_ARTICLE_LINK]

Try the extension: [CWS_LINK]
Source: https://github.com/fainir/webskins

---

**Longer version (for platforms that support more text):**

New post: "How I Built an AI Website Skin Generator with Chrome MV3 + Claude API"

The interesting problem: AI-generated CSS is unreliable when the model can't see the result. WebSkins solves this with a visual feedback loop -- generate CSS, screenshot the page, send the screenshot back to Claude, improve, repeat. 2-3 cycles of self-correction produce dramatically better output than a single pass.

The post covers:
- The multi-cycle refinement architecture
- Screenshot capture with chrome.tabs.captureVisibleTab
- DOM snapshot strategies (full DOM blows past token limits)
- CSS specificity battles with existing site styles
- MV3 service worker lifecycle pain points
- The community marketplace backend (Express + Prisma + PostgreSQL)

[DEV.TO_ARTICLE_LINK]

---

## 8. Discord Messages

### Anthropic Discord -- #showcase

**WebSkins -- AI website skins powered by Claude's vision capabilities**

I built a Chrome extension that uses Claude to transform any website's appearance from text prompts. The interesting part is the visual feedback loop:

1. User describes what they want
2. Claude generates CSS
3. Extension injects CSS and takes a screenshot
4. Screenshot goes back to Claude: "evaluate and improve"
5. Repeat 2-3 cycles

Letting Claude see its own output through screenshots and self-correct makes the difference between random CSS and polished skins. The vision + generation combo is powerful for this.

After the automated cycles, there's a chat mode where users can refine further -- each message includes a fresh screenshot so Claude always has visual context.

BYOK model -- users bring their own API key. Each skin runs about $0.01 in API usage.

Chrome Web Store: [CWS_LINK]
GitHub: https://github.com/fainir/webskins

[BEFORE_AFTER_IMG]

Would love feedback from the community, especially on how the refinement prompts could be improved.

---

### Web Dev Communities

**WebSkins -- open source Chrome extension that generates CSS skins for any site from text prompts**

Built a tool that takes a natural language description ("dark mode with neon accents", "minimal reading view", "retro terminal") and generates complete CSS that reskins whatever page you're on.

The trick that makes it work: a screenshot feedback loop. The AI generates CSS, the extension screenshots the result, and the screenshot goes back to the AI for evaluation and improvement. 2-3 cycles of self-correction produces way better output than a single generation pass.

Stack: vanilla JS, Chrome MV3, Claude API (BYOK), Express + Prisma + PostgreSQL for the community marketplace.

Some things I learned building it:
- DOM snapshots need to be simplified or you blow past token limits
- CSS specificity battles with existing site styles are the #1 source of bugs
- MV3 service workers can go dormant mid-generation -- you need state persistence
- `captureVisibleTab` only gets the viewport, not the full page

It's free and open source:
[CWS_LINK]
https://github.com/fainir/webskins

[BEFORE_AFTER_IMG]

---

### Chrome Extension Communities

**New extension: WebSkins -- AI-powered website skin generator**

Just published WebSkins on the Chrome Web Store. It lets you type a description of how you want any website to look and generates a complete visual transformation using AI.

Features:
- Natural language to CSS generation with multi-cycle AI refinement
- Chat mode for fine-tuning after initial generation
- Skins save per-domain and auto-apply on revisit
- Community marketplace to share and discover skins
- BYOK (bring your own Claude API key) -- completely free

Technical notes for the extension dev crowd:
- Manifest V3 with background service worker
- Content script handles CSS injection and DOM capture
- Screenshots via `chrome.tabs.captureVisibleTab` for the AI feedback loop
- State persistence in Chrome storage to handle service worker lifecycle
- Tailwind CSS compiled at build time (no CDN in MV3)

Would appreciate any feedback on the extension experience. The MV3 service worker lifecycle was the hardest part to get right -- curious how others are handling long-running async operations.

[CWS_LINK]
https://github.com/fainir/webskins

[BEFORE_AFTER_IMG]

---

## 9. Email Template -- Blogger/YouTuber Outreach

**Subject line options (pick the one that fits best):**

- A: This AI Chrome extension redesigns any website from a text prompt
- B: Chrome extension that lets AI see and fix its own CSS output
- C: Thought this might interest your audience -- AI website skin generator

**Body:**

Hi [NAME],

I'm [YOUR_NAME], and I just launched an open source Chrome extension called WebSkins that I think would resonate with [THEIR_AUDIENCE_DESCRIPTION].

**What it does:** You describe how you want any website to look in plain English, and AI generates a complete visual transformation. "Dark mode with warm tones," "retro 90s aesthetic," "clean minimal reading view" -- it works on any site.

**What makes it different from "just ask ChatGPT for CSS":** WebSkins runs a visual feedback loop. It generates CSS, takes a screenshot of the result, sends the screenshot back to the AI, and says "evaluate and improve this." After 2-3 cycles of self-correction, the output is significantly more polished than single-pass generation. [THIS_IS_THE_HOOK -- it's a novel approach that's easy to demonstrate visually.]

**Why I think it fits [THEIR_CHANNEL/BLOG]:** [SPECIFIC_REASON -- e.g., "You've covered several AI productivity tools recently and this adds a visual/creative dimension that's different from the usual text-generation tools" or "Your Chrome extension reviews always get great engagement and this one has a strong visual demo" or "Your audience of web developers would appreciate the technical architecture behind the refinement loop."]

**Key facts:**
- Free Chrome extension, open source on GitHub
- BYOK model (users bring their own Claude API key, ~$0.01 per skin)
- Community marketplace for sharing skins
- Works on any website

**What I can provide:**
- Early access / walkthrough call if helpful
- Before/after screenshots and demo videos for [NUMBER] popular sites
- Technical deep-dive on the architecture if your audience is developer-focused
- Any assets or information you need

Chrome Web Store: [CWS_LINK]
GitHub: https://github.com/fainir/webskins
Demo video: [DEMO_VIDEO_LINK]

No pressure at all -- just thought it might be interesting for [THEIR_CHANNEL/BLOG]. Happy to answer any questions.

Best,
[YOUR_NAME]
[YOUR_TWITTER/WEBSITE]

---

## 10. One-liner Descriptions

### Bio / Profile (casual, identity-focused)

```
Creator of WebSkins -- transform any website's look with a text prompt.
```

### Email Signature (professional, understated)

```
WebSkins: AI-powered website skin generator for Chrome (free, open source) -- [CWS_LINK]
```

### Casual Mention (conversational, for comments/replies)

```
I built a Chrome extension that lets you describe how you want any website to look and AI redesigns it for you. It's called WebSkins.
```

### Pitch (value-focused, for intros and submissions)

```
WebSkins is a free Chrome extension that transforms any website's appearance using natural language -- powered by Claude AI with a multi-cycle visual refinement loop.
```

### Technical (architecture-focused, for developer contexts)

```
WebSkins: Chrome MV3 extension using Claude's vision API in a generate-screenshot-evaluate-improve loop to produce CSS skins from natural language prompts.
```
