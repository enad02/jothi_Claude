# SATs Maths Learning Roadmap — Academic Review Release Record

**Release purpose:** independent academic review only. This is not a production publication approval.

## Repository release

| Field | Status |
| --- | --- |
| Repository | `D:\Jothi\WEB\Live site\Jothi_2026_Live` |
| Review branch | `review/sats-maths-roadmap-academic` |
| Reviewed roadmap commit | `b1483acf3a3973e254a942cb0092bc2958ebbc47` — `feat(sats-roadmap): prepare 60-topic roadmap for academic review` |
| Remote push | Pushed to `origin/review/sats-maths-roadmap-academic` |
| Public release commit | `b5530148ca9c034f569cb2d481cf44f10f294af3` |
| Merge to `main` | Completed through PR #13 as `a508f5e71f66dfcba3810f9e0bc6d45ca377f4b5` |
| Production deployment | Cloudflare Pages passed |
| Public URL | `https://jothi.uk/sats-maths-learning-roadmap/` |

## Baseline and technical status

- Canonical strands: 8.
- Canonical topic records: 60 unique IDs.
- Active illustration mappings: 60; mapping validator passed.
- Deployable active images: 61 unique files, 5,685,947 bytes (60 topic illustrations plus one additional strand thumbnail; seven other thumbnails reuse mapped topic images).
- Public metadata: `index,follow`, self-referencing canonical URL, Open Graph and Twitter metadata are present.
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
| PREVIEW DEPLOYED | Not applicable — founder approved public publication |
| PREVIEW VERIFIED | Not applicable |
| ACADEMICALLY APPROVED | No — Sruthi and Radhika review pending |
| PUBLICLY RELEASED | Yes — Cloudflare Pages production deployment passed |

The founder withdrew the protected-preview requirement and approved public publication. The public deployment remains an educational resource only; it does not state or imply independent academic approval.

## QA status

- Local technical validation completed: mapping integrity and JavaScript syntax.
- Hosted HTTP verification completed: the public page returns HTTP 200 with the required title, canonical URL and `index,follow`; all 61 active image URLs return HTTP 200 and decode as image assets.
- Representative internal-record, QA and source-download paths return the static HTML fallback rather than internal file content.
- Interactive browser QA remains outstanding: all eight strands, all 60 topic/image pairings, desktop split card, Mobile Stable Reader V2, keyboard interaction, responsive widths, fonts, assets, privacy boundaries and reference links.

## Academic review instructions

Sruthi and Radhika should use `ACADEMIC_REVIEW_GUIDE.md`. Each topic begins as `NOT YET REVIEWED`; do not mark a topic academically approved without recorded reviewer feedback.

Priority review items carried forward:

- `SAT-MATH-S01-T02` — rounding visual clarity.
- `SAT-MATH-S01-T04` — visual consistency.
- `SAT-MATH-S02-T05` — short-division exchange notation.
- Overall Year 5/6 curriculum coverage and topic classifications.

## Outstanding academic-review gates

1. Independent tutor feedback, recorded per topic.
2. Resolution of any academic corrections against the existing canonical topic IDs.
3. Founder review of real browser behaviour at desktop, tablet and mobile widths.
