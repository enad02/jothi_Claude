# SATs Maths Learning Roadmap - V5 Creative System

**Status:** Founder-approved creative direction. Use this system for all 60 topic cards unless a later founder approval explicitly changes it.

## Frozen visual system

- **Teaching surface:** true white `#FFFFFF` squared paper.
- **Grid:** 88 x 88 px squares on the 1440 x 1200 master; fine pale-blue lines `#D8EAF7`.
- **Maths ink:** blue gel-pen `#2455B5` for handwritten numbers, mathematical working and instructional annotations.
- **Gold emphasis:** retain the approved muted-gold treatment for the key digit, column or relationship being taught. It must support, not replace, clear labelling and contrast.
- **Charts and diagrams:** precise, clean SVG geometry; clear standard labels; no decorative objects that imply an incorrect mathematical quantity.
- **Illustration master:** 1440 x 1200 px (6:5), deterministic SVG source plus review-quality PNG. No device, browser or tablet frame inside the artwork.
- **Learning card:** maintain the approved desktop split (approximately 60% illustration / 40% explanation), with the artwork on the left and concise HTML explanation on the right. On mobile, stack illustration before explanation.
- **Explanation panel:** warm ivory `#FAF8F3`; no prominent gold, red or other coloured vertical divider. A faint neutral 1 px separation is the maximum if one is needed.
- **Typography:** retain the existing Jothi serif heading and body typography. In illustration masters, use the approved local teacher-print handwriting stack (`Segoe Print, Bradley Hand, Comic Sans MS, cursive`) for handwritten mathematical content only; keep table headings clear in a standard sans-serif. Do not add external font dependencies.
- **Navigation:** preserve the existing one-topic carousel, stable visual stage, Previous/Next controls, progress indicator, Back to strands control, strand hub and stable topic IDs.

## Approved Place Value reference asset

- Editable master: `img-src/strand-01-numbers-place-value/sats-roadmap-strand-01-topic-01-place-value-v5.svg`
- Rendered master: `img-src/strand-01-numbers-place-value/sats-roadmap-strand-01-topic-01-place-value-v5.png`
- Topic ID: `SAT-MATH-S01-T01`

Earlier Place Value masters are retained as historical versions and must not be overwritten.

## Future reasoning interaction

Where a topic benefits from it, structure reasoning as **Think -> Reveal -> Understand**:

1. Show the reasoning question first.
2. Use a clearly labelled native HTML `<details>` / `<summary>` control to reveal the answer and short explanation on request.
3. Keep the revealed explanation concise, mathematically accurate and visible to keyboard and screen-reader users through the native control.

This is an instructional interaction only. Do not add scoring, learner tracking, CRM, automated assessment or progress software.

## Content and teacher-resource boundary

Keep public topic content (topic ID, illustration, alternative text, explanation, worked example and reasoning) separate from future private teacher-resource mappings. The topic ID is the link between them. Do not place private URLs, teaching notes, credentials or protected-resource data in publicly delivered HTML, JavaScript or JSON. Any future private teacher experience requires an appropriately authorised delivery route.
