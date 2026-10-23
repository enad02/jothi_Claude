# SATs Maths Learning Roadmap — Academic Review Release Record

**Release purpose:** independent academic review only. This is not a production publication approval.

## Repository release

| Field | Status |
| --- | --- |
| Repository | `D:\Jothi\WEB\Live site\Jothi_2026_Live` |
| Review branch | `review/sats-maths-roadmap-academic` |
| Reviewed roadmap commit | `b1483acf3a3973e254a942cb0092bc2958ebbc47` — `feat(sats-roadmap): prepare 60-topic roadmap for academic review` |
| Remote push | Pushed to `origin/review/sats-maths-roadmap-academic` |
| Merge to `main` | Not performed |
| Production deployment | Not performed |

## Baseline and technical status

- Canonical strands: 8.
- Canonical topic records: 60 unique IDs.
- Active illustration mappings: 60; mapping validator passed.
- Deployable active images: 61 unique files, 5,685,947 bytes (60 topic illustrations plus one additional strand thumbnail; seven other thumbnails reuse mapped topic images).
- Metadata: `noindex,follow` remains present in `index.html`.
- Teacher-resource privacy: no public teacher-resource URL is included in the roadmap implementation.
- Static JavaScript syntax check: passed.

## Asset custody

- Housekeeping audit: `qa/ROADMAP_ASSET_HOUSEKEEPING_REPORT.md`.
- Source archive (not staged or deployable): `D:\Jothi\WEB\Live site\Jothi_2026_Live\qa\roadmap-source-archives\sats-maths-roadmap-source-materials-2026-10-23.zip`.
- Archive source files: 257; source total 146,488,071 bytes.
- Archive size: 131,861,814 bytes.
- SHA-256: `5B0700FE51DE6CD9A44A928FAF308753EC2638877134C5B769852E82DA2C6E75` (verified against its manifest).
- WorkDrive Z archive location: not selected because no existing authorised project archive path could be safely resolved. The local, checksum-verified archive must be retained until an authorised WorkDrive location is supplied.

## Review and preview status

| Status | State |
| --- | --- |
| COMMITTED | Yes — reviewed baseline commit recorded above |
| PUSHED | Yes — `origin/review/sats-maths-roadmap-academic` |
| PREVIEW DEPLOYED | No |
| PREVIEW VERIFIED | No |
| ACADEMICALLY APPROVED | No — Sruthi and Radhika review pending |
| PUBLICLY RELEASED | No |

The repository documents Cloudflare Pages production deployment from `main`, but contains no documented protected preview workflow or access-control configuration for this branch. A publicly reachable branch preview would not satisfy the required protection merely because it is unlisted or `noindex`. No deployment was created.

## QA status

- Local technical validation completed: mapping integrity and JavaScript syntax.
- Hosted browser QA remains outstanding because no protected HTTPS review environment has been authorised or created.
- Real hosted checks still required: all eight strands, all 60 topic/image pairings, desktop split card, Mobile Stable Reader V2, keyboard interaction, responsive widths, fonts, assets, privacy boundaries and reference links.

## Academic review instructions

Sruthi and Radhika should use `ACADEMIC_REVIEW_GUIDE.md`. Each topic begins as `NOT YET REVIEWED`; do not mark a topic academically approved without recorded reviewer feedback.

Priority review items carried forward:

- `SAT-MATH-S01-T02` — rounding visual clarity.
- `SAT-MATH-S01-T04` — visual consistency.
- `SAT-MATH-S02-T05` — short-division exchange notation.
- Overall Year 5/6 curriculum coverage and topic classifications.

## Outstanding publication gates

1. Founder approval of an authorised, access-controlled HTTPS review environment.
2. Hosted preview deployment and recorded browser QA.
3. Independent tutor feedback, recorded per topic.
4. Resolution of any academic corrections without changing the approved review baseline until agreed.
5. Explicit founder approval before any merge, noindex change or public production release.
