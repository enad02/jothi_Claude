# Current State - Jothi Learning Website

Last updated: 05 October 2026

This file is the live working snapshot for future website work.

## Current working workflow

- Codex = coding executor
- ChatGPT thread = strategy / copy / decision support
- `SOURCE_OF_TRUTH.md` = locked business facts
- `AGENTS.md` = coding-agent operating rules
- `CURRENT_STATE.md` = live/pending status

Older Claude-specific references should not control current implementation if they conflict with `AGENTS.md`, `SOURCE_OF_TRUTH.md`, or the latest user instructions.

## What is true right now

- The site is a static HTML/CSS/JS build.
- Core public pages exist: homepage, programmes, results, about, team, contact, students, tutors, and legal pages.
- The site uses a shared design system in `styles.css`.
- The six public marketing pages are launched and indexable: homepage, programmes, about, team, results, and contact.
- Google Search Console confirms those six public marketing pages are indexed.
- Legal pages and gateway pages remain `noindex,follow`.
- Production is hosted on Cloudflare Pages.
- Vercel is historical/non-production only.
- The Year 9 Maths and contact enquiry forms use the generated Bigin webform. The controlled Year 9 record verified the generated field aliases against the Admissions Pipeline; do not replace `POTENTIALCF` aliases on the basis of the earlier display-only concern.
- Safe metadata improvements have been added, including Open Graph/Twitter basics and one `EducationalOrganization` JSON-LD block on the homepage.
- Accessibility and mobile polish have been applied to navigation, focus states, form messaging, and small-screen behaviour.
- WhatsApp green is now reserved for WhatsApp UI only.
- The homepage now includes a section-jump navigation block to reduce long-scroll fatigue.
- The homepage pricing summary uses the current four-card hourly model; KS2 remains outside the homepage pricing cards.
- The Programmes page follows a parent decision flow: stage, pathway, group tuition rate, joining route.
- The student and tutor gateway pages have been visually polished but remain practical access pages rather than marketing pages.
- The About page now includes a Vision / Mission / Purpose section, but its final placement and visual prominence still need review during the full premium About page pass.

## Year 9 Maths and Meta 2.0 — current authoritative state (05 October 2026)

- Current offer: free initial diagnostic; £25/hour online Maths teaching in a four-student group; four one-hour lessons prepaid for £100 only after a suitable group and lesson dates are confirmed. Review progress and group fit after four lessons. If both sides are happy, continuation is £25/hour or an explicitly agreed fixed monthly arrangement. There is no automatic monthly conversion or renewal; unused prepaid lessons are refunded if the family stops. AQA, Edexcel and OCR are supported; places depend on group fit. A-Level admissions are closed. Historical £1,045, £95/month, 11 × £95 and £100/month assumptions are not the current Year 9 entry offer.
- Meta ad account **Jothi Learning**, ID **1125417884988493** (ending **8493**, not the earlier incorrect 8849). Campaign `META2 | Y9 Maths | Website Leads | Oct 2026` was published on 05 October with one published ad set and three published ads. Immediately after publication, campaign and ad set were **Scheduled** and all three ads were **In review**. Delivery was scheduled for **07:00 UK local time**, at **£30/day** at ad-set level, with no end date; immediate spend was **£0**. No other drafts were published. An unrelated unchecked ad displayed an error but was untouched and is unrelated to Meta 2.0.
- The website is the sole intended lead-completion destination: `https://jothi.uk/year-9-maths`. Production measurement baseline is `9ab8edc0fd5884bbbac501cb4dc160410ff70b21`. Creative identifiers are `foundations_static`, `maths_confidence` and `parent_proof`; see `docs/meta2/META2_YEAR9_GROWTH_FOUNDATION.md` for published ad names, URLs, settings and accepted platform behaviour.
- Controlled Bigin record `985999000000658089` proved the generated aliases populate the operational Admissions Pipeline fields, including Parent Name, Parent Mobile, Parent Email, Year Group, Subject, Lead Source, Stage and Description with `utm_content=foundations_static`. It is synthetic and excluded from reporting. `Contact_Name=null` is a non-blocking P2 item; it does not negate the populated parent contact fields. The Year 9 acknowledgement workflow is active and routes by Year Group, Subject and landing-page Description evidence, not advertising source. The active generic workflow handles other enquiries without duplicate acknowledgement.
- Post-launch verification: check A/B/C approval and active delivery, spend only after start/review approval, the first genuine Meta Bigin enquiry and its source/creative/parent fields, and exactly one Year 9 acknowledgement. Do not change creatives from the first few hours. Daily delivery safety, twice-weekly creative, weekly commercial and later cohort/retention reviews follow the monitoring manual.
- Non-blocking P2 work: null `Contact_Name` lookup, absent `form_start` event, 1024px footer spacing, consideration of redundant visible Year Group and Preferred Contact Method inputs, future CRM architecture, absent native 1.91:1 asset, and formal payment/teaching systems of record.

## Current production and deployment

- Live production domain: https://jothi.uk/
- Cloudflare Pages project: `jothi2026`
- Cloudflare preview URL: https://jothi2026.pages.dev
- GitHub production repo: `enad02/jothi_Claude`
- Production branch: `main`
- Framework preset: None / static site
- Historically the Cloudflare build command was empty.
- Parent Advice migration introduces a Node build step.
- Cloudflare should not be changed until the real repo build and preview QA pass.
- Future required build command: `npm run build`.
- Output directory remains repository root.
- Deployment is dashboard-managed in Cloudflare Pages.
- No `wrangler.toml`, `cloudflare.json`, Worker script, GitHub Action, or Cloudflare config file is required.
- `www.jothi.uk` redirects to https://jothi.uk/.
- `jothi.co.uk` redirects to https://jothi.uk/.

## What is already settled in the build

- CTA wording has been standardised across the site.
- Current public group pricing is £20/hr for Years 5-8, £25/hr for Years 9-10, and £30/hr for Year 11; one-to-one is £50/hr where offered, and A-Level admissions are closed. Programme/monthly figures remain internal references.
- Current public availability is: Years 5-6 admissions closed; Years 7-8 and Years 9-10 places available in selected groups; Year 11 limited availability subject to group fit; A-Level Maths admissions currently closed.
- Standard programmes are live small-group lessons with up to four students per batch.
- The Diagnostic Bridge is the one-to-one entry route where closer assessment is needed before placement.
- Legal pages have been aligned more closely with actual site behaviour.
- Non-WhatsApp green usage has been removed.
- Shared header logo images now have width/height attributes.
- Homepage hero image no longer carries incorrect intrinsic dimensions.
- Certificate fallback wording is now neutral.

## What still needs final human approval or stronger assets

- Stronger real photography and proof imagery where available.
- Better tutor credibility assets on the Team page:
  - real photos
  - fuller bios
  - any approved safeguarding / DBS-related trust signals
- Stronger proof packaging on the Results page as better permissions and evidence become available.
- Ongoing review of proof claims as new proof assets become available.

## Best next priorities

1. Improve real proof assets and imagery.
2. Strengthen Team page tutor credibility with approved real-world assets.
3. Run periodic QA across content, links, and mobile after production changes.
4. Review whether any remaining internal/project notes should be trimmed or moved into `SOURCE_OF_TRUTH.md`.

## How to use this file

- Use this file for the current working snapshot only.
- Use `SOURCE_OF_TRUTH.md` for locked facts and decisions.
- Use `AGENTS.md` for coding-agent operating rules.
- Treat `CLAUDE.md` as legacy Claude-specific context unless explicitly referenced.
- Do not duplicate locked pricing, CTA hierarchy, or proof rules here unless the current implementation has diverged.
