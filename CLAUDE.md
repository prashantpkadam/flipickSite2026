# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Flipick corporate website — a static HTML/CSS/JS site with no build step, bundler, or framework. Deployed to Apache on Hostinger; served locally via `npx http-server`.

## Development

```bash
# Start local dev server (port 5501, no caching)
npx http-server -p 5501 -c-1
```

There is no build, lint, or test command. Changes are live on save — just reload the browser.

Preview server is configured in `.claude/launch.json` as `flipick-site`.

## Architecture

### CSS load order (specificity matters)

`style.css` → `components.css` → `responsive.css`

- **style.css** — CSS custom properties (`--brand: #444CEC`, `--night`, `--ink`, etc.), reset, typography, base component styles (`.hero`, `.closing`, `.btn`, `.wrap`)
- **components.css** — Page-specific styles, utility classes, feature cards, grids. Organized by page with comment headers.
- **responsive.css** — All media queries. Because it loads last, same-specificity rules here win by source order.

When adding a class to override an existing component rule (e.g. `.fcard h3` at 0,1,1), use a compound selector (`.fcard h3.your-class`) to beat the base specificity. Single-class selectors (0,1,0) lose to most component rules.

### Includes system

Header and footer are HTML fragments in `includes/`. The `includes.js` script fetches them at runtime and injects into `#header-placeholder` / `#footer-placeholder`, replacing `[[ROOT]]` tokens with `./` or `../` based on page depth.

Pages in the root use `./assets/...` paths; pages in `pages/` use `../assets/...`. The `[[ROOT]]` token handles this automatically in includes.

### URL routing

`.htaccess` rewrites clean URLs (`/pricing` → `/pages/pricing.html`). Pages set `data-page="slug"` on `<body>` for nav highlighting via `navigation.js`.

Root-level pages (index.html, 404.html) use absolute paths (`/assets/...`). Pages in `pages/` use relative paths (`../assets/...`).

### Key JS modules (all vanilla, no imports)

| Script | What it does |
|---|---|
| `config.js` | Central demo URL (Calendly). All `[data-demo-link]` elements get their href from `FLIPICK.demoUrl`. |
| `geo-pricing.js` | Detects country via ipapi.co, swaps `data-inr`/`data-usd` attributes on `.geo-cloak` elements. Exposes `window.FLIPICK_CURRENCY` for calculator. |
| `video-player.js` | Maps `data-vid` keys to video URLs (YouTube or GCS MP4). Stamps thumbnails from `THUMB_MAP`, handles click-to-play. |
| `calculator.js` | Credit pricing calculator on the pricing page. Reads `FLIPICK_CURRENCY` for INR/USD display. |

Script load order on most pages: `config.js` → `geo-pricing.js` → `includes.js` → `navigation.js` → `main.js` → page-specific scripts.

### Geo-aware pricing

Elements showing prices use `data-inr` and `data-usd` attributes with a `geo-cloak` class:
```html
<b class="geo-cloak" data-inr="₹50 / recipient" data-usd="$0.50 / recipient">₹50 / recipient</b>
```
`geo-pricing.js` swaps the text content based on detected country and removes the `geo-cloak` class. The default (pre-swap) content should show INR.

### Video placeholders

Videos use the `.vid[data-vid]` pattern with thumbnail, badge, overlay, and play button:
```html
<div class="vid rv" data-vid="key-name">
  <img class="vid-thumb" src="..." alt="..." loading="lazy">
  <span class="badge">LABEL</span>
  <div class="ov lower3"><b>Title</b><span>SUBTITLE</span></div>
  <a href="#" class="play" aria-label="Play video"></a>
</div>
```
Add entries to `VIDEO_MAP` and `THUMB_MAP` in `video-player.js` for each new `data-vid` key. Use `class="vid small rv"` for smaller inline videos (in grid2 layouts).

### Reveal animations

Elements with class `rv` fade in when they enter the viewport (IntersectionObserver adds class `in`). A 3-second fallback timer forces all `rv` elements visible. Each page includes this observer in an inline `<script>` at the bottom.

### Closing CTA pattern

Every page ends with a standard closing section:
```html
<section class="closing" aria-label="Call to action">
  <div class="wrap">
    <h2>Heading with <span class="serif-i">italic accent.</span></h2>
    <p>Subtext paragraph.</p>
    <div class="ctas-center">
      <a class="btn btn-ghost" data-demo-link href="...">Book a demo</a>
    </div>
  </div>
</section>
```

### Campaign / landing pages

Campaign pages (`ai-video-ld.html`, `ai-video-marketing.html`, `vvp-usa.html`) use a `.camp-hero` hero variant and section padding utilities:

| Class | Purpose |
|---|---|
| `.vvp-section` | Standard section padding (48px 0) |
| `.vvp-section-sm` | Compact section padding (28px 0) |
| `.vvp-section-flush` | Minimal section padding (16px 0) |

**Logo strip on campaign pages** — use `.section-pad-flush.section-bordered` (not `.section-white`) to get white background + bottom border, since campaign pages don't have a `section-white` following the logo strip:
```html
<section class="section-pad-flush section-bordered">
  <div class="wrap">
    <div class="logostrip logostrip-lg rv">...</div>
  </div>
</section>
```

### Grid system

| Class | Desktop | Tablet (768–1023px) | Mobile (≤767px) |
|---|---|---|---|
| `.grid2` | 2 columns | 2 columns | 1 column |
| `.grid3` | 3 columns | 2 columns | 1 column |
| `.grid4` | 4 columns | 2 columns | 1 column |

Do not add VVP-specific overrides for `.grid4` in the VVP responsive block — the global breakpoints already handle all three sizes correctly.

### VVP interactive demo widget (`pages/vvp-usa.html`)

The VVP USA page (`/vvp-usa`) has a live API-driven video generation demo. Key elements:

```
id="stage"   — .demostage container (9:16 portrait, aspect-ratio: 9/16, width: 280px)
id="seg"     — .vvp-seg tab switcher (Retail / Communications)
id="ldBar"   — progress bar element inside stage
id="ldStatus"— loading message text
id="ldCount" — countdown text (≈ 60s → ≈ 0s)
```

**API config (inline `<script>` in vvp-usa.html):**
```javascript
var API_BASE   = 'https://cinematic-1.onrender.com/api/v1/public';
var API_KEY    = 'UlNEMTVARmxpcGlja0NpbmVtYXRpYw==';
var PROJECT_ID = 'b98b6c06-55bf-4fc8-9160-1afbd467461a';
```

**Tab config (`CONF` object):**
- `retail` — Dealer address / Dealer phone fields
- `comms` — Policy/plan / Renewal date fields (Communications tab is hidden via `.hidden-tab` class on its button)

**Loader:** `startPulse()` runs a 60-second linear countdown (`dur=60000, t0=Date.now()`). Updates every 200ms. Shows `≈ Ns` remaining.

**Result display:** `showDone(mp4Url)` appends a `<video class="vvp-result-video">` element directly to `#stage`. This class uses `object-fit: cover` to fill the portrait container, and `object-fit: contain` in fullscreen (via `:fullscreen` pseudo-class) to preserve 9:16 ratio on landscape screens.

**Polling:** After API submission, polls every 10s for render completion via `GET /renders/{id}`.

**Key CSS classes for the demo widget:**
| Class | Purpose |
|---|---|
| `.demostage` | 9:16 portrait container, `position:relative`, `overflow:hidden` |
| `.demostage.loading` | Shows loading overlay (spinner, progress bar, status text) |
| `.demostage.done` | Shows completion state |
| `.vvp-demo` | Two-column grid: demostage left, form right. Stacks to single column at ≤820px. |
| `.vvp-result-video` | Absolute-positioned video fills demostage; `contain` in fullscreen |
| `.vvp-seg button.hidden-tab` | Hides a tab (Communications tab is hidden) |

## Pages

| Page | URL | Notes |
|---|---|---|
| `index.html` | `/` | Root page, absolute asset paths |
| `pages/AI-video-platform.html` | `/ai-video-platform` | |
| `pages/lms.html` | `/lms` | |
| `pages/ppt-to-scorm.html` | `/ppt-to-scorm` | |
| `pages/pricing.html` | `/pricing` | Has credit calculator |
| `pages/solutions.html` | `/solutions` | |
| `pages/how-it-works.html` | `/how-it-works` | |
| `pages/company.html` | `/company` | |
| `pages/lp-hr-ld.html` | `/lp-hr-ld` | Campaign LP |
| `pages/ai-video-ld.html` | `/ai-video-ld` | Campaign LP |
| `pages/ai-video-marketing.html` | `/ai-video-marketing` | Campaign LP |
| `pages/vvp-usa.html` | `/vvp-usa` | VVP US campaign with live demo |
| `pages/privacy.html` | `/privacy` | |
| `pages/terms.html` | `/terms` | |

## Deployment

- Hosted on Hostinger (shared Apache)
- `.htaccess` handles clean URLs and custom 404
- HTTPS redirect is commented out in `.htaccess` — uncomment when SSL is active
- Canonical domain: `https://flipick.com/`
