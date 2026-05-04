# AGENTS.md

## Purpose

These instructions apply to coding agents working on this repository, whether the tool is Codex, Claude Code, Cursor, or another assistant.

This file is the main workflow instruction file for coding agents. It is agent-neutral and should be read before editing.

## Authority Order

1. Current user chat instructions override older repo documents.
2. `SOURCE_OF_TRUTH.md` is the highest authority for locked business facts.
3. `AGENTS.md` is the main workflow instruction file for coding agents.
4. `CURRENT_STATE.md` describes live and pending working status.
5. `CLAUDE.md` is legacy Claude-specific context unless the user explicitly says otherwise.

If documents conflict, follow the order above. If pricing, proof numbers, names, permissions, testimonials, or claims are unclear, ask before changing them.

## Public Copy Rules

- Keep visible public copy tool-agnostic.
- Do not mention supplier names in public copy.
- Do not invent pricing, proof numbers, names, permissions, testimonials, or claims.
- Use British English.
- Keep copy warm, direct, premium, and parent-facing.

## CTA Rules

- Preserve WhatsApp as the primary CTA.
- Preserve diagnostic consultation as the secondary CTA.
- Do not change CTA destinations unless explicitly approved.

## Implementation Rules

- Reuse existing CSS classes before adding new ones.
- Reuse existing design tokens before introducing new values.
- Keep changes small, reviewable, and production-safe.
- Do not redesign unrelated sections while completing a scoped task.
- Keep public pages `noindex,follow` until launch indexing is explicitly approved.

## Current Homepage State

- `index.html` is the live homepage and uses the promoted Variant D design.
- `index-hero-proof-variant-d.html` remains as a reference backup only.
- Global typography uses self-hosted Playfair Display for headings and Lato for body copy.
- Do not edit `styles.css`, `script.js`, sitemap/robots, assets, or unrelated pages unless explicitly approved.
- Do not run a full repo audit for targeted visual fixes.
- Do not read unrelated files when a task names one target file.

## Safety Rules

- Treat this as a live business website, not a sandbox.
- Do not invent or mix pricing models.
- Do not silently combine old annual-only assumptions with the current monthly programme-cycle model.
- Do not expose supplier/platform names in visible public copy unless the user explicitly approves it.
- Ask before deleting, replacing, or compressing assets unless the user has specifically requested it.
