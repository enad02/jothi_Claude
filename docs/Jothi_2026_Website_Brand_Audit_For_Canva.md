# Jothi 2026 Website Brand Audit For Canva

## 1. Files reviewed

Core site and documentation reviewed:

- `package.json`
- `README.md`
- `SOURCE_OF_TRUTH.md`
- `CURRENT_STATE.md`
- `styles.css`
- `index.html`
- `programmes.html`
- `site.webmanifest`
- `docs/Jothi_Design_Eye_Brief_Short.md`
- `docs/parent-advice-editorial-rules.md`

Parent Advice templates and generated pages reviewed for visual system only:

- `templates/parent-advice-index.html`
- `templates/parent-advice-category.html`
- `templates/parent-advice-article.html`
- `parent-advice/index.html`
- `parent-advice/gcse/what-should-year-10-students-do-over-summer/index.html`

Asset areas reviewed for current brand/logo identification:

- `Logo 2026.png`
- `favicon.ico`
- `assets/favicon/`
- `assets/fonts/`
- `assets/img/home/hero/`
- `assets/img/home/proof/`
- `assets/img/social/`
- `assets/img/team/`
- `assets/img/testimonials/`
- `assets/img/ukmt/`

No build, deploy, Git, image generation, or source edits were run.

## 2. Current typography

The current website typography is based on local font files, not remote Google Fonts.

Primary body font:

- Lato
- CSS variable: `--font-body-current: "Lato", "Helvetica Neue", sans-serif;`
- Local files:
  - `assets/fonts/lato/lato-400.woff2`
  - `assets/fonts/lato/lato-600.woff2`
  - `assets/fonts/lato/lato-700.woff2`

Primary heading / serif display font:

- Playfair Display
- CSS variable: `--font-serif-current: var(--font-serif-playfair);`
- Local files:
  - `assets/fonts/playfair-display/playfair-display-600.woff2`
  - `assets/fonts/playfair-display/playfair-display-700.woff2`

Fallbacks:

- Serif fallback: `Georgia, Cambria, "Times New Roman", serif`
- Sans fallback: `"Helvetica Neue", sans-serif`

Inter usage:

- No current active website source reviewed uses Inter as the brand font.
- Inter should not be used as the main Canva Brand Kit font if the goal is to match the 2026 website.

Typography feel:

- Playfair Display carries the premium, editorial, parent-facing tone.
- Lato carries the calm, practical, readable teaching/business tone.
- The site avoids a tech-startup sans-only look.

## 3. Current colour palette

The main colour system is defined in `styles.css` as CSS variables.

Core colours:

| Role | Hex | Source / usage |
|---|---:|---|
| Deep navy | `#0b1730` | `--navy-950`; deepest brand navy, shadows, dark contrast |
| Core navy | `#10233f` | `--navy-900`; primary buttons, header text, theme colour |
| Mid navy | `#183153` | `--navy-800`; hover states and dark secondary use |
| Softer navy | `#28466d` | `--navy-700`; secondary navy use |
| Ivory | `#fbf8f1` | `--ivory-50`; warm page background |
| Warm cream | `#f5efe3` | `--ivory-100`; section/card background |
| Cream line | `#e7dcc7` | `--ivory-200`; warm borders and subtle separation |
| Muted gold | `#c2a35f` | `--gold-400`; accent lines, highlights, small details |
| Deep gold | `#a88743` | `--gold-500`; text accents, kickers, labels |
| Muted slate | `#66748a` | `--slate-500`; secondary body/meta text |
| Dark slate | `#314158` | `--slate-700`; body text and supporting headings |
| White | `#ffffff` | Cards, surfaces, text on dark backgrounds |

Backgrounds:

- The global page background is warm ivory/cream, with a subtle gold radial glow and a soft vertical ivory gradient.
- The homepage hero uses a real image with a warm ivory overlay rather than a flat colour or graphic illustration.

Buttons:

- Primary button: core navy `#10233f` background, white text, hover to `#183153`.
- Secondary button: translucent white/cream background, navy text, subtle navy border.
- WhatsApp button: `#25d366`, hover `#1ebe5d`.

Important colour rule:

- WhatsApp green is reserved for WhatsApp-specific UI. It should not be used as a general Jothi brand accent.

Links:

- Links generally inherit surrounding text colour and are styled contextually rather than using a separate bright link blue.

Alerts/highlights:

- The current system uses muted gold, soft ivory panels, and navy contrast for emphasis.
- No separate loud red/orange alert system is part of the current brand language.

## 4. Current logo/assets

Likely primary logo:

- `Logo 2026.png`
- Format: PNG
- Dimensions found: 400 x 490 px
- Used in the site header as the primary logo image.

Header brand lockup:

- Logo image plus text:
  - `JOTHI`
  - `LEARNING`
  - `Serious teaching. Visible progress.`

Favicons / app icons:

- `favicon.ico`
- `assets/favicon/favicon-16x16.png`
- `assets/favicon/favicon-32x32.png`
- `assets/favicon/apple-touch-icon.png`

Social/reference image:

- `assets/img/social/jothi-og-home.png`

Current visual asset families:

- Homepage hero/proof assets under `assets/img/home/hero/`
- Proof screenshots under `assets/img/home/proof/`
- Tutor photos under `assets/img/team/`
- Testimonial images under `assets/img/testimonials/`
- UKMT imagery under `assets/img/ukmt/`

Assets to treat cautiously:

- `assets/img/home/proof/archive/` appears archival and should not drive the Canva Brand Kit.
- `_archive/`, `_qa-*`, old preview/variant files, and patch/WIP files should not be treated as the current visual source of truth.

## 5. Reusable website visual patterns

Overall feel:

- Warm, calm, premium, parent-facing.
- Private-school prospectus rather than tech SaaS dashboard.
- Editorial restraint, generous spacing, and clear hierarchy.

Layout:

- Main wrapper width around 1180px.
- Sections use calm vertical spacing and constrained content width.
- Content is usually organised as unframed page sections with cards only where they represent actual items or panels.

Cards and panels:

- Soft white/translucent surfaces.
- Subtle navy borders using low-opacity navy.
- Large radius values in the website system: commonly 20px, 28px, or 30px.
- Shadows are soft and low-contrast, not heavy.

Buttons:

- Pill-shaped buttons with strong navy primary styling.
- Minimum height around 50px, larger in hero contexts.
- Slight hover lift.
- Button text is Lato Semibold/Bold, not decorative.

Hero style:

- The homepage hero uses real tutoring/student-work imagery with warm overlay treatment.
- The site avoids abstract startup-style vector hero graphics.
- Hero typography combines Playfair Display headlines with Lato supporting text.

Parent Advice visual tone:

- Calm, practical, editorial, text-led.
- Uses category cards, ivory backgrounds, navy text, and gold accents.
- Visuals for Parent Advice should feel like premium educational guidance, not generic SEO blog thumbnails.

Programme/pricing visual tone:

- Decision-flow structure: stage, pathway, monthly fee, joining route.
- Cards use restrained borders, gold highlights, and clear scannable hierarchy.

Gradients:

- Gradients are subtle and warm: ivory, cream, navy, and soft gold.
- Avoid bright, multi-colour, purple/blue SaaS gradients.

## 6. Recommended Canva Brand Kit: Jothi Learning 2026

Brand Kit name:

- Jothi Learning 2026

Primary Canva fonts:

- Heading font: Playfair Display SemiBold / Bold
- Body font: Lato Regular / Semibold / Bold

Fallback guidance:

- If exact weights are unavailable in Canva, use the nearest Playfair Display heading weight and Lato body weight.
- Do not substitute Inter, Montserrat, Poppins, or other generic startup fonts as the primary look.

Recommended Canva colours:

| Canva swatch name | Hex | Usage |
|---|---:|---|
| Jothi Deep Navy | `#0b1730` | Dark backgrounds, highest contrast headings, footer-style panels |
| Jothi Core Navy | `#10233f` | Primary buttons, main headline colour, brand blocks |
| Jothi Mid Navy | `#183153` | Hover-style depth, secondary dark panels, supporting contrast |
| Jothi Muted Gold | `#c2a35f` | Accent rules, dividers, small highlights, premium detail |
| Jothi Deep Gold | `#a88743` | Kicker text, labels, small emphasis |
| Jothi Ivory | `#fbf8f1` | Main warm background |
| Jothi Warm Cream | `#f5efe3` | Cards, panels, soft content bands |
| Jothi Dark Slate | `#314158` | Body text and supporting copy |

Optional secondary text swatch:

- Jothi Muted Slate `#66748a` for captions, metadata, and low-priority text.

Logo files to upload to Canva:

- Primary logo: `Logo 2026.png`
- Square/avatar support: `assets/favicon/apple-touch-icon.png`
- Reference only, not as a logo: `assets/img/social/jothi-og-home.png`

## 7. Thumbnail design rules

Recommended thumbnail system:

- Use ivory or warm cream backgrounds as the default.
- Use core navy or deep navy for the main headline.
- Use muted gold only as a small accent: rule line, corner detail, category pill, or underline.
- Use Playfair Display for short emotional/editorial headlines.
- Use Lato for subtitles, dates, webinar details, speaker names, and calls to action.
- Keep the primary logo small and consistent, usually top-left or bottom-right.
- Leave generous negative space.
- Prefer real tutor, student-work, proof, or event imagery where approved and relevant.
- Use soft borders and restrained shadows if a card treatment is needed.

Recommended formats:

- 1:1 for general social thumbnails.
- 4:5 for Instagram feed versions.
- 9:16 for stories/reels/caption-led clips.
- 16:9 for YouTube/webinar preview or website embeds.

Avoid:

- Long paragraphs on thumbnails.
- Bright blue link styling.
- Neon greens, oranges, purple gradients, and high-saturation backgrounds.
- Generic AI classroom imagery.
- Clip-art, cartoon students, or stock images that look unrelated to Jothi teaching.

## 8. Clip/caption visual rules

Webinar and short-clip overlays:

- Use navy or ivory lower thirds with a thin muted-gold accent line.
- Speaker name and role should be in Lato Semibold/Bold.
- Key insight or quote can use Playfair Display if short.
- Keep subtitles readable with high contrast: navy text on ivory/white or white text on navy.
- Use warm cream translucent panels sparingly for captions over video.
- Keep the Jothi logo present but not dominant.

Parent Advice clips:

- Use editorial headline cards: Playfair headline, Lato supporting line, small category label.
- Use one core idea per frame.
- Keep the visual tone calm and helpful, not urgent or alarmist.

WhatsApp-specific visuals:

- WhatsApp green may be used only for WhatsApp route cues or button-like UI.
- Do not make WhatsApp green part of general Jothi thumbnails.

## 9. Conflicts or uncertainties

Multiple style locations:

- `styles.css` is the main shared design system.
- `index.html` also contains substantial homepage-specific inline CSS for the current hero/proof presentation.
- Some subpages include page-specific inline styling while still using the shared CSS.

Generated Parent Advice pages:

- Parent Advice generated HTML exists under `parent-advice/`.
- The source of truth for Parent Advice article content is Markdown under `content/parent-advice/`, with templates under `templates/`.
- Generated pages should not be manually edited.

Archive and variant material:

- `_archive/`, `_qa-*`, proof archives, variant HTML files, and WIP patch files exist and may contain older or experimental visual decisions.
- These should not be treated as active brand direction unless separately confirmed.

Logo certainty:

- `Logo 2026.png` is the clear active header logo in the reviewed source.
- Favicon files are active support assets, not replacement brand marks.

Brand direction risk:

- The current site already has a defined premium navy/ivory/gold identity.
- A Canva kit using Inter, bright gradients, generic startup graphics, or loud social-media colours would drift away from the current 2026 site.

## 10. Files changed

Created this approved report only:

- `docs/Jothi_2026_Website_Brand_Audit_For_Canva.md`

No website source files, CSS files, templates, article files, image files, build outputs, Git files, or deployment files were changed.