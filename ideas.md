# ToolImage — Design Exploration

## Three stylistic approaches

### 1. Editorial Utility
**Very Brief Intro:** A quiet, image-first productivity surface that borrows from modern editorial layouts: spacious, tactile, and remarkably easy to scan. It makes file optimisation feel reassuringly physical rather than technical.

**Probability:** 0.07

### 2. Monochrome Instrument
**Very Brief Intro:** A precision-tool aesthetic built from warm white space, charcoal typography, hairline rules, and a singular marine accent. It feels like a considered digital instrument rather than a conventional SaaS product.

**Probability:** 0.04

### 3. Soft Studio Desk
**Very Brief Intro:** A daylight creative-studio environment with paper-like surfaces, large typographic gestures, and subtle material cues. It introduces warmth while remaining reserved and professional.

**Probability:** 0.09

## Chosen approach — Monochrome Instrument

### Design Movement
**Contemporary Swiss editorial design blended with precision industrial design.** The website is organized like a finely made object: restrained, legible, and materially confident without leaning on familiar “tech” visual tropes.

### Core Principles
1. **Make the task the hero.** The upload and workspace are the main visual event, not decorative product imagery.
2. **Precision feels calm.** Use unambiguous information hierarchy, measured whitespace, and intentionally small moments of contrast.
3. **Movement signals state.** Motion clarifies upload, processing, completion, and comparison; it never exists as ornament alone.
4. **Progressive disclosure.** Begin with a simple action, then reveal useful controls only when a file is present.

### Color Philosophy
A warm, nearly-white field creates the confidence and open space of a high-quality printed tool manual. Charcoal establishes legibility and seriousness. **Deep marine teal** provides the only active color, used as a functional signal for ready, active, and completed states. Its reserve keeps the product calming rather than promotional.

### Layout Paradigm
The main pages use a **workbench composition**: an asymmetric heading column leads into a broad tool plane that stretches across the page. Supporting content is grouped into horizontal editorial bands and slim information rails rather than card grids. On mobile, the workbench becomes a single flowing instrument panel with prioritized controls.

### Signature Elements
1. **The measuring line:** a fine baseline with small technical ticks appears in navigation, statistics, and section transitions.
2. **Instrument panels:** off-white surfaces with precise charcoal outlines, restrained rounding, and inset status areas.
3. **Compression trace:** a delicate teal progress line with a small moving indicator visualizes file reduction and processing state.

### Interaction Philosophy
Interactions should feel like operating a considered utility: direct, immediate, and quietly responsive. Buttons compress slightly on press, drag states respond visibly, and control selection uses a crisp fill/outline change. All high-frequency actions remain fast and do not rely on long animation.

### Animation
Use a 180–260ms custom ease-out for panel transitions and button feedback. The upload field transitions into the workspace with a single opacity-and-transform morph. Progress uses a continuous but subtle compression trace. Content enters with short 40–60ms staggers only when it helps orientation. Every nonessential animation is disabled under `prefers-reduced-motion`.

### Typography System
**DM Sans** carries product UI and body content because it remains exceptionally clear at compact sizes. **DM Serif Display** is reserved for major public-facing statements, providing editorial confidence without making the app feel decorative. Hero headings use serif at restrained display sizes; tool labels are compact, mixed-case DM Sans with firm numerical hierarchy.

### Brand Essence
**ToolImage is the thoughtful image utility for people who want files to fit without surrendering control.**

Personality: **precise, composed, dependable.**

### Brand Voice
Headlines should be concise, practical, and assured. CTAs state the action plainly. Microcopy explains consequences rather than making claims.

Example lines:

> Make the file fit.

> Your image is processed here, then stays with you.

### Wordmark & Logo
The logo is a bold abstract **aperture-and-measure** mark: two offset framed shapes creating a compressed central window, suggesting both image framing and file reduction. The ToolImage wordmark uses a deliberately tight DM Sans semibold lockup with a small teal measurement dash.

### Signature Brand Color
**Instrument Teal — `#0D786D`**. It is used sparingly for primary actions, interactive focus, successful results, and the compression trace.

## Style Decisions

- Serif display is a controlled editorial accent: every section has at most one dominant serif statement, while labels, numerals, rules, and tool controls rely on DM Sans.
- Instrument Teal is a functional signal only: primary actions, selected states, status, progress, checks, and key numeric evidence. It is not used as a broad promotional field.
- Every upload and workspace surface is an instrument panel, with input-status language, measured rules, and compression cues that keep the task visibly central.
