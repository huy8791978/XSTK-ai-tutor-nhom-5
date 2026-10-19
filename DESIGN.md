---
name: XSTK·AI
description: Gia sư Xác suất Thống kê printed in the visual language of xổ số kiến thiết.
colors:
  ultra: "#1B2A8C"
  ultra-2: "#2637A8"
  ultra-ink: "#EEF1FF"
  ultra-dim: "#AEB9F2"
  ultra-wash: "#E9ECFA"
  red: "#D7263D"
  red-ink: "#AE1B2F"
  red-wash: "#FDECEE"
  gold: "#F2B705"
  gold-ink: "#7A5A00"
  gold-wash: "#FFF5D1"
  green: "#0E9F6E"
  green-ink: "#08704D"
  green-wash: "#E2F5EC"
  ink: "#141833"
  ink-2: "#3E4570"
  ink-3: "#5A6185"
  paper: "#F4F6FB"
  sheet: "#FFFFFF"
  rule: "#DCE1F2"
  rule-2: "#C2C9E6"
  row-rule: "#EEF0F8"
typography:
  display:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(64px, 7vw, 92px)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(34px, 4vw, 50px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "0.005em"
  title:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.01em"
  section:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.02em"
  numeral:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "24px"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "tnum"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  tier:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "13.5px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.14em"
  serial:
    fontFamily: "Barlow Condensed, Arial Narrow, sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
    letterSpacing: "0.2em"
rounded:
  r: "4px"
spacing:
  2xs: "6px"
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  panel: "clamp(18px, 2vw, 26px)"
components:
  button-primary:
    backgroundColor: "{colors.ultra}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.r}"
    padding: "10px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.ultra-2}"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ultra}"
    rounded: "{rounded.r}"
    padding: "10px 16px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.ultra-wash}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.r}"
    padding: "10px 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.red-ink}"
    rounded: "{rounded.r}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.r}"
    padding: "12px 14px"
    height: "46px"
  panel:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.r}"
    padding: "{spacing.panel}"
  rail:
    backgroundColor: "{colors.ultra}"
    textColor: "{colors.ultra-ink}"
    width: "248px"
  nav-item-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ultra}"
    rounded: "{rounded.r}"
    padding: "11px 12px"
  tag-mistake:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.red-ink}"
    padding: "4px 9px"
  tag-topic:
    backgroundColor: "{colors.ultra-wash}"
    textColor: "{colors.ultra}"
    padding: "4px 9px"
  score-odometer:
    textColor: "{colors.red}"
    typography: "{typography.display}"
  result-row-value:
    textColor: "{colors.ink}"
    typography: "{typography.numeral}"
---

# Design System: XSTK·AI

## Overview

**Creative North Star: "The Lottery Ticket"**

The tutor speaks the visual language of Vietnam's xổ số kiến thiết, the probability every Vietnamese already reads daily: guilloche security rosettes, printed serial numbers, prize-tier result boards. A committed ultramarine rail carries a live hypotrochoid rosette; the working area is cool paper with white sheets ruled in 1px hairlines. Scores are not badges, they are drawn: digits roll into place like a draw-cage odometer and land in special-prize red.

Density is that of a printed result board: condensed heavy numerals and uppercase labels, tight tiered rows, tabular figures, generous body leading for long Vietnamese math explanations. Surfaces are flat and square-shouldered (4px), separated by rules rather than shadows. The color world is four inks on paper: ultramarine for structure and action, red for scores and errors, gold for focus and serials, green for correct.

The world rejects the white-sidebar edtech card grid: no soft floating cards, no pastel gradients, no rounded pill dashboards.

**Key Characteristics:**
- Ultramarine shell rail (248px) with a live guilloche rosette that reseeds per section.
- Prize-tier result board rows: tracked uppercase tier label, value, condensed numeral.
- Graded results printed as a ticket: wave security band on top, gold serial in the corner.
- One signature motion: the score odometer.
- Hairline 1px rules, 4px corners, no panel shadows.
- Barlow Condensed for headings and numerals, Be Vietnam Pro for every word of reading.

## Colors

Four inks on cool paper, named after what they do on a printed ticket.

### Primary
- **Ticket Ultramarine** (ultra): the structural ink. The shell rail, the primary action ("Chấm điểm"), links, chart bars, detent squares, step numbers, section headings inside panels, the mobile top bar. Its hover step is **Pressed Ultramarine** (ultra-2), used only on the primary button. **Ultramarine Wash** (ultra-wash) is the selected/hover fill for outline buttons, chosen options, drop zone hover and topic tags. **Rail Ink** (ultra-ink) and **Rail Dim** (ultra-dim) are text on the rail only.

### Secondary
- **Special-Prize Red** (red): the score and the error. The odometer score, the top-tier row value, highlighted chart bars, the Galton balls and normal curve, wrong answers, mistake-frequency bars. **Red Ink** (red-ink) for red text on wash; **Red Wash** (red-wash) behind errors and mistake tags.

### Tertiary
- **Serial Gold** (gold): focus and the security print. Every focus ring, text selection, the current detent, the gold strand in the ticket band and rosette, the rail serial. **Serial Gold Ink** (gold-ink) is gold as readable text on paper: ticket serials, session serial tags, the fourth mind-map branch. **Gold Wash** (gold-wash) behind gold tags.
- **Correct Green** (green): right answers only. **Green Ink** (green-ink) and **Green Wash** (green-wash) for correct options, correct pager dots, ok tags.

### Neutral
- **Board Ink** (ink): body text, row values, toast background.
- **Second Ink** (ink-2): field labels, secondary text, ghost buttons.
- **Third Ink** (ink-3): muted text, tier labels, ledes, chart text.
- **Cool Paper** (paper): page ground; also the inset fill for previews, reveals, details and the math toolbar.
- **Sheet White** (sheet): panels, inputs, buttons.
- **Hairline** (rule): light dividers between steps and around inset blocks.
- **Hairline Strong** (rule-2): panel borders, input borders, detent rail rules, chart axes, Galton pegs.
- **Row Rule** (row-rule): the faint divider between result-board rows, mistakes and plan items (hard-coded in source, not yet a custom property).

### Named Rules
**The Four Inks Rule.** Every mark is ultramarine, red, gold or green on paper, plus the ink neutrals. Charts, canvases and the mind map draw from the same inks; the mind map's branch palette is exactly ultra, red, green, gold-ink, cycled.

**The Red Is Earned Rule.** Red marks a score or a mistake, never decoration or a generic call to action. The primary action is ultramarine.

**The Gold Is Focus Rule.** Gold signals where you are (focus ring, current detent, selection) and what was printed (serials). Gold text on paper always uses gold-ink, never raw gold.

## Typography

**Display Font:** Barlow Condensed (with Arial Narrow, sans-serif), weights 600-800
**Body Font:** Be Vietnam Pro (with system-ui, sans-serif), weights 400-700

**Character:** A condensed, heavy numeral face straight off a result board, paired with a Vietnamese-first humanist sans that carries every diacritic cleanly through long explanations.

### Hierarchy
- **Display** (800, clamp(64px, 7vw, 92px), 1): the score odometer only; tabular figures, red. A 40px small variant sits inside result rows.
- **Headline** (800, clamp(34px, 4vw, 50px), 1.08, uppercase): the page title. 28px on mobile.
- **Title** (700, 24px, 1.1): panel headings.
- **Section** (700, 18px, 1.2, 0.02em, uppercase, ultramarine): headings inside panels and step headers. Rich-text h4 is a 17px ink-2 variant.
- **Numeral** (800, 24px, 1, tabular): result-board row values; the same face at 46px numbers practice questions, at 15-18px fills detent, step and option keys and pager dots.
- **Body** (400, 15.5px, 1.6; rich AI text at 1.7): all reading. Ledes cap at 68ch.
- **Label** (600, 14px): form field labels. Tags are 600 12.5px.
- **Tier** (700, 13.5px, 0.14em, uppercase, ink-3): the left column of result-board rows; the 11px toolbar group labels use the same treatment.
- **Serial** (700, 12.5-13px, 0.2em): rail serial, ticket serial, session serial tags.

### Named Rules
**The Condensed Numbers Rule.** Every number that is a result (score, tier value, question number, step number, heatbar count) is set in Barlow Condensed 700-800 with tabular figures. Prose numbers stay in body.

**The Reading Is Vietnamese Rule.** Anything a student reads at length is Be Vietnam Pro. Barlow Condensed never sets a sentence.

## Layout

A two-column shell: a sticky ultramarine rail (248px) and a fluid main column (padding 32px top, clamp(20px, 3.4vw, 48px) sides) whose views cap at 1320px. Under the page title runs the detent rail: a four-cell strip between two hairlines marking the Polya / learning stage. Work views split into two columns (input 1fr, result 1.08fr, 24px gap) with the result column sticky at 24px.

Spacing rhythm steps 6, 8, 10, 14, 18, 24px; panels pad clamp(18px, 2vw, 26px); stacks gap 18px. Practice is a one-question-per-frame horizontal pager with scroll snap and square numbered dots.

Responsive: at 1100px the work columns stack. At 860px the rail becomes a fixed bottom tab bar of five short-labelled items (rosette at 35% opacity), the page title moves into a sticky ultramarine top bar, ledes hide, the detent rail goes to 2 columns and row label columns narrow to 84px. Safe-area insets are respected top and bottom.

## Elevation & Depth

Flat. Panels, inputs, rows, tickets and messages sit on the page with a 1px hairline and no shadow; depth comes from the paper/sheet tonal step and from rules. Only layers that genuinely float over content cast a shadow.

### Shadow Vocabulary
- **Bottom bar lift** (`box-shadow: 0 -8px 24px -12px rgba(18, 29, 102, .5)`): the fixed mobile tab bar only.
- **Toast lift** (`box-shadow: 0 12px 32px -8px rgba(20, 24, 51, .45)`): the status toast only.
- **Focus halo** (`box-shadow: 0 0 0 3px rgba(242, 183, 5, .45)`): text fields on focus, a gold halo with an ultramarine border.
- **Current dot underline** (`box-shadow: inset 0 -3px 0 var(--ultra)`): the current pager dot.

### Named Rules
**The Hairline Not Shadow Rule.** A surface is separated by a 1px rule (rule-2 for panels, row-rule between rows), never by a drop shadow. Shadows belong only to fixed or transient overlays.

## Shapes

Square-shouldered: one radius, 4px, on panels, buttons, inputs, nav items, tags-in-blocks, inset blocks and the drop zone. Status marks are square: detent cells and step numbers are hard squares bordered 1.5px ultramarine. Circles are reserved for the answer-option key letters (A/B/C/D, like drawn balls) and the file-remove control. Interactive borders are 1.5px; structural borders are 1px. Dashed borders mean "drop here" or "preview here" (drop zone, formula preview). Fine sine-wave security print appears as a texture on the drop zone and as the ticket band.

## Components

### Buttons
Printed, firm, ultramarine-outlined.
- **Shape:** 4px radius, 1.5px border, min-height 44px, padding 10px 16px, 600 14.5px.
- **Primary:** filled ultramarine with white text; hover to ultra-2. One per action group ("Chấm điểm").
- **Outline (default):** sheet with ultramarine border and text; hover fills ultra-wash.
- **Ghost:** transparent, rule-2 border, ink-2 text; hover takes the ultramarine border and text.
- **Danger:** red border, red-ink text, red-wash hover.
- **Hover / Focus / Active:** 0.2s on the house ease; active nudges down 1px; focus is the global 2px gold outline at 2px offset. Disabled at 45% opacity.

### Chips (Tags)
- **Style:** filled wash with matching ink, 600 12.5px, padding 4px 9px, no border.
- **Variants:** mistake (red-wash/red-ink), topic (ultra-wash/ultra), ok (green), gold (serial context). Paired with a session serial tag in the serial type.

### Cards / Containers (Panels)
- **Corner Style:** 4px.
- **Background:** sheet on paper.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px rule-2.
- **Internal Padding:** clamp(18px, 2vw, 26px). Inset blocks (reveal, details, feedback, preview) use paper fill with a rule border.

### Inputs / Fields
- **Style:** sheet, 1.5px rule-2 border, 4px radius, padding 12px 14px, min-height 46px; ultramarine caret; custom ultramarine chevron on selects.
- **Focus:** border turns ultramarine with the 3px gold halo.
- **Math toolbar:** every text field can carry a paper toolbar fused to its top edge, holding 36px symbol keys grouped under tier-style labels, with a dashed KaTeX preview beneath.
- **Drop zone:** 176px min, dashed border, wave-line security texture; hover/drag turns ultra-wash with an ultramarine border.

### Navigation
- **Rail:** ultramarine, 248px, sticky full height; wordmark in 800 34px condensed with an uppercase tracked subtitle; five items with 20px stroke icons (1.7 stroke), 500 15px; hover is a 9% white wash; active item inverts to paper with ultramarine 600 text; the session serial ("SERI …") sits in gold at the foot.
- **Mobile:** fixed bottom bar, five equal columns, icon over an 11px short label; title in a sticky ultramarine top bar.

### Result Board
The prize-tier table that presents every outcome. Rows are a three-column grid (112px tier label, content, value) on baseline alignment, 12px vertical padding, separated by row-rule. The top-tier row centers, takes a rule-2 underline and carries the red odometer as its value. Used for grades, oral summaries, profile overview and the session log.

### Ticket Frame
A graded result is printed like a lottery ticket: a 10px repeating double sine band (ultramarine at 55% and gold, crossing) across the top, 22px top padding, and the session serial in gold-ink serial type in the top-right corner. Wraps the board on grade, practice summary, reveal and profile overview.

### Score Odometer (signature motion)
Each digit is a 0-9 column that rolls to its value over 1.4s on the house ease (cubic-bezier(.16, 1, .3, 1)), staggered 120ms per digit, followed by a muted "/10". Red, display type; 40px variant in rows. Settles instantly under reduced motion. The loading indicator is its sibling: three digit columns stepping continuously in ultramarine.

### Detent Rail
Four equal cells between two rule-2 hairlines; each cell is a 13px square plus a condensed ultramarine number and 600 13.5px label. Done fills ultramarine; current fills gold with an ink border and a gold outline ring; todo is outlined.

### Guilloche Rosette
Five layered hypotrochoids at 0.7px, alternating gold (22%) and ultra-dim (32%), slowly counter-rotating on the rail canvas; reseeded per section. Paused when the tab is hidden or motion is reduced.

### Charts
SVG and canvas illustrations in the four inks: ultramarine bars and curves on rule-2 axes, red for the highlighted region or the comparison, 600 11px ink-3 labels; bars grow from the baseline in 0.9s, curves draw on in 1.2s.

## Do's and Don'ts

### Do:
- **Do** separate surfaces with 1px hairlines (rule-2 for panels, row-rule between rows) at a 4px radius.
- **Do** present any outcome as a result-board row, and wrap graded results in the ticket frame with their serial.
- **Do** set every result number in Barlow Condensed 700-800 with tabular figures; scores land through the odometer in red.
- **Do** use gold for focus (2px outline, 2px offset) and gold-ink for serial text.
- **Do** keep charts, canvases and the mind map in the four inks (ultra, red, green, gold-ink).
- **Do** make page titles uppercase condensed 800.
- **Do** honor reduced motion: odometer settles instantly, rosette stops, entrance animations collapse.

### Don't:
- **Don't** put drop shadows on panels, cards, rows or messages; shadows are for the fixed mobile bar and the toast only.
- **Don't** add a second signature motion; the odometer is the one moment that animates for meaning.
- **Don't** use red for decoration or primary actions; it is the score and the error.
- **Don't** set sentences in Barlow Condensed or numbers-as-results in Be Vietnam Pro.
- **Don't** round surfaces beyond 4px or fall back to the white-sidebar edtech card grid.
- **Don't** introduce hues outside the four inks and their washes.
