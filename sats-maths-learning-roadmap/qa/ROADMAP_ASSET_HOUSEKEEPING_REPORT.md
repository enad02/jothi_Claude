# SATs Maths Roadmap Asset Housekeeping Report

**Audit date:** 23 October 2026
**Scope:** `sats-maths-learning-roadmap/`, with particular attention to `img-src/`.

## Baseline

- 8 canonical strands, 60 unique topic IDs and 60 mapped topic illustrations.
- Mapping validator: **PASS**.
- Hub configuration declares 8 strand previews. Seven reuse mapped topic artwork; one additional place-value thumbnail is required. This leaves **61 unique production image files**.
- `noindex,follow` remains present. The current JavaScript has no public teacher-resource URL; its teacher-resource fields are null/deleted internal placeholders.

## Inventory

| Category | Files | Bytes | Disposition |
|---|---:|---:|---|
| Entire roadmap directory | 369 | 173,264,622 | Review scope only; not all deployable. |
| `img-src/` | 318 | 152,569,111 | Source and production material mixed together locally. |
| Unique active mapped/thumbnail assets | 61 | 5,685,947 | Required by the review deployment: 56 WebP and 5 legacy active PNGs. |
| `website-ready/` files | 61 | 6,081,040 | Retain; includes the active derivative set. |
| `working/` files | 114 | 54,022,056 | Archive/preserve; do not deploy. |
| `final-approved/` files | 11 | 1,903,655 | Preserve; review provenance, not a statement of tutor approval. |
| `_historical/` files | 10 | 12,380,800 | Preserve; required numbering-correction provenance. |
| Root/candidate source material | 122 | 78,181,560 | Preserve in archive; not required by the deployed reader. |

The complete image-source breakdown is 177 PNG files (131,371,276 bytes), 63 SVG files (403,444 bytes), 63 WebP files (6,191,220 bytes), 7 JPEG/JPG files (3,625,652 bytes), 3 ZIP files (10,969,077 bytes), and supporting contact-sheet/record files.

## References and classification

| Classification | Finding | Recommended disposition |
|---|---|---|
| A — production-required | 60 topic mappings plus 8 preview declarations resolve to 61 unique paths. | Stage only these active images with the HTML, CSS and JavaScript. |
| B — editable/recoverable source | Root PNGs, SVG masters, `working/` copies and founder-corrected sources are documented by the Strand 01–08 asset records. | Preserve locally and in the verified archive; do not stage for the review deployment. |
| C — historical/rejected | `img-src/_historical/`, V1/V2 candidates and superseded S04 Ratio material are explicitly referenced by historical records. | Preserve; no deletion. |
| D — duplicate download | SHA-256 audit found 81 duplicate-content groups comprising 178 files. | Do not deduplicate until founder confirms provenance-retention policy. |
| E — QA/contact sheets | `qa/` contains screenshots, contact sheets, comparison pages and validator outputs. | Keep locally; exclude from review deployment. |
| F — unreferenced generated output | Candidate-only folders and non-active renders are not required by the active JavaScript or hub preview list. | Retain in archive; proposed future deletion only after two independent backup checks. |
| G — documentation/provenance | Strand asset records, historical records and final QA records explain source-to-WebP traceability. | Stage the academic-review-relevant Markdown records; retain large visual QA outputs locally. |

## Checksums and archive

An archive was created without deleting or moving originals:

- Location: `D:\Jothi\WEB\Live site\Jothi_2026_Live\qa\roadmap-source-archives\sats-maths-roadmap-source-materials-2026-10-23.zip`
- Scope: 257 source/candidate files outside `website-ready/`
- Source size: 146,488,071 bytes
- Archive size: 131,861,814 bytes
- SHA-256: `5B0700FE51DE6CD9A44A928FAF308753EC2638877134C5B769852E82DA2C6E75`
- Verification: archive hash matches the accompanying `.sha256.txt` manifest.

No authorised WorkDrive archive path could be safely resolved from the mapped `Z:` folders, so the archive remains local and outside the roadmap deployment directory. It must be copied to an approved WorkDrive destination before any future deletion decision.

## Deployment-footprint decision

The academic-review branch should stage the roadmap implementation, its active 61 production images, the mapping validator and review documentation only. It should not stage `working/`, rejected candidates, SVG/PNG masters, contact sheets, screenshots, local archives or other temporary QA outputs.

The five active PNG mappings in Strand 1 are currently required by the approved implementation. They are an intentional review-deployment exception to the WebP-only target and must not be removed or remapped during this release.
