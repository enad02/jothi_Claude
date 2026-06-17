# Jothi Learning Website

This repository contains the public-facing Jothi Learning website.

## Overview

Jothi Learning is a UK-based online tutoring company helping students in Years 7–13, with a strong emphasis on Maths, GCSE Science, and A-Level Maths.

The site is a static website build and is intentionally simple to maintain.

## Stack

- Static HTML
- CSS
- Vanilla JavaScript
- Small Node build script for generated Parent Advice pages
- GitHub for version control
- Cloudflare Pages for production deployment

## Deployment workflow

1. Edit files locally
2. Review changes
3. Commit to `main`
4. Push to GitHub
5. Cloudflare Pages auto-deploys `main`

Production is hosted on Cloudflare Pages:

- Live domain: https://jothi.uk/
- Cloudflare Pages project: `jothi2026`
- Preview URL: https://jothi2026.pages.dev
- Production branch: `main`
- Framework preset: None / static site
- Build command: empty
- Build output directory: repository root

Deployment is configured in the Cloudflare dashboard, so no `wrangler.toml` or Cloudflare config file is required. `www.jothi.uk` and `jothi.co.uk` redirect to https://jothi.uk/.

Vercel was previously used for preview/testing only and is no longer the production host.

## Core files

### Public pages
- `index.html` — homepage
- `programmes.html` — programmes and pricing
- `results.html` — outcomes, reviews, and proof
- `about.html` — company background and About-page positioning
- `team.html` — tutor and team credibility
- `contact.html` — enquiry form and contact routes
- `students.html` — student gateway page
- `tutors.html` — tutor gateway page
- `privacy.html` — privacy notice
- `cookies.html` — cookies notice
- `terms.html` — terms and conditions

### Shared files
- `styles.css` — shared design system and page styling
- `script.js` — navigation and lightweight interactions
- `assets/` — images and supporting assets
- `robots.txt`
- `sitemap.xml`

## Parent Advice content pilot

Parent Advice source articles live in `content/parent-advice/**/*.md`.
Generated static HTML is written to `parent-advice/**/index.html` by:

```bash
npm run build
```

The generated `parent-advice/**` HTML is build output and should not be edited manually.

For this pilot, Parent Advice pages remain `noindex,follow` until launch approval. Draft/noindex article pages are excluded from `sitemap.xml`.

Related article links use explicit front matter slugs first. The build fails if an explicit related slug does not exist. If no related list is set, the generator falls back to recent articles in the same category.

## Project documents

- `AGENTS.md` — coding-agent operating rules
- `SOURCE_OF_TRUTH.md` — locked facts and decisions
- `CURRENT_STATE.md` — current working snapshot
- `CLAUDE.md` — legacy Claude Code notes
- `docs/Jothi_Design_Eye_Brief_Short.md` — design taste brief

Coding agents should read `AGENTS.md` first, then `SOURCE_OF_TRUTH.md`, then `CURRENT_STATE.md` before editing.

## Contributor note

This repo is for a live business website, not a sandbox.

Treat all changes as production changes. Keep changes controlled, protect factual accuracy, and avoid drifting away from the locked decisions in `SOURCE_OF_TRUTH.md`.
