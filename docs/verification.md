# Verification

Checked on 19 October 2026 using Node.js 24.18.0 and the existing Astro 7.4.0 installation.

## Passed

- Production build: `npm run build` generates a static homepage.
- Production preview: HTTP 200.
- All fifteen supplied titles, exact spelling and order, in three unranked lists.
- Single H1, labelled sections, valid Films/Books/Cities anchor targets, and a skip link.
- No rendered image placeholders, blank notes, or fabricated item links.
- Canonical URL, description, Open Graph and Twitter metadata, and original 1200 × 630 PNG social card.
- Zero production script tags and no third-party asset requests.
- Text/background contrast: body 12.46:1, muted text 5.42:1, links 5.93:1.
- An isolated build verified a sixth item, a note, a valid link, blank and invalid links, a captioned portrait, and a thumbnail. Images produce dimensioned WebP output and 1×/2× sources. Test content is excluded from the actual site.
- `git diff --check` and screenshot script syntax check.

## Browser checks and screenshots

Passed in Chrome against the production preview at 1440px, 390px, 320px, and 768px widths. All fifteen entries, all three visible navigation links and their destinations, the three-column/stacked layouts, absence of horizontal overflow, and visible keyboard focus were checked. The desktop and mobile screenshots were opened and visually inspected.

The same browser checks also passed against the deployed site at https://mattstirling-site.vercel.app/. The public page returns HTTP 200 without authentication, and the screenshots below were captured from that deployment. The custom domains still require DNS updates; their HTTPS and redirect checks will be completed after those changes.

The dependency-free capture script is ready to run in a local terminal with browser access:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4322
```

Leave preview running and, in another terminal inside this folder, run:

```sh
node scripts/capture-screenshots.mjs
```

If Astro selects a different port, set `SITE_URL` to the printed URL. For example in PowerShell:

```powershell
$env:SITE_URL = 'http://127.0.0.1:4323/'
node scripts/capture-screenshots.mjs
```

The script finds Chrome/Edge on Windows and Chrome on macOS/Linux. Set `CHROME_PATH` if needed, and choose an unused `CDP_PORT` (default 9222). It uses a fresh, ignored browser profile, checks 1440px, 390px, 320px and 768px layouts, all three navigation links, item counts, overflow, and visible keyboard focus. It saves:

- `docs/screenshots/desktop.png` — 1440 × 900.
- `docs/screenshots/mobile.png` — 390px-wide full-page capture.
- `docs/screenshots/checks.json` — browser check results.

View the captured [desktop screenshot](screenshots/desktop.png), [mobile screenshot](screenshots/mobile.png), and [browser check results](screenshots/checks.json).
