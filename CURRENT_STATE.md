# Current State - Jothi Learning Website

Last updated: 1 May 2026

This file is the live working snapshot for future Claude Code website work.

## What is true right now

- The site is a static HTML/CSS/JS build.
- Core public pages exist: homepage, programmes, results, about, team, contact, students, tutors, and legal pages.
- The site uses a shared design system in `styles.css`.
- Public pages still use `noindex,follow`.
- `robots.txt` and `sitemap.xml` are present, but indexing has not yet been intentionally switched on.
- The contact form is a static Web3Forms setup.
- Safe metadata improvements have been added, including Open Graph/Twitter basics and one `EducationalOrganization` JSON-LD block on the homepage.
- Accessibility and mobile polish have been applied to navigation, focus states, form messaging, and small-screen behaviour.
- WhatsApp green is now reserved for WhatsApp UI only.
- The homepage now includes a section-jump navigation block to reduce long-scroll fatigue.
- The homepage pricing summary now uses monthly programme-cycle `from` pricing rather than the previous fixed-fee model.
- The Programmes page now follows a parent decision flow: stage, pathway, monthly fee, joining route.
- The student and tutor gateway pages have been visually polished but remain practical access pages rather than marketing pages.
- The About page now includes a Vision / Mission / Purpose section, but its final placement and visual prominence still need review during the full premium About page pass.

## What is already settled in the build

- CTA wording has been standardised across the site.
- Monthly programme-cycle pricing is the approved public model.
- Standard programmes are live small-group lessons with up to four students per batch.
- The Diagnostic Bridge is the one-to-one entry route where closer assessment is needed before placement.
- Legal pages have been aligned more closely with actual site behaviour.
- Non-WhatsApp green usage has been removed.
- Shared header logo images now have width/height attributes.
- Homepage hero image no longer carries incorrect intrinsic dimensions.
- Certificate fallback wording is now neutral.

## What still needs final human approval or stronger assets

- Final decision on when to remove `noindex`.
- Stronger real photography and proof imagery where available.
- Better tutor credibility assets on the Team page:
  - real photos
  - fuller bios
  - any approved safeguarding / DBS-related trust signals
- Stronger proof packaging on the Results page as better permissions and evidence become available.
- Final launch-level review of proof claims before indexation.

## Best next priorities

1. Decide launch indexing policy and remove `noindex` only when approved.
2. Improve real proof assets and imagery.
3. Strengthen Team page tutor credibility with approved real-world assets.
4. Run a final launch QA pass across content, links, and mobile.
5. Review whether any remaining internal/project notes should be trimmed or moved into `SOURCE_OF_TRUTH.md`.

## How to use this file

- Use this file for the current working snapshot only.
- Use `SOURCE_OF_TRUTH.md` for locked facts and decisions.
- Use `CLAUDE.md` for Claude Code operating rules.
- Do not duplicate locked pricing, CTA hierarchy, or proof rules here unless the current implementation has diverged.
