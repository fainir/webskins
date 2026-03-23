// Claude Messages API wrapper for WebSkins

const API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `You are WebSkins AI, an expert web designer that transforms website appearances with CSS.

You receive a simplified HTML structure of the current webpage and a user's description.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences):
{
  "css": "/* Your CSS rules here */",
  "name": "Short creative name (2-3 words)",
  "description": "Brief description of changes (1-2 sentences)",
  "suggestions": ["Follow-up idea 1", "Follow-up idea 2"]
}

CRITICAL CSS RULES — follow these exactly:

1. COVERAGE: Style EVERY visible area — body, header, nav, main content, sidebar, footer, cards, buttons, inputs, links, images, modals, dropdowns, scrollbars. Unstyled areas look broken.

2. SELECTORS: Use broad selectors aggressively:
   - \`body\`, \`*\`, \`html\` for global resets (font, color scheme, background)
   - \`header, nav, [role="banner"]\` for navigation areas
   - \`main, article, section, [role="main"]\` for content
   - \`button, [role="button"], input[type="submit"], a.btn\` for interactive elements
   - \`input, textarea, select\` for form fields
   - \`a, a:visited, a:hover\` for links (all states!)
   - \`img, video, svg\` for media
   - \`::-webkit-scrollbar\` for scrollbars
   - \`::selection\` for text selection
   Use the specific selectors from the DOM structure PROVIDED, but also include broad fallbacks.

3. !important: Use \`!important\` on EVERY property. You are overriding an existing website's styles — without !important, most rules will be ignored.

4. COLORS: When changing the color scheme, ensure:
   - Text is readable against its background (use contrast ratio > 4.5:1)
   - Links are distinguishable from regular text
   - Hover states are visible
   - Focus outlines are present for accessibility
   - Borders/dividers match the new palette

5. TYPOGRAPHY: When changing fonts, set font-family on \`body, *\` with !important and include a web-safe fallback stack.

6. COMPLETENESS: A good skin has 50-150+ CSS rules. If you generate fewer than 30 rules, you're missing major areas of the page.

7. TRANSITIONS: Add \`transition: all 0.2s ease !important;\` to interactive elements for polish.

8. PRESERVE FUNCTION: Never hide content, disable scrolling, or break layout. Never set \`display: none !important\`, \`pointer-events: none\`, or \`overflow: hidden\` on body/main containers.

9. DARK THEMES: If making a dark theme, you MUST override backgrounds on EVERY container — not just body. Modern sites have explicit backgrounds on divs, cards, modals, dropdowns, tooltips, etc. Miss one and you get white-on-white text.

10. CONSISTENCY: Use CSS custom properties at the top of your CSS for theme colors:
    \`:root { --ws-bg: #1a1a2e; --ws-text: #eee; --ws-accent: #e94560; ... }\`
    Then reference them: \`background: var(--ws-bg) !important;\``;

const EVALUATION_PROMPT = `You are a meticulous visual QA reviewer for a website skin. You can see a screenshot of the result AND the page's DOM structure.

Your job: find every visual problem and fix it. Be ruthless — users expect a polished, complete transformation.

CHECK EACH OF THESE (mark as OK or NEEDS FIX):
1. COVERAGE: Are there unstyled white/default areas? (headers, footers, sidebars, modals, dropdowns, cards)
2. TEXT READABILITY: Can ALL text be read? Check: headings, body text, captions, labels, placeholders, links
3. CONTRAST: Do buttons/links/interactive elements have visible hover/focus states?
4. INPUTS: Are form fields (inputs, textareas, selects, checkboxes) themed?
5. SCROLLBARS: Are scrollbars themed to match? (::-webkit-scrollbar)
6. IMAGES: Do images look right? (borders, shadows, filters if theme calls for it)
7. CONSISTENCY: Does the color palette feel unified? Any clashing areas?
8. BORDERS & DIVIDERS: Are they themed or still default gray?
9. HOVER STATES: Do cards/buttons/links change on hover?
10. SHADOWS & DEPTH: Does the design have appropriate depth (box-shadows, layers)?

Respond with ONLY a valid JSON object:
{
  "css": "/* COMPLETE CSS — ALL rules, not just fixes. This replaces the old CSS entirely. */",
  "name": "Same or updated skin name",
  "description": "What was improved in this iteration",
  "issues_found": ["list of issues you found and fixed"],
  "issues_remaining": ["any issues you couldn't fix with CSS alone"],
  "suggestions": ["Ideas for the user to try next"],
  "quality_score": 7
}

QUALITY SCORING:
- 1-3: Major areas unstyled, broken readability, page looks partially done
- 4-6: Most areas themed but inconsistencies, some readability issues
- 7-8: Good coverage, readable, cohesive. Minor polish needed
- 9-10: Publication-ready. Complete, polished, cohesive, accessible

The CSS MUST be COMPLETE — it replaces ALL previous CSS. Include everything that works plus your fixes. Aim for 50-150+ rules for thorough coverage.`;

export async function generateSkin(apiKey, model, pageStructure, prompt, existingCss) {
  const messages = [];

  let userContent = `Here is the simplified HTML structure of the current webpage:\n\n${pageStructure}\n\n`;

  if (existingCss) {
    userContent += `Current skin CSS already applied:\n\`\`\`css\n${existingCss}\n\`\`\`\n\n`;
    userContent += `User wants to modify: ${prompt}`;
  } else {
    userContent += `Create a skin based on this description: ${prompt}`;
  }

  messages.push({ role: 'user', content: userContent });

  return callClaude(apiKey, model, SYSTEM_PROMPT, messages);
}

export async function evaluateSkin(apiKey, model, screenshotBase64, currentCss, originalPrompt, pageStructure) {
  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: screenshotBase64,
          },
        },
        {
          type: 'text',
          text: `Original user request: "${originalPrompt}"

Page DOM structure:
${pageStructure}

Current CSS applied (${currentCss.split('\n').length} lines):
\`\`\`css
${currentCss}
\`\`\`

Review the screenshot above. Find EVERY visual issue and produce an improved, COMPLETE CSS that fixes them all. Be thorough — check text readability, unstyled areas, hover states, inputs, scrollbars, etc.`,
        },
      ],
    },
  ];

  return callClaude(apiKey, model, EVALUATION_PROMPT, messages);
}

export async function chatRefine(apiKey, model, pageStructure, chatHistory, newMessage) {
  const messages = [];

  // Build conversation from history — skip system messages and the last user message
  // (we re-add it below with page context)
  for (const msg of chatHistory) {
    if (msg.role === 'system') continue;
    if (msg.role === 'user') {
      messages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      const content = msg.skinData
        ? JSON.stringify({
            css: msg.skinData.css,
            name: msg.skinData.name || 'Skin',
            description: msg.skinData.description || '',
            suggestions: msg.skinData.suggestions || [],
          })
        : msg.content;
      messages.push({ role: 'assistant', content });
    }
  }

  // Remove the last user message (it was just pushed by popup before sending)
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      messages.splice(i, 1);
      break;
    }
  }

  // Add new message with page context
  messages.push({
    role: 'user',
    content: `Page structure:\n${pageStructure}\n\nUser request: ${newMessage}\n\nProvide COMPLETE updated CSS (not just the diff). Use !important on every property.`,
  });

  return callClaude(apiKey, model, SYSTEM_PROMPT, messages);
}

async function callClaude(apiKey, model, systemPrompt, messages) {
  const body = {
    model,
    max_tokens: 32000,
    system: systemPrompt,
    messages,
    thinking: {
      type: 'enabled',
      budget_tokens: 16000,
    },
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  // With extended thinking, find the text block (not the thinking block)
  let text = '';
  for (const block of data.content || []) {
    if (block.type === 'text') {
      text = block.text;
      break;
    }
  }
  if (!text) text = data.content?.[0]?.text || '';

  // Parse JSON from response (handle markdown code fences)
  let jsonStr = text;
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1];
  }

  try {
    return JSON.parse(jsonStr.trim());
  } catch {
    // Use brace-counting to find the first complete JSON object
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.substring(start, i + 1));
          } catch { break; }
        }
      }
    }
    throw new Error('Failed to parse AI response as JSON');
  }
}
