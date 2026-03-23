# Design System Document: Editorial Chromaticism

## 1. Overview & Creative North Star: "The Digital Curator"
This design system is built to feel less like a utility tool and more like a high-end digital atelier. The Creative North Star is **"The Digital Curator"**—a philosophy that treats every browser modification as a piece of art. 

To break the "standard extension" mold, we move away from rigid, boxed-in grids. Instead, we utilize **intentional asymmetry**, allowing elements to breathe through expansive whitespace and overlapping "floating" containers. By prioritizing tonal depth over structural lines, the UI feels airy and weightless, as if the interface is gently resting on top of the user's web content.

---

## 2. Colors: Vibrancy Through Depth
Our palette balances a crisp, high-end base with high-energy "shocks" of color. 

### The Palette
- **Primary (Electric Indigo):** `#4647d3` — Use for core brand moments and primary actions.
- **Secondary (Bright Coral):** `#a03a0f` — A high-energy accent for secondary highlights.
- **Tertiary (Muted Orchid):** `#7f448c` — For creative flair and specialized categorization.
- **The Surface Foundation:** Our background is `#f5f7f9`, a "Digital White" that prevents eye strain while remaining crisp.

### The "No-Line" Rule
**Strict Prohibition:** Do not use 1px solid borders to define sections. 
Boundaries must be established through color-blocking or tonal shifts. Use `surface-container-low` (`#eef1f3`) to define a sidebar against a `surface` (`#f5f7f9`) background. This creates a "soft-edge" layout that feels modern and editorial.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following hierarchy to create depth:
1. **Base Layer:** `surface` (`#f5f7f9`)
2. **Sectioning:** `surface-container-low` (`#eef1f3`)
3. **Interactive Cards:** `surface-container-lowest` (`#ffffff`) — This creates a "pop" effect.
4. **Elevated Elements:** `surface-container-high` (`#dfe3e6`) — Use for inactive states or recessed wells.

### The "Glass & Gradient" Rule
To add "soul," primary CTAs should utilize a subtle linear gradient from `primary` (`#4647d3`) to `primary-container` (`#9396ff`). For floating overlays, apply a `backdrop-blur` (12px–20px) to semi-transparent surface tokens to achieve a frosted glass effect.

---

## 3. Typography: The Editorial Voice
We use **Plus Jakarta Sans** exclusively. Its wide apertures and modern geometric shapes provide a clean, approachable, yet premium feel.

- **Display (3.5rem - 2.25rem):** Use `display-lg` for "Hero" moments. Tighten letter-spacing (-0.02em) to give it an authoritative, editorial punch.
- **Headlines (2rem - 1.5rem):** Use for major section headers. These should feel like magazine titles—bold and clear.
- **Titles (1.375rem - 1rem):** Used for card headings and modal titles.
- **Body (1rem - 0.75rem):** Set `body-md` at 1.5x line height to maintain the "airy" feel.
- **Labels (0.75rem - 0.6875rem):** Use `on-surface-variant` (`#595c5e`) for secondary metadata to maintain a clean hierarchy.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often too "heavy" for a vibrant, light system. We prioritize **Tonal Layering**.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` (#ffffff) card on top of a `surface-container` (#e5e9eb) background. The change in brightness creates a "natural lift."
- **Ambient Shadows:** For floating elements (menus/modals), use a "Long Shadow" approach: `box-shadow: 0 12px 40px rgba(44, 47, 49, 0.06);`. The shadow color is a tinted version of `on-surface`, never pure black.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` (`#abadaf`) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: Fluid Primitives

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), 12px (`md`) corner radius. White text (`on-primary`). 
- **Secondary:** Surface-tinted. No border. Use `surface-container-highest` background with `primary` colored text.
- **Tertiary:** Pure text with `primary` color. Interaction state: subtle background highlight using `primary` at 8% opacity.

### Cards & Lists
- **Prohibition:** No divider lines between list items.
- **Layout:** Use `spacing-4` (1.4rem) as a vertical gap between items. 
- **Interaction:** On hover, a card should shift from `surface-container-lowest` to a subtle `surface-bright` or gain an ambient shadow.

### Selection & Inputs
- **Inputs:** Use `surface-container-low` as the field background. On focus, transition the background to `surface-container-lowest` and add a "Ghost Border" of `primary` at 20% opacity.
- **Chips:** Always pill-shaped (`full` roundedness). Use `secondary-container` (`#ffc4b1`) for high-energy selection states.

### Extension-Specific: "The Skin Previewer"
- **The Floating Dock:** Use Glassmorphism for the bottom navigation bar. `surface-container-lowest` at 80% opacity with a 24px backdrop-blur. This keeps the user's active "skin" visible even behind the UI.

---

## 6. Do's and Don'ts

### Do:
- **Use whitespace as a separator.** If in doubt, add more padding from the `spacing-6` or `spacing-8` scale.
- **Mix weights.** Pair a `headline-sm` (Bold) with a `body-md` (Regular) for high-contrast hierarchy.
- **Layer surfaces.** Nest white cards inside light grey containers to create a "tactile paper" effect.

### Don't:
- **Don't use 100% opaque borders.** They create "visual noise" and break the airy aesthetic.
- **Don't use pure black text.** Always use `on-background` (`#2c2f31`) to maintain a sophisticated, soft-contrast feel.
- **Don't clutter.** If the UI feels busy, convert a button into a "Ghost" variant or move metadata into a `label-sm` style.

---

## 7. Metrics & Scales
- **Base Radius:** `md` (0.75rem / 12px) for all primary containers and buttons.
- **Base Spacing:** Use `spacing-3` (1rem) as the atomic unit for internal padding.
- **Outer Margins:** Use `spacing-5` (1.7rem) for extension window margins to ensure content doesn't feel "cramped" by the browser edge.