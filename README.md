# Matt Stirling

A quiet, single-page personal website for **https://www.mattstirling.com/**, built in the existing Astro project. Plain CSS, system fonts, one content file, no browser JavaScript, and no external asset requests. The three collections sit side by side on desktop and stack on phones.

[KK.org](https://kk.org/) informed the organisation around personal interests. The design, favicon, and text-only social card are original; no images or content were copied.

## Run locally

Use Node.js 24 LTS (`.nvmrc`) and npm. Run these commands **inside `website_v1`**, the folder containing `package.json`:

```sh
npm ci
npm run dev -- --background
```

Open the Local URL printed by Astro (normally http://localhost:4321). Manage the background server with `npm run astro -- dev status`, `npm run astro -- dev logs`, and `npm run astro -- dev stop`.

Build and inspect the production version:

```sh
npm run build
npm run preview
```

The static output is in `dist/`. Preview runs in the foreground; press Ctrl+C to stop it. No environment variables or hosting adapter are needed.

## Edit the collections

Edit [src/data/favourites.ts](src/data/favourites.ts). The `films`, `books`, and `cities` arrays preserve display order. Add a sixth object to any array without changing a component.

Every entry supports `title`, optional `note`, optional `href`, and optional `image`. For example:

```ts
{ title: 'City of God', note: 'Write your own note here.' },
```

Omit `note` or leave it blank to hide it. Add `href: 'https://…'` only after verifying the destination. Only complete HTTP(S) URLs become links; absent, blank, or placeholder links render as plain text.

**“The Spiral” remains unidentified.** Confirm the film before adding a director, year, poster, or link. All fifteen supplied titles are preserved, and the lists are unranked.

## Add your own photographs

No personal photograph was supplied, so the initial page has no photo area. Use photos you own or have permission to publish. Add a JPG, PNG, or WebP to `src/assets/`, then import it at the top of `src/data/favourites.ts`:

```ts
import portrait from '../assets/matt.jpg';
```

Replace the existing `personalPhoto` declaration with:

```ts
export const personalPhoto: (FavouriteImage & { caption?: string }) | null = {
  src: portrait,
  alt: 'Write a brief, accurate description of the photograph.',
  // caption: 'An optional, factual caption.',
  position: '50% 35%',
};
```

The portrait uses a 160 × 200px crop. Adjust `position` to keep the subject in frame. Set `personalPhoto` back to `null` to remove it.

To add a collection thumbnail, import that image in the same data file, then add `image: { src: importedImage, alt: 'An accurate description' }` to an entry. Thumbnails display at 64 × 88px. Optional `position` adjusts the crop. Astro generates WebP files at 1× and 2× resolution with intrinsic dimensions; collection images load lazily. Remove unnecessary EXIF/location metadata from source photos before committing them.

Colours, spacing, and breakpoints live in [src/styles/global.css](src/styles/global.css). Page metadata lives in [src/layouts/Layout.astro](src/layouts/Layout.astro). The social card is `public/social-card.png` (1200 × 630), with editable vector source at `src/assets/social-card.svg`.

## Deploy

The included `vercel.json` sets the Astro build and `dist/` output automatically when this repository is imported into Vercel.

The site is live at [mattstirling-site.vercel.app](https://mattstirling-site.vercel.app/), with source in [mattstirling/mattstirling-site](https://github.com/mattstirling/mattstirling-site). See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel setup, the exact custom-domain DNS records, the apex redirect, and preserving email DNS.

## Screenshots and checks

See [docs/verification.md](docs/verification.md) for the recorded checks and screenshot links.
