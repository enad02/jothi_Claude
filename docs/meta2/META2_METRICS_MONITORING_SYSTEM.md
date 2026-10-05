# Meta 2.0 Metrics Monitoring System

Status: Current measurement manual for the published Meta 2.0 Year 9 Maths campaign as of 05 October 2026. Proposed definitions, spend checkpoints and scaling guardrails remain proposals where labelled.

## 1. Purpose

This system must answer: Is Meta generating attention? Is each creative attracting the right Year 9 parents? Is the landing page converting? Are enquiries genuine and reachable? Are parents qualified? Are consultations and free diagnostics happening? Can children be matched to suitable groups? Are families paying £100 for four lessons, completing them and continuing? What does each successful stage cost, and which creative produces the strongest commercial cohort?

The outcome is **REGISTERED, CONTINUING YEAR 9 MATHS STUDENTS AT SUSTAINABLE CAC**. Meta Ads Manager supplies media diagnostics; Bigin, payment/finance and teaching/operations evidence establish downstream outcomes. The exact operational owner or system for several later stages remains **SOURCE OF TRUTH TO BE CONFIRMED**.

## Launch baseline and reporting boundary — 05 October 2026

The Jothi Learning Meta ad account is `1125417884988493` (ending **8493**, correcting the earlier 8849 reference). `META2 | Y9 Maths | Website Leads | Oct 2026` and `Y9 Maths | England | Broad | Website` were published with ads A/B/C. Immediately after publication, campaign/ad set were **Scheduled**, all three ads were **In review**, scheduled delivery was **07:00 UK local time**, and spend was **£0**. Budget: **£30/day at ad-set level**; no end date. See `META2_YEAR9_GROWTH_FOUNDATION.md` for complete settings, published names, creative treatment and URLs. No other drafts were published.

Use `utm_content` as the creative join key: A = `foundations_static`, B = `maths_confidence`, C = `parent_proof`. The controlled synthetic Bigin record `985999000000658089` verified the website-generated aliases and received Meta Description attribution, including `utm_content=foundations_static`. **Exclude this record from all enquiry and conversion totals.** The first genuine lead, ad approval, delivery and acknowledgement receipt remain post-launch checks. `Contact_Name=null` in that test is non-blocking because canonical `Parent_Name`, `Parent_Mobile`, `Parent_Email`, `Year_Group` and `Subject` were populated. Bigin Admissions Pipeline layout ID: `985999000000543847`.

Full funnel: **spend → impressions → outbound clicks → LPVs → enquiries → reachable → qualified → consultations booked → consultations attended → diagnostics → suitable group → £100 starter → four-lesson completion → continuation → retained revenue**. Long-term north star: media cost per continuing/retained Year 9 student, with retained revenue and eventual fully loaded CAC. Near-term proxy: media CAC per £100 starter. Quality measures: cost per qualified enquiry, cost per attended consultation, starter conversion and continuation. Top-funnel diagnostics: spend, impressions, CPM, outbound clicks, outbound CTR/CPC, LPVs, click-to-LPV, enquiries and CPL.

## 2. Metric Dictionary

Percentages below are ratios multiplied by 100. Rates and costs are `N/A` when their denominator is zero or unavailable. For cohort measures, use only eligible, sufficiently mature enquiries or starters and record the cohort window and report-as-of date. “Daily” means a safety/reconciliation check, not daily optimisation. The operating cadence is daily safety/delivery, twice-weekly creative, weekly commercial funnel and later mature-cohort/retention review. Do not change creatives on the first few hours of data.

| Metric | Definition | Formula | Primary source | Frequency | Stage | Diagnostic or commercial | Notes |
|---|---|---|---|---|---|---|---|
| Spend | Media cost in GBP for the selected Meta cohort/window | Meta reported spend | Meta Ads Manager | Daily; weekly | Media | Diagnostic input | Preserve date, campaign, ad set and ad breakdown. |
| Impressions | Times ads were shown | Meta reported impressions | Meta Ads Manager | Twice weekly | Media | Diagnostic | Not unique people. |
| Reach | Unique people reached under Meta reporting | Meta reported reach | Meta Ads Manager | Twice weekly | Media | Diagnostic | Platform estimate; avoid summing across overlapping rows. |
| Frequency | Average impressions per reached person | impressions / reach | Meta Ads Manager | Twice weekly | Media | Diagnostic | Use same reporting window. |
| CPM | Cost per thousand impressions | spend / impressions × 1,000 | Meta Ads Manager | Twice weekly | Media | Diagnostic | `N/A` if no impressions. |
| Outbound clicks | Clicks from ad toward external destination | Meta outbound clicks | Meta Ads Manager | Twice weekly | Media | Diagnostic | Use outbound, not all clicks. |
| Outbound CTR | Share of impressions producing outbound clicks | outbound clicks / impressions | Meta Ads Manager | Twice weekly | Media | Diagnostic | Not a lead-quality measure. |
| Outbound CPC | Cost per outbound click | spend / outbound clicks | Meta Ads Manager | Twice weekly | Media | Diagnostic | GBP. |
| Landing-page views (LPV) | Destination page loads measured for the Meta route | Measured LPVs | Meta Ads Manager / website measurement, verify | Twice weekly | Website | Diagnostic | Exact live tracking and consent effect require verification. |
| Click-to-LPV rate | Share of outbound clicks becoming measured LPVs | LPVs / outbound clicks | Meta + website measurement | Twice weekly | Website | Diagnostic | Do not force counts to match. |
| Successful enquiries | Unique enquiries actually recorded from the Meta website route | Count distinct Bigin records with explicit Meta source evidence | Bigin | Daily; weekly | Website | Commercial input | Reconcile against Meta Lead; exclude duplicate submissions. |
| LPV-to-enquiry conversion rate | Share of measured LPVs producing recorded enquiries | successful enquiries / LPVs | Bigin + LPV source | Weekly | Website | Diagnostic | Cross-system estimate; attribution windows and consent differ. |
| Cost per enquiry (CPL) | Media cost per recorded enquiry | spend / successful enquiries | Meta + Bigin | Weekly | Website | Diagnostic | Do not substitute Meta-reported Leads without reconciliation. |
| Genuine enquiries | Recorded enquiries judged real, not test/spam/duplicate | Count distinct genuine enquiries | Bigin; criteria proposed | Weekly | Quality | Quality indicator | Do not label unusual email/profile alone as fraud. |
| Genuine enquiry rate | Genuine share of recorded enquiries | genuine enquiries / successful enquiries | Bigin | Weekly | Quality | Quality indicator | `N/A` without recorded enquiries. |
| Reachable enquiries | Enquiries with successful two-way parent contact | Count distinct reachable enquiries | Bigin | Weekly | Quality | Quality indicator | Attempts alone are not reachability. |
| Reachable rate | Reachable share of recorded enquiries | reachable enquiries / successful enquiries | Bigin | Weekly | Quality | Quality indicator | Record time allowed for follow-up. |
| Qualified enquiries | Enquiries satisfying approved Year 9 criteria | Count distinct qualified enquiries | Bigin; definition pending approval | Weekly | Quality | Commercial indicator | Include qualified demand without capacity in a separate subcount. |
| Qualified enquiry rate | Qualified share of recorded enquiries | qualified enquiries / successful enquiries | Bigin | Weekly | Quality | Commercial indicator | Do not silently change denominator to reachable. |
| Cost per qualified enquiry | Media cost per qualified enquiry | spend / qualified enquiries | Meta + Bigin | Weekly | Quality | Commercial indicator | Keep cohort and spend windows aligned. |
| Consultations booked | Confirmed parent consultation appointments | Count distinct bookings | Bigin / booking record, verify | Weekly | Admissions | Commercial indicator | A request to book is not a confirmed booking; retain a qualified-enquiry subset for the next rate. |
| Qualified-to-booked rate | Qualified enquiries that book | qualified enquiries with a booked consultation / qualified enquiries | Bigin / booking record | Weekly | Admissions | Commercial indicator | Cohort-based; one parent counted once. |
| Consultations attended | Parent consultations actually held | Count distinct attended consultations | Bigin / attendance record, verify | Weekly | Admissions | Commercial indicator | Reschedules do not add extra conversions. |
| Booking-to-attendance rate | Bookings that result in attendance | consultations attended / consultations booked | Bigin / booking record | Weekly | Admissions | Commercial indicator | Use a matured booking cohort. |
| Cost per attended consultation | Media cost per attended consultation | spend / consultations attended | Meta + Bigin / booking record | Weekly | Admissions | Commercial indicator | Use aligned cohort spend. |
| Diagnostics arranged | Free initial diagnostic appointments confirmed | Count distinct arrangements | Bigin / academic record, verify | Weekly | Academic | Process indicator | Diagnostic is the current entry route, free and separate from teaching credit. |
| Diagnostics completed | Free initial diagnostics actually completed | Count distinct completions | Bigin / academic record, verify | Weekly | Academic | Commercial indicator | Do not count later assessments as this diagnostic. |
| Diagnostic attendance rate | Arranged diagnostics completed | diagnostics completed / diagnostics arranged | Bigin / academic record | Weekly | Academic | Process indicator | Use matured arrangements. |
| Suitable group matches | Enquiries with a confirmed compatible group/place and lesson dates | Count distinct confirmed matches | Bigin / operations record, verify | Weekly | Matching | Commercial indicator | Match precedes starter payment. |
| Match rate | Placement-assessed qualified enquiries with suitable matches | suitable group matches / qualified enquiries assessed for placement | Bigin / operations record, verify | Weekly | Matching | Commercial indicator | Denominator needs a recorded placement decision; **SOURCE OF TRUTH TO BE CONFIRMED**. A completed diagnostic alone does not prove a suitable place exists. |
| Qualified but no capacity | Qualified demand lacking compatible place/time/teacher | Count distinct qualified enquiries with no suitable capacity | Bigin / operations record, verify | Weekly | Matching | Capacity signal | Keep separate from unqualified. |
| £100 starters | Families with first £100 payment received for four one-hour lessons | Count distinct paid new starters | Payment/finance record | Weekly | Commercial | Commercial | Do not count promised or requested payment. |
| Starter conversion rate | Qualified enquiries that become paid starters | £100 starters / qualified enquiries | Bigin + payment record | Weekly; cohort | Commercial | Commercial | Use a mature qualified cohort; record capacity exclusions separately. |
| Media CAC per starter | Meta media spend for each paid starter | Meta spend / £100 starters | Meta + payment record | Weekly; cohort | Commercial | Commercial | Near-term proxy, not fully loaded CAC. |
| Four-lesson completions | Starters completing four attended teaching lessons | Count distinct completions | Teaching/operations record | Cohort | Product | Commercial | Do not include free diagnostic as a teaching lesson. |
| Continuations after four lessons | Students continuing under an explicitly agreed arrangement | Count distinct continuing students | Teaching/operations + payment record | Cohort | Product | Commercial | No automatic monthly conversion. |
| Continuation rate | Paid starters who continue after the first four lessons | continuing students / £100 starters | Teaching/operations + payment record | Cohort | Product | Commercial | Only judge mature starter cohorts; report pending separately. |
| Media CAC per continuing student | Meta media cost per continuing student | Meta spend / continuing students | Meta + teaching/operations | Cohort | Commercial | North-star proxy | Retention horizon beyond initial continuation is **UNRESOLVED — PRAKASH DECISION REQUIRED**. |
| Collected revenue | Actual cash received from attributed students | Sum verified receipts | Payment/finance record | Weekly; cohort | Commercial | Commercial | Include starter and later receipts separately in analysis. |
| Refunds | Actual cash refunded to attributed students | Sum verified refunds | Payment/finance record | Weekly; cohort | Commercial | Commercial | Unused prepaid lessons are refundable when the family stops. |
| Net collected revenue | Cash received less refunds | collected revenue − refunds | Payment/finance record | Weekly; cohort | Commercial | Commercial | Use when both components are available. |
| Continuing students by cohort | Students continuing after starter, grouped by acquisition cohort | Count distinct continuing students per cohort | Teaching/operations record | Cohort | Retention | Commercial | Future retention horizon is unapproved. |
| Retained revenue | Revenue received from continuing students in a defined horizon | Sum receipts from continuing cohort | Payment/finance record | Cohort | Retention | Commercial | Define horizon before comparing cohorts. |
| Retention duration | Time a student remains under an agreed ongoing arrangement | End/active date − continuation start date | Teaching/operations record | Cohort | Retention | Commercial | **UNRESOLVED — PRAKASH DECISION REQUIRED**: reporting horizon and active-status rule. |

## 3. Exact Formula Definitions

```text
frequency = impressions / reach
CPM = spend / impressions × 1,000
outbound CTR = outbound clicks / impressions
outbound CPC = spend / outbound clicks
click-to-LPV rate = landing-page views / outbound clicks
LPV-to-enquiry rate = successful enquiries / landing-page views
CPL = spend / successful enquiries
genuine enquiry rate = genuine enquiries / successful enquiries
reachable rate = reachable enquiries / successful enquiries
qualified rate = qualified enquiries / successful enquiries
cost per qualified enquiry = spend / qualified enquiries
qualified-to-booked rate = qualified enquiries with a booked consultation / qualified enquiries
consultation attendance rate = consultations attended / consultations booked
cost per attended consultation = spend / consultations attended
diagnostic attendance rate = diagnostics completed / diagnostics arranged
match rate = suitable group matches / qualified enquiries assessed for placement
starter conversion rate = £100 starters / qualified enquiries
starter media CAC = Meta spend / £100 starters
continuation rate = continuing students / £100 starters
continuing-student media CAC = Meta spend / continuing students
net collected revenue = collected revenue − refunds
```

Multiply ratios by 100 for display as percentages. If a denominator is zero, missing or not yet mature, show **N/A**, not `0%`, `£0` or an infinite cost. A true zero numerator with a positive, mature denominator may be reported as zero. Keep the currency GBP. Do not divide all campaign spend by a creative's starters; allocate matching spend to that creative and acquisition cohort. Do not sum platform reach or ratios across ad rows. Deduplicate parent enquiries and students before stage counts.

The CSV template is a blank input/reporting scaffold, not a live integration or formula engine. Its `date` is the acquisition cohort date, and `as_of_date` is when downstream outcomes were checked. Use a consistent cohort window in each row. A calendar-week founder dashboard may show current activity, but CAC and progression rates must use matched acquisition cohorts and sufficient maturation time; do not combine this week's spend with last month's starters.

## 4. Source of Truth by Metric

| System | Authoritative for | Boundary |
|---|---|---|
| **Meta Ads Manager** | Spend, impressions, reach, frequency, outbound clicks, platform CPM/CTR/CPC and Meta-reported Lead | Meta Lead is a platform event count, not an actual qualified Bigin enquiry or student. Campaign publication is confirmed; delivery and first genuine lead remain to verify. |
| **Website / Pixel** | Landing-page behaviour where measured and the consent-gated browser `Lead` event | Exact live LPV measurement, event receipt and consent impact require verification. Browser event ≠ confirmed Bigin record. |
| **Bigin** | Actual recorded enquiry, original source/UTM context captured by the current form, contactability, qualification and documented progression | The controlled test verified canonical parent contact, Year Group, Subject, Lead Source, Stage and Meta `utm_content` in Description. Verify first genuine lead and ongoing workflow delivery. |
| **Payment / finance record** | £100 starter payment, collected revenue and refunds | **SOURCE OF TRUTH TO BE CONFIRMED** for the precise operational record; do not invent a payment integration. |
| **Teaching / operations record** | Lessons started, four-lesson completion, group fit and continuation | **SOURCE OF TRUTH TO BE CONFIRMED** for the precise operational record and retention horizon. |
| **Booking / academic / matching record** | Consultation attendance, diagnostic and suitable group decision where actually recorded | **SOURCE OF TRUTH TO BE CONFIRMED** for exact system, owner and status fields. |

The current public starter is a free initial diagnostic followed, only after a suitable place and dates are confirmed, by £100 prepaid for four complete one-hour lessons at £25/hour in a four-student group. Progress and group fit are reviewed after four lessons. If both sides are happy, continuation is explicitly agreed at £25/hour or under a fixed monthly arrangement. There is no automatic monthly conversion or renewal. Unused prepaid teaching is refunded if the family stops. AQA, Edexcel and OCR are supported; places depend on a suitable group match. A-Level admissions are closed.

### Bigin acknowledgement routing and remaining source-of-record work

The active `Year 9 Maths Acknowledgement Email` runs immediately on Admission Created with Year Group = Year 9, Subject = Maths and Description containing `landing_page=/year-9-maths`. Template: `Year 9 Maths Enquiry Acknowledgement`; recipient: Parent Email; sender/reply-to: Jothi Learning Admissions; parent merge: `${Admissions Pipeline.Parent Name}`. `Parent Acknowledgement Email - General Enquiries` is active for other/general enquiries with template `Parent Enquiry Acknowledgement`. The original generic workflow is inactive to prevent a duplicate. Route by Year 9 funnel membership, never by Meta/OpenAI ad source. Check that the first genuine Year 9 enquiry gets exactly one acknowledgement.

Payment/finance is authoritative for starter paid, collected revenue and refunds; teaching/operations for lesson start, four-lesson completion and continuation. The exact named systems and fields for these records remain to be formalised. Booking/diagnostic/matching record ownership also remains to be verified; do not infer a completed stage from an ad event.

## 5. Attribution Rules

Every Meta 2.0 destination URL **MUST** include `utm_source=meta`. The supplied standard is:

```text
utm_source=meta
utm_medium=paid_social
utm_campaign=meta2_y9_maths_oct26
utm_content=<creative_identifier>
```

The current local Year 9 form classifies `meta`, `openai` or `unknown` from explicit `utm_source` evidence. For Meta website enquiries it writes `marketing_platform=Meta` into Bigin Description, leaves `POTENTIALCF12` blank, and places `source=meta` in the session marker. For OpenAI it writes `POTENTIALCF12=OpenAI Ads`; the OpenAI `lead_created` event requires `marker.source=openai`. Unknown traffic must not be assigned to either platform by inference. Meta traffic cannot fire the OpenAI `lead_created` path. The form now writes supplied `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` and `oppref` into Description using the existing UTM sanitisation. Use non-personal creative identifiers; destination UTMs must not carry parent or student information. Controlled Bigin receipt was verified for `foundations_static`; verify genuine leads and cohort linkage before relying on creative-level outcomes.

Preserve the original acquisition source for the cohort when a parent later emails, uses WhatsApp, returns directly or receives an admissions call. Do not overwrite historical source conventions. The controlled record confirmed `Lead_Source=Website Contact Form`; preserve raw Meta UTM evidence separately in Description. Campaign/ad-set/ad IDs and structured creative attribution are desirable but not evidenced by the reviewed form.

## 6. Creative-Level Reporting

The intended trace is **campaign → ad set → concept A/B/C → `utm_content` → enquiry → downstream outcome**, with Meta campaign/ad-set/ad identifiers where practical. For each concept, compare spend, outbound clicks, LPVs, enquiries, qualified parents, consultations attended, starters, continuations and CAC. This is how creative can be judged by commercial cohort quality rather than surface CTR.

**Historical draft note:** the earlier Ad B shell used `B | Groups of Four | Draft` and `groups_of_four`. The published B ad is `B | Maths Confidence | Draft` with `utm_content=maths_confidence`. The local form includes `utm_content` in Bigin Description, and the controlled test verified creative attribution for A. Until a genuine lead and downstream record linkage are verified, label unsupported outcome splits **UNATTRIBUTED / INSUFFICIENT DATA**. Do not infer attribution from the parent's words, the ad name alone or Meta's aggregate conversion estimate.

## 7. Lead Status Definitions

| Status | Proposed operational meaning |
|---|---|
| RAW ENQUIRY | A unique, successfully recorded Bigin enquiry. |
| GENUINE | A real parent/guardian enquiry rather than a test, duplicate or evidenced spam. |
| REACHABLE | Two-way contact with the parent/guardian has been established. |
| QUALIFIED | **PROPOSED DEFINITION — PRAKASH TO APPROVE:** a verified parent/guardian seeking ongoing Maths support for a Year 9 child, within Jothi's teaching scope, who understands the broad offer, engages in two-way contact, and has plausible timetable/start compatibility. |
| QUALIFIED — NO SUITABLE CAPACITY | Meets qualification criteria but lacks a compatible group/place/time. Report separately from unqualified. |
| PAID STARTER | First £100 payment received for the four-lesson starter after place and dates were confirmed. |
| CONTINUING STUDENT | Student continues after the initial four lessons under an explicitly agreed arrangement. |

The precise status fields, reviewer and timestamps are **UNRESOLVED — PRAKASH DECISION REQUIRED** and require live Bigin/operations verification. Do not silently treat a diagnostic booking or a payment request as a paid starter.

## 8. Disqualification and Loss Reasons

**PROPOSED — PRAKASH TO APPROVE** as a short controlled list: wrong year group; wrong subject; not seeking ongoing tuition; unreachable; duplicate/test/spam; timetable incompatible; no suitable group capacity; fee/value mismatch; chose another provider; no longer looking; other. Keep “no suitable group capacity” separate from lead quality. Capture a short note for “other”, but avoid free-text-only reporting or sensitive diagnostic detail in advertising exports.

## 9. Monitoring Cadence

| Cadence | Review | Operating rule |
|---|---|---|
| Daily safety check | Spend/delivery, site and form, Bigin arrivals, missing/duplicate conversions, wrong source, urgent capacity change | Fix failures promptly. Do not optimise every few hours. |
| Twice-weekly creative review | Spend and impressions by A/B/C, outbound CTR/CPC, LPV, enquiry and early quality | Mark immature or thin cohorts `INSUFFICIENT DATA`. |
| Weekly commercial review | Qualified enquiries, consultation progression, diagnostics, matches, £100 starters, media CAC, refunds and capacity | Identify the largest meaningful leak and owner. |
| Cohort review after sufficient time | Four-lesson completion, continuation, retained revenue and eventual fully loaded CAC | Do not penalise a newer creative before its cohort could mature. Retention horizon is unresolved. |

## 10. Funnel Reconciliation

Regularly reconcile **Meta-reported Leads against actual Bigin enquiries with explicit `utm_source=meta` evidence**. Investigate Meta Lead without Bigin record, Bigin Meta enquiry without expected event, duplicate records/events, attribution mismatch and missing `utm_source=meta`. Record the difference and cause; do not change data merely to make totals equal.

The current `script.js` Meta browser `Lead` is consent-gated and uses a pending-enquiry marker on a success route, but the reviewed function does not check `marker.source`. It can therefore be unsuitable as a source-specific Meta 2.0 enquiry count without additional verification. The OpenAI `lead_created` event is separately source-gated in `year-9-maths-success.js`. Browser consent and platform attribution windows may also cause honest count differences. Verify the live event flow before using Meta Lead to judge acquisition.

## 11. Decision Framework

### Technical stop

Pause or investigate immediately for a broken form, missing CRM records, duplicate conversion defect, privacy issue, incorrect source attribution or no fulfilment capacity. Record the issue, affected period and revalidation before resuming.

### Commercial review

The prior independent review proposed approximately **£140 spend** as a checkpoint if there are no qualified enquiries after reasonable contact time; approximately **£280 spend** as a pause-and-diagnose checkpoint if there are still no attended consultations after adequate follow-up; and **£420** as a proposed initial test maximum unless separately extended.

**PROVISIONAL META 2.0 REVIEW GUARDRAILS — PRAKASH APPROVAL REQUIRED BEFORE TREATING AS STANDING POLICY.** They are not statistical laws and do not authorise spend. The published campaign has a £30/day ad-set budget; these proposed review guardrails do not change or extend that authorisation. There are no arbitrary CTR/CPC pass marks.

## 12. Creative Decision Rules

Review each creative in layers: **attention → deliberate traffic → landing conversion → lead quality → admissions progression → paid starter → continuation**. A creative should not be paused solely because another has higher CTR. If volume or attribution is insufficient, state **INSUFFICIENT DATA**. Strong CTR with poor-quality enquiries suggests a message/expectation or page-match question. Lower CTR with materially better starters and CAC can indicate the stronger commercial creative. Account for cohort age, capacity and follow-up before attributing losses to the ad.

## 13. Experiment Discipline

For every significant change, record: date; hypothesis; variable changed; previous state; new state; expected effect; evaluation metric; minimum observation window where applicable; result; decision; next action. Prefer one meaningful variable at a time and compare cohorts at equivalent maturity. A technical repair can interrupt an experiment; record it clearly. Do not change creative, page, offer and follow-up together without a genuine operational reason.

## 14. Scaling Gate

Before meaningful budget scaling, check paid-starter evidence, early continuation, qualified demand, working admissions follow-up, suitable group capacity, acceptable CAC and absence of measurement defects. Do not scale because Meta reports cheap leads. The previous review's suggestion of **8–10 paid admissions across more than one cohort** is **REFERENCE GUIDANCE — NOT A HARD RULE**. The acceptable CAC, retention horizon and scale increment are **UNRESOLVED — PRAKASH DECISION REQUIRED**.

## 15. Weekly Founder Dashboard

Use blank values until verified. `N/A` means the denominator is zero, missing or the cohort is immature. Keep the weekly activity view distinct from the matched acquisition cohort used for CAC.

| Week / cohort | Spend | Enquiries | CPL | Reachable | Qualified | Cost/qualified | Consultations booked | Consultations attended | Diagnostics | Suitable matches | £100 starters | Starter CAC | Continuations | Continuing-student CAC | Revenue | Refunds | Capacity issues |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| To be populated from verified sources |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

| Creative concept | Spend | Outbound clicks | LPVs | Enquiries | Qualified | Consultations attended | £100 starters | Continuations | Starter CAC | Continuing-student CAC | Attribution/data note |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| A — GCSE Foundations |  |  |  |  |  |  |  |  |  |  |  |
| B — Maths Confidence |  |  |  |  |  |  |  |  |  |  |  |
| C — Parent Proof |  |  |  |  |  |  |  |  |  |  |  |

## 16. Questions Every Review Must Answer

1. Where is the biggest meaningful funnel leak?
2. Is it a traffic, page, admissions, capacity or product problem?
3. Which creative is producing the strongest commercial cohort?
4. Are we measuring enough downstream data to make that decision?
5. What single change has the highest expected leverage?
6. What should we deliberately **not** change yet?
7. Do we have capacity to accept more successful demand?
8. Is CAC moving towards a sustainable level?
