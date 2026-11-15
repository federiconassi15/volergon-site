# VOLERGON — We want action.

A full, motion-led website for **Volergon**, the independent technology project behind **Bureau**, an evolving model-agnostic AI agent platform.

This is the public company website. It is **not** the Bureau application, not a foundation language model, not the Golden Ratio engine, and not a 3D engine product landing page.

## Quick start

Requires Node.js 20+ and **no npm dependencies**.

```bash
npm run dev
# http://127.0.0.1:4173/
```

To generate the deployable static site:

```bash
npm run build
npm run check
# Output: dist/
```

You can deploy `dist/` to any static host with clean directory URLs. For production canonical links and the sitemap, set `PUBLIC_SITE_URL` when building, e.g. `PUBLIC_SITE_URL=https://your-real-domain.example npm run build`. Do not publish an invented placeholder domain as real.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Cinematic Volergon homepage with an original WebGL2 sculpture and full company story |
| `/bureau/` | Bureau product vision, architecture, human-governed workflow |
| `/approach/` | How and why the company builds |
| `/golden-ratio/` | Clearly-labeled **planned** prioritization capability |
| `/company/` | Volergon company story and identity |
| `/principles/` | Principles and manifesto |
| `/security/` | Security philosophy, without unsupported certifications |
| `/journal/` | Founding and product notes, without fake milestones |
| `/contact/` | Honest contact-channel status; no pretend form |
| `/brand/` | Visual identity and palette |
| `/404.html` | Dedicated error page |

## Architecture

- Static HTML generated from `src/site.mjs` with `scripts/build.mjs`.
- Custom CSS in `public/assets/site.css`.
- Motion, navigation, educational interactions in `public/assets/motion.js`.
- Original, procedural WebGL2 raymarched liquid-ribbon illustration in `public/assets/field.js`.
- No framework or npm runtime dependencies. No tracking scripts or production backend.
- Graceful non-WebGL and `prefers-reduced-motion` fallback; keyboard navigation and focus states.
- No live AI operations, no claims of actual Bureau deployment, no metrics invented.

## Creative direction

The visual style takes **inspiration** from the high-craft, light/off-white, electric-blue interactive studio aesthetic of Lusion. All copy, site structure, assets, CSS, JavaScript, and shader are original to this project. The purpose is to reach a similar standard of craft, **not** to reproduce their site or proprietary artwork.

Main colors: off-white `#F0F1FA`, pure ink `#000000`, graphite `#2B2E3A`, ultramarine `#1A2FFB`, electric lime `#C1FF00` as a rare accent.

The display font stack prefers a properly **licensed Aeonik** installation, with open-access DM Sans fallback. This repository **does not** distribute Aeonik files or Lusion's custom fonts. Google Fonts serves DM Sans and IBM Plex Mono. If deploying with zero third-party font requests, self-host OFL fonts and adjust the `<link>` in `src/site.mjs`.

## Quality gates

`npm run check` verifies generated routes, internal links, local assets, metadata, and meaningful copy. `.github/workflows/verify.yml` runs the same checks for PRs.

Additional visual QA must be done before publishing: keyboard and screen reader, reduced motion, Safari/Firefox/Chromium, real iPhone/Android, 320–1920px viewports, no-WebGL, mobile GPU heat, and slow-network behavior. No tests prove all devices are currently certified.

## Status & security

The site's product descriptions distinguish development intentions from shipped features. Bureau's authoritative security model belongs to its **separate** Rust repository. A website animation is not proof of product capabilities. Golden Ratio is a prospective feature, not already an autonomous predictive engine.

## License

MIT (see `LICENSE`). External names and trademarks remain the property of their owners. No commercial font assets included.
