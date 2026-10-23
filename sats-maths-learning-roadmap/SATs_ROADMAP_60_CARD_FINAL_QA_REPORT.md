# SATs Maths Learning Roadmap — 60-card final QA report

Audit date: 23 October 2026
Scope: local, non-mutating QA only. This report is not founder approval, tutor academic approval, curriculum certification or publication approval.

## Executive summary

- Technical mapping baseline: **PASS** — 8 canonical strands, 60 unique topic records and 60 declared mappings. `scripts/validate-sats-roadmap-mappings.mjs` passed, including mapped-file existence and strand/path integrity.
- Asset availability: all 60 mapped image paths are present. The newly integrated Strand 8 WebPs were independently decoded and returned HTTP 200; the mapping validator confirmed the complete mapped set.
- Metadata and privacy: `index.html` retains `noindex,follow`. Static code inspection found no exposed teacher-resource URL; runtime topic records retain only an internal resource key after private link objects are removed.
- Visual consistency: 57 cards are classed **A — keep unchanged** and 3 are **B — minor correction or focused review desirable**. No automatic replacements are recommended by this audit.
- Academic state: diagrams generally support their listed objectives. `SAT-MATH-S02-T05` remains an explicit tutor-review hold for written short-division notation. Formal statutory-coverage and academic approval are **unverified**.
- Browser QA: **outstanding**. No interactive browser connection was available; no desktop, tablet or mobile screenshots were captured, and no user interaction was represented as tested.

## Visual-class definition

| Class | Meaning |
|---|---|
| A | Keep unchanged. Candidate is visually coherent and readable in its source artwork; founder and tutor gates remain separate. |
| B | Minor correction desirable or targeted review required; no automatic change authorised. |
| C | Replacement recommended. |

## Summary by strand

| Strand | Topics | Mapping / technical status | Visual outcome | Academic focus |
|---|---:|---|---|---|
| 1 Numbers and place value | 7 | 7/7 mapped | 5 A, 2 B | Rounding number-line readability; negative-number interval labelling. |
| 2 Calculations and number operations | 7 | 7/7 mapped | 6 A, 1 B | Short-division exchange notation requires tutor judgement. |
| 3 Fractions | 8 | 8/8 mapped | 8 A | Fraction equivalence, mixed-number and division-model review. |
| 4 Decimals and percentages | 9 | 9/9 mapped | 9 A | Decimal alignment, scale and percentage-model review. |
| 5 Ratio, proportion and algebra | 8 | 8/8 mapped | 8 A | Number-puzzle uniqueness and algebra notation review. |
| 6 Measurement and money | 5 | 5/5 mapped | 5 A | Units, estimates and money/temperature reasoning review. |
| 7 Shapes, area, volume and angles | 9 | 9/9 mapped | 9 A | Exact geometry, angle sectors and nets review. |
| 8 Coordinates, transformations and statistics | 7 | 7/7 mapped | 7 A | Coordinate order, transformations, graph scales and pie sectors review. |

## 60-card audit

Visual class assesses the artwork at source resolution against the local V5 system. Diagram support is a QA judgement against the existing local objective, not formal academic sign-off. Every abbreviated table code is a canonical topic ID with the `SAT-MATH-` prefix (for example, `S01-T01` means `SAT-MATH-S01-T01`).

| Topic | Title / year | Diagram support and mathematical audit | Visual | Tutor judgement / note |
|---|---|---|---|---|
| S01-T01 | Place value — Y5 | Supports place-value partitioning: 482,761 highlights 2 as 2,000. No inconsistency found. | A | Confirm terminology progression for large whole numbers. |
| S01-T02 | Rounding whole numbers — Y5 | 6,748 sits two below the 6,750 midpoint and rounds to 6,700. | B | Improve only if desired: label the plotted 6,748 point and intermediate scale more explicitly. |
| S01-T03 | Roman numerals — Y5 | XIV = 10 + 4 = 14; subtractive notation is correct. | A | Confirm scope of Roman-numeral examples. |
| S01-T04 | Negative numbers; intervals across zero — Y5/6 | −4 to +3 is a rise of 7; number-line direction is correct. | B | Minor visual consistency review: this Canva variant has a lighter, less structured finish than later cards. |
| S01-T05 | Factors and multiples — Y5 | 3×4 and 2×6 arrays correctly represent factors of 12. | A | Confirm distinction between factors and multiples in accompanying copy. |
| S01-T06 | Prime numbers — Y5 | Seven has only 1×7; eight additionally has 2×4. | A | Confirm use of factor pairs as intended introductory model. |
| S01-T07 | Order of operations — Y6 | 2 + 3×4 = 14; (2+3)×4 = 20. | A | No issue found. |
| S02-T01 | Addition — Y5 | 2,468 + 1,357 = 3,825; regrouping shown by place value. | A | Tutor to confirm preferred written-method language. |
| S02-T02 | Subtraction — Y5 | 5,002 − 1,785 = 3,217; exchange through zero columns is correct. | A | Tutor to confirm exchange notation convention. |
| S02-T03 | Short multiplication — Y5 | 347×6 = 2,082; carried tens/hundreds agree with the calculation. | A | Tutor to confirm place-value phrasing for carries. |
| S02-T04 | Long multiplication — Y6 | 36×24 = 144 + 720 = 864; tens row is aligned as 20. | A | No issue found. |
| S02-T05 | Short division — Y5 | 864÷4 = 216; two tens exchange to 20 ones and combine with 4 ones to make 24. | B | **Existing academic hold remains open.** Tutor must approve the carried-remainder/exchange notation. |
| S02-T06 | Long division — Y6 | 936÷24 = 39; 93−72=21, bring down 6, then 216−216=0. | A | Tutor to confirm method sequence and alignment conventions. |
| S02-T07 | Interpreting remainders — Y6 | 53÷8 = 6 r5; context correctly rounds up to 7 minibuses. | A | No issue found. |
| S03-T01 | Understanding fractions — Y5 | Exactly 3 of 4 equal parts shaded; numerator/denominator explanation agrees. | A | Confirm vocabulary progression. |
| S03-T02 | Simplifying fractions — Y6 | 6/8 = 3/4 with equal fraction bars. | A | Confirm common-factor explanation. |
| S03-T03 | Comparing and ordering fractions — Y5 | 1/4 < 1/2 < 3/4 positions agree on the number line. | A | No issue found. |
| S03-T04 | Adding and subtracting fractions — Y5/6 | 2/8 + 3/8 = 5/8; equal parts are used. | A | Tutor to confirm Year 5/6 progression in surrounding copy. |
| S03-T05 | Adding and subtracting mixed numbers — Y6 | 1¼ + 2¼ = 3½; whole and fractional bars agree. | A | Tutor to confirm mixed-number representation. |
| S03-T06 | Multiplying fractions — Y5/6 | Area model gives 2/3×3/4 = 6/12 = 1/2. | A | Confirm suitability of fraction-by-fraction step for intended progression. |
| S03-T07 | Dividing a proper fraction by a whole number — Y6 | 3/4÷2 = 3/8; two groups of three eighths are correctly shown. | A | Confirm language distinguishes sharing from multiplying by a reciprocal. |
| S03-T08 | Fractions of amounts — Y6 | 3/5 of 20 = 12; five groups of four are clear. | A | No issue found. |
| S04-T01 | Understanding and rounding decimals — Y5 | 3.47 rounds to 3.5 to one decimal place; midpoint/scale presentation supports it. | A | Tutor to confirm rounding wording. |
| S04-T02 | Connecting fractions, decimals and percentages — Y5 | 1/4=0.25=25%, 1/2=0.5=50%, 3/4=0.75=75%. | A | No issue found. |
| S04-T03 | Multiplying and dividing by 10, 100 and 1,000 — Y5 | 4.37×10=43.7 and 4.37÷10=0.437; place-value movement agrees. | A | Confirm language avoids implying digits physically move. |
| S04-T04 | Adding and subtracting decimals — Y5 | 2.35+1.48=3.83; 5.60−2.73=2.87; decimal points align. | A | No issue found. |
| S04-T05 | Multiplying decimals — Y6 | 2.4×3=7.2, shown as three equal 2.4 jumps. | A | Confirm scaling/repeated-addition connection. |
| S04-T06 | Dividing to decimal answers — Y6 | 3.6÷4=0.9; 36 tenths are shared equally. | A | Tutor to confirm decimal-division model. |
| S04-T07 | Understanding percentages — Y5 | £60: 10%=£6, 20%=£12, sale price £48. | A | No issue found. |
| S04-T08 | Percentages of amounts and missing values — Y6 | 25% of £80 = £20; four equal parts agree. | A | Tutor to confirm missing-value extension is covered by illustration/copy. |
| S04-T09 | Ordering fractions, decimals and percentages — Y6 | Conversions and order representations agree in the artwork. | A | Tutor to verify all displayed number-line placements. |
| S05-T01 | Ratio — Y6 | 2:3 scales to 4:6; counters and labels agree. | A | No issue found. |
| S05-T02 | Proportion and comparison — Y6 | 1 pack=6 stickers; 2/3/4 packs map to 12/18/24. | A | Confirm multiplicative language. |
| S05-T03 | Recipes and scaling — Y6 | 4→10 uses ×2.5; 200g→500g, 300ml→750ml, 2→5. | A | No issue found. |
| S05-T04 | Introduction to algebra and simple formulae — Y6 | n+4 table gives 2→6, 5→9, 8→12. | A | Confirm formal notation terminology. |
| S05-T05 | Function machines — Y6 | 7 +3 then ×2 =20; reverse ÷2 then −3 =7. | A | No issue found. |
| S05-T06 | Missing numbers, equations and substitution — Y6 | n+7=15; n=8; check 8+7=15. | A | Confirm equality/balance language. |
| S05-T07 | Linear number sequences — Y6 | 4,7,10,13,16 with constant +3 difference. | A | No issue found. |
| S05-T08 | Number puzzles — Y6 | Square+triangle=11, triangle+circle=8, square+circle=9; 6,5,3 is uniquely consistent. | A | Tutor to independently verify puzzle uniqueness. |
| S06-T01 | Measurements and units — Y5 | Appropriate-unit prompts and ruler reading to 7 cm agree. | A | Confirm breadth of unit choices. |
| S06-T02 | Converting metric units and time — Y5 | 2.5m=250cm and displayed time/metric conversions agree. | A | Confirm conversion set aligns to intended teaching sequence. |
| S06-T03 | Miles, kilometres and approximate imperial comparisons — Y5 | 5 miles≈8km and 10 miles≈16km are valid approximations. | A | Tutor to confirm approximation symbol/language. |
| S06-T04 | Temperature and changes across zero — Y6 | −4°C to +6°C is +10°C; scale and signed values agree. | A | No issue found. |
| S06-T05 | Money calculations — Y6 | £2.40+£1.25+£0.85=£4.50; £5−£4.50=£0.50. | A | No issue found. |
| S07-T01 | Area compared with perimeter — Y6 | 3×4 and 2×6 both area 12; perimeters 14 and 16. | A | No issue found. |
| S07-T02 | Area and volume calculations — Y6 | 6×4=24cm² and 4×3×2=24cm³; unit types distinguished. | A | Tutor to confirm dimension labelling on cuboid. |
| S07-T03 | Areas of triangles and parallelograms — Y6 | Base 8cm and perpendicular height 5cm give 20cm² and 40cm². | A | Confirm emphasis that sloping side is not height. |
| S07-T04 | Volume of cubes and cuboids — Y5/6 | 4×3×2=24cm³ and visible unit-cube structure agree. | A | No issue found. |
| S07-T05 | Properties of 2D shapes — Y5 | Right-angle, equal-side and parallel-side markings match square, rectangle, rhombus and parallelogram. | A | Tutor to confirm intended property vocabulary. |
| S07-T06 | 3D shapes, faces, edges, vertices and nets — Y5/6 | Cube has 6 faces, 12 edges, 8 vertices; six-square net is valid. | A | Confirm net-folding explanation. |
| S07-T07 | Unknown angles in polygons — Y6 | 90°+110°+80°+?=360°, so ?=80°. | A | No issue found. |
| S07-T08 | Parts of a circle — Y6 | Radius 5cm, diameter 10cm through centre, circumference edge callout agree. | A | Tutor to confirm exact terminology. |
| S07-T09 | Angles at points, on straight lines and vertically opposite — Y5/6 | Replacement shows matching approximately 110°/70° opposite sectors and 110°+70°=180°. | A | Tutor to validate geometric precision and progression. |
| S08-T01 | Position and direction — Y5 | Route is exactly 3 squares north then 2 east; compass key agrees. | A | No issue found. |
| S08-T02 | Coordinates in four quadrants — Y6 | A(−3,2), B(2,−1), C(2,3), D(−2,−3) all match axes. | A | Confirm coordinate-order language. |
| S08-T03 | Translation — Y5 | Every triangle vertex moves (+4,+2); shape remains congruent and unturned. | A | No issue found. |
| S08-T04 | Reflection — Y5 | Corresponding vertices are equidistant perpendicularly from vertical mirror line. | A | Confirm reflection vocabulary. |
| S08-T05 | Mean average — Y6 | 6+8+10+7+9=40; 40÷5=8. | A | Confirm mean versus median comparison is instructional enrichment. |
| S08-T06 | Line graphs — Y5 | Equal hourly intervals; 8,12,15,13,10°C points align to scale. | A | No issue found. |
| S08-T07 | Pie charts and angles — Y6 | 10/5/3/2 pupils map to 180°/90°/54°/36°; total 360°. | A | Tutor to confirm construction expectations and sector precision. |

## Visual consistency findings

The stronger, panel-led ChatGPT-generated cards in Strands 3–8 establish the dominant local V5 visual standard: true-white squared paper, pale-blue grid, deep-blue handwriting, restrained gold emphasis, generous panel spacing and 6:5 composition. Strand 2 aligns closely with that system. Strand 1 is coherent but mixes earlier V5 and Canva variants; Topics 1.2 and 1.4 are the only visual B classifications because their looser presentation/contrast feels less consistent beside the later system. These are refinements, not replacement recommendations.

No source-level clipping, malformed notation or missing grid-paper treatment was identified in the asset review. Actual in-page crop, responsive scaling and display legibility still require browser QA.

## Academic and curriculum boundaries

This audit verifies internal arithmetic and diagram-to-objective consistency in the supplied artwork. It does **not** certify national curriculum statutory coverage, SATs suitability, sequencing or pedagogy. The current record is revision/enrichment-oriented and no authoritative statutory curriculum mapping was supplied for formal comparison.

- Coverage status: **unverified** for statutory Year 5 and Year 6 coverage as a whole.
- Likely enrichment/revision examples needing tutor context: Roman numerals, ratio recipe scaling, function machines, number puzzles, mean/median contrast and real-life percentage contexts.
- Specific tutor priorities: S02-T05 short-division exchange notation; S03 fraction progression; S04 decimal/percentage representations; S05-T08 puzzle uniqueness; S07 exact angle/geometry conventions; S08 chart and transformation conventions.

## Website experience QA

| Area | Status | Evidence / limitation |
|---|---|---|
| Eight tiles and 60 mapping keys | Technical pass | Validator reports 8 strands, 60 unique records and 60 mapped image files. |
| Image paths | Technical pass | Validator checks declared mapping files; current local server returned HTTP 200 for checked newly integrated assets. |
| Carousel, Previous/Next, Back to strands | Browser QA outstanding | Interactive browser connection unavailable. |
| Desktop, tablet and mobile layout | Browser QA outstanding | No real viewport exercise or screenshots captured. |
| Overflow, crop, height stability | Browser QA outstanding | Asset source review only; no browser assertion. |
| Keyboard flow and control accessibility | Browser QA outstanding | Markup uses buttons and image alt text, but no keyboard or assistive-technology test occurred. |
| SATs Maths Mastery link | Static pass; browser QA outstanding | Link is present in `index.html` with `/sats-maths-mastery/`; it was not clicked in a browser. |
| noindex metadata | Technical pass | `noindex,follow` remains in `index.html`. |
| Teacher-resource privacy | Static pass | No public teacher-resource URL found in page/roadmap script; browser review remains outstanding. |

## Founder and tutor approval requirements

### Founder visual review

1. Review all 60 cards in the real desktop, tablet and mobile carousel.
2. Confirm whether Strand 1 Topics 1.2 and 1.4 should receive minor visual harmonisation.
3. Confirm no artwork is cropped or too small at production breakpoints.

### Tutor academic review

1. Keep S02-T05 on its explicit short-division notation hold until approved.
2. Review all worked examples and representations as teaching models, especially the priority topics listed above.
3. Validate statutory Year 5/6 coverage and distinguish it from revision/enrichment content before any public academic claim.

## Release blockers

1. Founder visual approval is pending.
2. Independent tutor academic approval is pending; S02-T05 remains specifically held.
3. Interactive browser QA, including desktop/tablet/mobile screenshots and keyboard testing, has not occurred.
4. This roadmap remains intentionally local/noindex; no publication action is authorised by this audit.

## Audit artefacts

- `qa/final-60-card-mapping-validator.txt` — full validator output.
- `qa/visual-contact-strands-03-to-06.png` — asset-review contact sheet used for visual consistency assessment.

