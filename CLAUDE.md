# CLAUDE.md

Legacy note: This file was originally written for Claude Code. The current preferred agent-neutral instruction file is AGENTS.md. If there is a conflict: current user chat instructions win first, SOURCE_OF_TRUTH.md wins for locked business facts, AGENTS.md wins for agent workflow, and this CLAUDE.md file is historical unless explicitly referenced.

### Operating notes for Claude Code on this repo

Last updated: 3 May 2026

This file should stay short.
Use it for working behaviour and repo-specific operating guidance.
Use `SOURCE_OF_TRUTH.md` for locked facts and decisions.
Use `CURRENT_STATE.md` for the current working snapshot.

## Project context

- Static HTML, CSS, and vanilla JS site
- Shared design system lives in `styles.css`
- User is non-technical; explain changes in plain English and flag visible risk before making high-impact changes
- Prefer practical, user-visible improvements over abstract refactors

## Core workflow

- For small, low-risk fixes, implement directly.
- For broader multi-file work, first summarise the approach briefly.
- Batch related changes together where sensible.
- After requested commits, push to `main`.
- Use concise Conventional Commit messages.

## Source-of-truth rule

- `SOURCE_OF_TRUTH.md` is the authority for locked facts and decisions.
- `CURRENT_STATE.md` is the working snapshot.
- Do not duplicate large blocks of locked business logic in this file.
- If `SOURCE_OF_TRUTH.md` and old notes conflict, follow `SOURCE_OF_TRUTH.md`.

## Public-copy guardrails

- Write in first-person voice where appropriate: `we`, `our`
- Speak to the parent and their child directly
- Use British English
- Keep public-facing copy calm, direct, and premium
- Avoid generic startup, marketplace, or edtech tone
- Supplier names should not appear in visible public copy unless explicitly approved
- Supplier domains in `href` are allowed
- Google reviews may be named in visible proof copy

## Design guardrails

- Reuse existing classes before inventing new ones
- Reuse existing CSS variables before introducing anything new
- Keep WhatsApp green reserved for WhatsApp UI only
- Preserve calm spacing and editorial restraint
- Student and tutor gateway pages should remain practical access pages, not full marketing pages

## Launch/indexing guardrail

- Public pages remain `noindex,follow` until launch approval is explicitly given

## Current homepage state

- `index.html` is the live homepage and uses the promoted Variant D design.
- `index-hero-proof-variant-d.html` remains as a reference backup only.
- Global typography uses self-hosted Playfair Display for headings and Lato for body copy.
- Keep homepage edits small and scoped.
- Ask before touching global CSS, script behaviour, sitemap/robots, assets, or unrelated pages.
## About-page note

- Vision / Mission / Purpose statements exist
- Their final About-page placement and prominence are not yet locked
- The About page is the next priority for a fuller premium pass

## Safety rules

- Do not change pricing without explicit approval
- Do not change CTA destinations without explicit approval
- Do not reintroduce visible supplier names into public copy
- Do not replace or delete image assets without explicit approval
- Do not treat working-state notes as locked facts

## Token discipline

- Do not re-read the same files unnecessarily
- Do not propose broad refactors unless asked
- Keep responses concise
- For trivial fixes, do the work without ceremony
