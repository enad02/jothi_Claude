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

## Approval, Git and Deployment Boundaries

- Editing files, committing, pushing and deploying each require separate explicit user approval for that action and scope. One user message may explicitly approve multiple actions.
- Approval for one action does not authorise another. In particular, approval to edit does not authorise committing, and approval to commit does not authorise pushing.
- Do not push to `main` without explicit user approval to push to `main`.
- A push to `main` triggers Cloudflare Pages production deployment. Before that push, obtain explicit approval for both the push and the resulting production deployment.
- Before any Git operation, verify the current working directory and intended repository using read-only checks. Confirm the repository root before proceeding; before a push, also confirm the target remote and branch.
- Git development must use an approved local checkout, including C:\Jothi\Repos\jothi_Claude on the laptop and D:\Jothi\WEB\Live site\Jothi_2026_Live on the desktop. Do not use cloud-synchronised folders as active Git working directories without explicit approval.
- Never initialise Git inside Zoho WorkDrive `Z:` or any directory beneath it.
- Changing Cloudflare Pages settings or configuration requires explicit user approval for the specific change, including dashboard settings and repository configuration files. Successful build and preview QA do not themselves authorise those changes.
- These approval requirements supersede legacy or general workflow instructions that imply automatic commits, pushes or deployments. All existing source-of-truth, business, CTA, deployment, indexing and asset protections remain in force.
- If approval scope or deployment boundaries are unclear, stop and ask before taking the affected action.

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
- The six public marketing pages are indexable. Legal and gateway pages should remain `noindex,follow` unless explicitly changed.
- Production deploys through Cloudflare Pages from GitHub `main`. Do not add Cloudflare config files unless explicitly needed.

## AI Coding Workflow and Token Discipline

- Treat AI coding tools as narrow executors, not designers or open-ended reviewers.
- The user or strategy reviewer decides what should change before code is edited.
- For each task, edit the smallest safe patch.
- Use one task per coding session whenever possible.
- Use only the named files for the task.
- Do not inspect unrelated files unless the task clearly requires it.
- Do not run full repo audits for targeted fixes.
- Do not re-read repo instruction files repeatedly inside the same session.
- Do not paste large diffs into the chat.
- Report only changed files, a short summary, QA results, and risks.
- Prefer `git diff --check` for basic whitespace/error checking after edits.
- Screenshots should be requested only when visual QA matters.
- Avoid broad prompts such as "improve", "polish", "optimise", "make premium", or "review the whole page".
- Prefer exact verbs such as remove, add, align, reduce, restore, centre, or change.
- Do not redesign unrelated sections while completing a scoped task.
- If a request is broad, ambiguous, multi-page, or likely to cause token burn, pause and ask for the task to be narrowed before editing.
- For lessons learned from previous AI coding sessions, consult `docs/AI_CODING_LESSONS.md` when the user explicitly asks for a workflow review or end-of-day reflection. Do not read it for every small coding task.

## Current Homepage State

- `index.html` is the live homepage and uses the promoted Variant D design.
- `docs/reference/index-hero-proof-variant-d.html` remains as a historical reference backup only.
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
