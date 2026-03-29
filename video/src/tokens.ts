export const FPS = 30;
export const DURATION_SEC = 20;
export const TOTAL_FRAMES = FPS * DURATION_SEC; // 600

export const COLORS = {
  primary: "#4647d3",
  primaryLight: "#9396ff",
  accent: "#e94560",
  dark: "#0f0f1a",
  darkAlt: "#16213e",
  cyan: "#00ffff",
  white: "#ffffff",
  whiteAlpha: "rgba(255,255,255,0.9)",
  grayLight: "#8899aa",
  surface: "#f5f7f9",
};

export const FADE_IN = 12;
export const FADE_OUT = 10;

// Tighter timing — 20 seconds total, fast pace
export const SCENES = {
  intro: { start: 0, dur: 75 },             // 0-2.5s: Quick logo
  hn: { start: 65, dur: 150 },              // 2.2-7.2s: HN side-by-side
  youtube: { start: 205, dur: 150 },         // 6.8-11.8s: YouTube side-by-side
  wiki: { start: 345, dur: 150 },            // 11.5-16.5s: Wiki side-by-side
  cta: { start: 485, dur: 115 },             // 16.2-20s: CTA
};

export const SITES = [
  {
    name: "Hacker News",
    before: "/screenshots/hn-before.png",
    after: "/screenshots/hn-after.png",
    prompt: "Modern dark redesign with clean typography",
  },
  {
    name: "YouTube",
    before: "/screenshots/youtube-before.png",
    after: "/screenshots/youtube-after.png",
    prompt: "Deep purple dream theme with violet accents",
  },
  {
    name: "Wikipedia",
    before: "/screenshots/wiki-before.png",
    after: "/screenshots/wiki-after.png",
    prompt: "Book mode with serif fonts and cream paper",
  },
];
