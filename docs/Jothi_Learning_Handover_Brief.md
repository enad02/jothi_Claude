# Jothi Learning — Handover Brief
### Resume instructions for the next Claude session

Paste this entire document into a new Claude.ai chat to pick up exactly where tonight left off.

---

## Context for Claude (read this first)

I'm Prakash Michael, founder of Jothi Learning (UK tutoring business for Maths, Physics, Chemistry). I was working on my website with the previous Claude. This brief captures everything we've done so you can continue seamlessly.

**The live website:** https://jothi-claude.vercel.app
**The GitHub repo:** https://github.com/enad02/jothi_Claude
**Local project folder:** `D:\Jothi\WEB\Live site\jothi_claude`
**My deployment pipeline:** Claude Code → GitHub → Vercel auto-deploy

---

## The business in one paragraph

Jothi Learning is a mid-market-to-premium online tutoring business. We've been running since 2020, taught 500+ students, have 150 active families. Core subjects: Maths (flagship), Physics, Chemistry. Year groups 7–13. Flagship product: 10-month A-Level Maths crash course. Key differentiators: Jothi Trifecta (Mindset/Strategy/Environment), Teach–Test–Track–Transform (4T) model, live Classkick supervision of every lesson (our "unfakeable moat" vs AI), radical-honesty policy with parents, in-house apprentice-model tutor training.

---

## The ICP (parent persona) — critical

**Primary ICP:** Indian and other immigrant professional parents (doctors, engineers, software leads, consultants) aged 35–55, household income £60k–£150k, UK-based (clusters in Birmingham, London, Leicester), children in Years 7–13. **First-generation UK professionals** who are successful in their own careers but unfamiliar with the UK education system.

**Behavioural segmentation:**
- Act quickly after poor school feedback
- Engage on WhatsApp (not email or form)
- Accept structured testing and accountability
- Willing to commit to programmes (not ad-hoc lessons)
- Will "pay for speed and certainty"

**Psychographic:**
- High academic anxiety
- Status-aware (grades → universities → careers)
- Low tolerance for uncertainty near exam years
- Value structure, discipline, measurable outcomes

**Brand tone:** Warm + nurturing + premium. First-person "we/our" throughout.

**Primary CTA:** WhatsApp (https://wa.me/447985588975)
**Secondary CTA:** Free 45-minute Diagnostic Assessment + Parent Consultation
**Tertiary CTA (planned):** Downloadable PDF guide to the UK education system

---

## What shipped tonight (all live on jothi-claude.vercel.app)

**P1 fixes — all complete:**

1. ✅ **Homepage hero rewrite** — ICP-focused, "Your child's next school report lands soon..." headline, WhatsApp + diagnostic CTAs, trust strip "5 years | 500+ students | 4.9★ Google Reviews"
2. ✅ **Global WhatsApp CTAs** — floating button bottom-right on every page, nav button on every page, "Or WhatsApp Jothi" text links paired with every body CTA (9 nav, 9 floating, 8 body links across 6 pages)
3. ✅ **Transparent pricing on Programmes page** — 4 fee cards (KS3 £1,000 / Y9-10 £1,250 / Y11 £1,500 / A-Level £3,500) with full "What's included" inclusions list

**Bonus P2 fixes also shipped:**

4. ✅ **"New to the UK curriculum?" section** on homepage — dedicated block for immigrant professional parents, 3-column grid with "We speak your academic language" / "WhatsApp first, always" / "A system you can trust"
5. ✅ **Global "Jothi" → "we" tone shift** — 22 changes across 6 HTML files, preserving legal pages / aria labels / Jothi Trifecta / intentional brand headings / quoted testimonials

---

## What's still outstanding (P2 — most need data from me)

These are the highest-impact items still needed. Most are blocked on me gathering real content — not on prompting.

### P2 items I can feed Claude without new data

- **Visual diagrams for Trifecta + 4T** — I have full written content in internal docs. Claude can generate SVG diagrams from the descriptions.
- **Classkick "live supervision" section on homepage** — conceptual section explaining the unfakeable moat, can use a placeholder/illustration until I capture a real screenshot.

### P2 items blocked on me gathering content

- **Real results numbers on Results page** — need: GCSE grade 7+ %, UKMT medals count, A-Level A/A* %, retention rate. I have 5 years of data to pull together.
- **Named case studies** — 3–5 minimum, with photo (or AI avatar until real photos obtained), named student, specific outcome.
- **Named testimonials** — need to contact existing Google reviewers and YouTube testimonial contributors for explicit permission to quote them with first name + child's year group.
- **Founder block** — need photo of me + 150-word founder story (draft to write).
- **Tutor profiles on Team page** — photo + 100-word bio + DBS status per named tutor. DBS rollout is pending.
- **Video testimonials embedded** — I have YouTube videos; need explicit permission to embed on site.

### P3 items (polish)

- Schema.org structured data (EducationalOrganization, LocalBusiness)
- OpenGraph / Twitter Card meta tags
- Vercel Analytics install
- Favicon
- Cohort start dates / exam countdown on homepage
- UK education PDF guide (tertiary CTA)
- Safeguarding / DBS section once all tutors DBS-verified

---

## How to resume the workflow

1. **Open PowerShell** (Windows key → `powershell` → Enter)
2. **Navigate to the project folder**:
   ```
   D:
   cd "D:\Jothi\WEB\Live site\jothi_claude"
   ```
3. **Launch Claude Code**:
   ```
   claude
   ```
4. (First time only — if auto-update warning showed last session, run `npm install -g @anthropic-ai/claude-code` in PowerShell first.)
5. **Give Claude Code context**. Paste this into the Claude Code `>` prompt:
   > Please re-read `docs/Jothi_Learning_Website_Audit.md` in this folder. That document contains the full strategic audit. I'll be working through the P2 priorities today — let me know once you've read it.
   
   (Requires saving the audit .md file into a `docs/` subfolder of the project — do this once, before resuming.)

---

## Ready-to-paste prompts for next session

### Next prompt: Trifecta + 4T visual diagrams (no data blocker)

```
I want to add a visual representation of our two proprietary frameworks — Jothi Trifecta and the 4T Engine — to replace the current one-line text mentions on the homepage.

For the Jothi Trifecta: three interlocking circles (Mindset, Strategy, Environment) with a shared centre labelled "Student Growth". Under each circle, one short plain-English line:
- Mindset: "How the student thinks, feels and responds"
- Strategy: "How the student learns — the system, routines, and methods"
- Environment: "The conditions around the student that shape learning"

For the 4T Engine: a circular flow showing Teach → Test → Track → Transform → (back to Teach). Under each stage, one short line:
- Teach: "Build understanding first"
- Test: "Reveal weakness early, not in the exam hall"
- Track: "Make progress visible to parents"
- Transform: "Correct, improve, advance"

Use inline SVG so the diagrams scale and stay sharp. Keep the colour palette consistent with the rest of the site. Place both diagrams on index.html in the existing "How Jothi Works" section (the one with Trifecta and 4T Engine text labels) — replace the text labels with these richer visual blocks.

Show me the plan first. Commit message: "feat(home): visual diagrams for Trifecta and 4T". Push when done.
```

### Second next prompt: Classkick live supervision section

```
I want to add a new homepage section that showcases our single biggest competitive moat: live Classkick supervision of every lesson. This is the one thing AI tutors and cheap marketplace tutors cannot replicate, and it is currently invisible on the site.

Please add a new section to index.html, placed between the "Tutor Quality" section and the "Reviews" section.

Eyebrow: "The Classkick difference"
Heading (H2): "Every lesson, we watch your child think — live."
Body paragraph: "Most tutoring disappears into a black box. You send your child to a lesson, and you hope. Our tutors don't hope. Using Classkick, we see every student's handwritten working in real time — every step, every attempt, every mistake — and intervene instantly. Stretch the fast ones, support the stuck ones, catch the misconception before it hardens. This is why parents see real progress, week after week. It is also why AI tutors and low-cost marketplace tutors cannot replicate what we do."

Three feature blocks underneath:
1. "Live visibility" — "Every student's work is visible on screen to the tutor throughout the lesson. No hiding, no passivity."
2. "Instant intervention" — "Mistakes are corrected the moment they happen. No week-long wait, no hardened misconceptions."
3. "Evidence every parent can see" — "Every lesson creates a cloud record of student work, feedback, and progress, open to the family."

Closing line in italic: "This is why our promise to parents is simple: you will see your child's progress, not just hope for it."

CTA button below: "Book a free 45-min diagnostic to see Classkick in action" → contact.html#contact-form

Style it warmly but with clear authority. Leave a clear placeholder div for a Classkick screenshot (I'll add the real image later — for now use a neutral placeholder with a note that says "Classkick live lesson — screenshot to be added").

Show me the plan first. Commit message: "feat(home): classkick live supervision moat section". Push when done.
```

---

## The audit document

The full strategic audit (tonight's deliverable) is at:
`D:\Jothi\WEB\Live site\jothi_claude\docs\Jothi_Learning_Website_Audit.md`
(If not yet saved there, move it from my Downloads folder.)

This is the single most important reference document — every future prompt should be aligned to its findings.

---

## Final note to tomorrow's Claude

Please keep the same approach as tonight:
- Push back hard when I write generic copy
- Demand specificity and proof
- Write for the anxious parent of Year 9–11, not the business category
- Prefer paraphrase over quote
- Confirm everything before pushing to GitHub
- Keep answers concise, actionable, and in plain English (I'm non-technical)

I work with step-by-step guidance. When I ask about a terminal command or a Claude Code behaviour, explain it in 2–3 sentences max.

---

*End of handover. Pick up from any prompt above, or tell me which P2 item I want to tackle first.*
