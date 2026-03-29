# WebSkins Launch Week Marketing Plan

## Day 1 — Launch Day

### 1. Reddit Posts

**r/chrome (1.3M members)**
> **Title:** I built a Chrome extension that uses AI to reskin any website with natural language
>
> Hey r/chrome! I just launched WebSkins — a free Chrome extension that lets you describe how you want any website to look (like "dark mode with neon accents" or "cozy reading theme") and it uses AI to generate a complete visual transformation.
>
> How it works:
> - Type a prompt like "make YouTube look like a retro 90s site"
> - AI generates custom CSS and applies it instantly
> - It takes a screenshot, evaluates the result, and refines it automatically
> - You can chat with the AI to fine-tune ("make the headers bigger")
> - Skins save per-site and auto-apply when you revisit
>
> There's also a community marketplace to share and discover skins.
>
> It uses your own Claude API key so there's no subscription — just pay-per-use (about $0.01 per skin).
>
> Chrome Web Store: [link]
>
> Would love feedback!

**r/ChatGPT or r/ClaudeAI (post to both)**
> **Title:** I used Claude's API to build a Chrome extension that redesigns any website from a text prompt
>
> Built this over the past couple weeks. You describe how you want a site to look, and Claude generates CSS to completely transform it. The cool part — it takes a screenshot of the result, sends it back to Claude, and asks "how can this be improved?" Multiple refinement cycles = much better results than a single prompt.
>
> You can also chat with it after: "make the sidebar darker" or "increase font size" and it iterates.
>
> Free extension, BYOK (bring your own API key). Link: [CWS link]
>
> [Include before/after screenshot]

**r/webdev (2.2M members)**
> **Title:** Built an AI-powered CSS skin generator Chrome extension — here's how the multi-cycle refinement works
>
> I built WebSkins, a Chrome extension that generates custom CSS for any website from natural language prompts. What makes it different from a simple "ask AI for CSS" approach is the refinement loop:
>
> 1. User writes prompt → AI generates CSS
> 2. Extension injects CSS, takes a screenshot
> 3. Screenshot sent back to AI: "evaluate and improve"
> 4. Repeat 2-3 cycles → polished result
> 5. User can then chat to fine-tune
>
> Stack: Vanilla JS, Chrome MV3, Claude API (via user's own key), Express + Prisma backend for community marketplace.
>
> The screenshot-based feedback loop was the key insight — single-pass CSS generation is hit-or-miss, but letting the AI see what it produced makes a huge difference.
>
> Source: [GitHub link]
> Extension: [CWS link]

**r/SideProject (200K members)**
> **Title:** Launched WebSkins — AI that transforms any website's look with a text prompt
>
> Just shipped my Chrome extension that lets anyone redesign any website using natural language. No CSS knowledge needed.
>
> Key features:
> - AI generates CSS from your description
> - Multi-cycle improvement (screenshot → evaluate → refine)
> - Chat mode for tweaking
> - Skins auto-apply per domain
> - Community marketplace to share skins
>
> Free + BYOK model (user provides their own Claude API key).
>
> Took about 2 weeks to build. Happy to answer questions about the architecture or approach!
>
> [CWS link]

---

### 2. Hacker News

**Show HN post:**
> **Title:** Show HN: WebSkins – AI-powered website skin generator (Chrome extension)
>
> I built a Chrome extension that transforms any website's appearance using natural language prompts and Claude AI.
>
> What makes it different from asking ChatGPT for CSS:
> - Multi-cycle refinement: generates CSS → takes screenshot → sends back to AI → improves → repeat
> - Chat mode: keep refining with conversational follow-ups
> - Per-domain persistence: skins auto-apply when you revisit sites
> - Community marketplace: share and discover skins
>
> It uses your own Claude API key (BYOK), so no subscription — each skin costs about $0.01 in API usage.
>
> Chrome Web Store: [link]
> GitHub: [link]
>
> The key technical insight was the visual feedback loop — letting the AI see a screenshot of what it generated dramatically improves output quality compared to blind CSS generation.

---

### 3. Twitter/X Thread

> 🧵 I just launched WebSkins — a Chrome extension that lets you redesign any website with a text prompt.
>
> Describe how you want a site to look → AI generates a complete visual transformation.
>
> Here's what it does and why it's different 👇

> 1/ The problem: You visit sites that look ugly, hard to read, or just boring. Dark Reader helps, but what if you want more than dark mode?
>
> What if you could say "make YouTube look like a cozy bookshelf" and it just... works?

> 2/ That's what WebSkins does. Type a prompt, hit Generate, and AI creates custom CSS that completely reskins the page.
>
> [Before/after screenshot of YouTube]

> 3/ But here's the trick — single-pass AI CSS generation is unreliable. So WebSkins does something different:
>
> Generate CSS → Screenshot the result → Send screenshot back to AI → "How can this be improved?" → Apply fixes → Repeat
>
> 2-3 cycles = dramatically better results.

> 4/ After generation, you can chat with it:
> - "Make the headers bigger"
> - "Add more contrast"
> - "Change the accent color to blue"
>
> It's like pair-designing with an AI.

> 5/ Skins save per-domain and auto-apply when you revisit. Your custom YouTube will look great every time.
>
> There's also a community marketplace — discover and install skins made by others.

> 6/ It's free. Uses your own Claude API key (BYOK model). Each skin costs about $0.01 in API usage.
>
> Try it: [Chrome Web Store link]
>
> I'd love to see what skins you create! Reply with screenshots 👀

---

### 4. Product Hunt

**Tagline:** AI-powered website skins from natural language prompts

**Description:**
> WebSkins lets you transform any website's appearance by describing how you want it to look. Powered by Claude AI with a unique multi-cycle refinement loop: generate → screenshot → evaluate → improve.
>
> Features:
> - Natural language to CSS skin generation
> - Multi-cycle visual quality improvement
> - Chat mode for iterative refinement
> - Per-domain skin persistence with auto-apply
> - Community marketplace for sharing skins
>
> Free Chrome extension. BYOK (bring your own Claude API key).

**Maker comment:**
> Hey Product Hunt! I built WebSkins because I was tired of websites that look the same. I wanted to say "make this site look like a cozy reading nook" and have it happen.
>
> The key innovation is the visual feedback loop — the AI doesn't just generate CSS blindly. It sees a screenshot of what it created and improves it through multiple cycles.
>
> Would love your feedback and to see what creative skins you come up with!

---

## Day 2 — Demo Content

### Create and post 3-5 demo videos/GIFs showing:
1. **YouTube → Retro 90s theme** (most relatable site, fun transformation)
2. **Wikipedia → Beautiful reading mode** (practical use case)
3. **GitHub → Dark neon cyberpunk** (appeals to developers)
4. **Reddit → Clean minimal redesign** (large community overlap)
5. **Google → Complete brand makeover** (instantly recognizable)

Post these as:
- Twitter/X individual posts with video
- Reddit posts in relevant subreddits (r/InternetIsBeautiful, r/oddlysatisfying if visually striking)
- YouTube Shorts / TikTok if you have accounts

---

## Day 3 — Developer Communities

### Dev.to Article
> **Title:** How I Built an AI Website Skin Generator with Chrome MV3 + Claude API
>
> Technical deep-dive covering:
> - Architecture (popup, background worker, content script)
> - The multi-cycle refinement loop
> - Screenshot capture with chrome.tabs.captureVisibleTab
> - Claude API integration for CSS generation
> - Community marketplace with Express + Prisma + PostgreSQL
> - Lessons learned building a Chrome MV3 extension

### Discord Communities
Post in:
- **Anthropic Discord** (Claude community) — share in showcase/projects channel
- **Chrome Extensions** Discord servers
- **Web Development** Discord servers (Theo's server, Fireship, etc.)

### Indie Hackers
> **Title:** Launched WebSkins — AI website skin generator (Chrome extension)
>
> Share the journey, tech stack, and launch metrics. IH loves BYOK/API-key business models because they have zero marginal cost.

---

## Day 4 — Seed the Marketplace

Create and publish 10-15 high-quality skins for popular sites:

| Site | Skin Name | Description |
|------|-----------|-------------|
| YouTube | Dark Neon | Cyberpunk dark theme with neon accents |
| YouTube | Cozy Reader | Warm, bookshelf-inspired reading mode |
| Reddit | Clean Minimal | Remove visual clutter, focus on content |
| Reddit | Dark Forest | Deep green nature-inspired theme |
| GitHub | Midnight Code | Deep dark theme with blue accents |
| Wikipedia | Book Mode | Serif fonts, cream background, like a real book |
| Twitter/X | Calm Blue | Soft blue palette, reduced visual noise |
| Google | Retro Terminal | Green-on-black terminal aesthetic |
| HN | Modern HN | Clean, contemporary redesign |
| Amazon | Simple Shop | Remove clutter, focus on products |

This ensures new users find immediate value in the marketplace.

---

## Day 5 — Outreach

### Email/DM tech bloggers and YouTubers:
Target small-to-mid creators who cover Chrome extensions, AI tools, or web development:

**Template:**
> Hi [Name],
>
> I just launched WebSkins — a free Chrome extension that uses AI to transform any website's appearance from a text prompt. You describe how you want a site to look, and it generates a complete visual makeover.
>
> What makes it unique: it takes a screenshot of the result and feeds it back to the AI for refinement — so the output keeps getting better through multiple cycles.
>
> I think it'd make a great topic for your audience because [specific reason related to their content].
>
> Chrome Web Store: [link]
> Demo video: [link]
>
> Happy to provide any info or answer questions!
>
> [Your name]

**Target list (research channels that cover browser extensions):**
- Fireship (if you can get featured)
- Jeff Su (productivity tools)
- Kevin Stratvert
- Chrome extension review channels
- AI tool roundup newsletters (Ben's Bites, The Rundown AI, TLDR)

---

## Day 6 — Community Engagement

- Reply to every comment on Reddit/HN/PH posts
- Answer questions, fix bugs reported by early users
- Share user-created skins on Twitter (with credit)
- Post "best community skins so far" roundup

---

## Day 7 — Retrospective + Next Push

- Compile launch week metrics (installs, marketplace skins, community engagement)
- Write a "Week 1 launch retrospective" for Indie Hackers or your blog
- Plan week 2: focus on the channels that drove the most installs
- Consider a "skin challenge" — ask users to create the best skin for a popular site, feature winners

---

## Ongoing (First Month)

### Chrome Web Store SEO
Make sure your listing includes these keywords naturally:
- "AI website theme"
- "custom website theme"
- "change website appearance"
- "dark mode AI"
- "website skin generator"
- "customize any website"
- "AI CSS generator"

### Track Metrics
- Chrome Web Store installs (developer dashboard)
- Marketplace skins published
- Reddit/HN post engagement
- GitHub stars (if open-sourced)

### Quick Wins
- Reply to every CWS review
- Fix bugs within 24 hours and push updates
- Add "Built with WebSkins" watermark option for shared skins (free marketing)
