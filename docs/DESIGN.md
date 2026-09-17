---
name: InstancedMesh2 Docs
description: "Two registers of one 1980s comic: the splash is the anime cel — ink line, flat colour, acetate, a pilotable instanced world — and the docs are the printed page — 45% halftone on margins and transitions, panel gutters, caption boxes, a ticked numbered index."
colors:
  # --- Cel register (dark) ---
  void: "#12142a"
  void-raised: "#1a1d38"
  void-sunk: "#0b0c16"
  deep-space: "#0b1120"
  ink-night: "#0b0c16"
  ink-strong-night: "#f4efe2"
  ink-body-night: "#d9d3c4"
  ink-soft-night: "#a8a394"
  ink-faint-night: "#7c7a70"
  frame-night: "#3a3f66"
  frame-soft-night: "#262a48"
  cel-cyan: "#39c7d6"
  cel-cyan-deep: "#7fe0ea"
  cel-cyan-pale: "#143038"
  cel-amber: "#ffb347"
  cel-amber-deep: "#ffd08a"
  cel-amber-pale: "#3a2412"
  cel-red: "#ff5a36"
  cel-red-pale: "#3a1a12"
  ink-hull: "#05090b"
  # --- Print register (light) ---
  print: "#f2ecdf"
  print-raised: "#faf6ec"
  print-sunk: "#e6dccb"
  ink-strong: "#171a26"
  ink-body: "#262b3d"
  ink-soft: "#4b5064"
  ink-faint: "#767a8c"
  frame: "#1c2033"
  frame-soft: "#c9bfa8"
  blueprint: "#17606d"
  blueprint-deep: "#114b56"
  blueprint-pale: "#d9e7e8"
  safety-orange: "#c93c1b"
  orange-soft: "#f6e0d8"
  # --- Cel subjects (the sky carries the colour) ---
  cel-magenta: "#ff4f9a"
  cel-cream: "#ffe9b0"
  cel-green: "#8fd14f"
  planet-blue: "#6fb3ff"
  planet-coral: "#ff8a5c"
  planet-violet: "#b98cff"
  planet-teal: "#5fd0c8"
  planet-sand: "#ffd479"
  planet-red: "#ff6b6b"
  planet-green: "#9de37a"
  planet-indigo: "#7f8cff"
  planet-ice: "#f0f4ff"
  ring-ice: "#dfe8ff"
  exhaust-cyan: "#5fe0ff"
  phosphor-cream: "#f6f1e6"
  # --- Splash ink (always dark, both site themes) ---
  splash-ink: "#c6d4ec"
  splash-ink-strong: "#eef3fc"
  splash-frame: "#7f9edb"
  splash-orange: "#ff7a3d"
  # --- Splash console (line-work on the viewport) ---
  hud-ink: "#f2f6ff"
  hud-bright: "#ffffff"
  hud-dim: "#a9b7cf"
  hud-accent: "#ffb347"
  hud-alert: "#ff5f56"
  hud-ready: "#6ee7a8"
  hud-fill: "rgba(10, 16, 26, 0.6)"
  hud-fill-2: "rgba(12, 20, 32, 0.74)"
  hud-fill-solid: "rgba(9, 15, 24, 0.9)"
  hud-line: "rgba(226, 236, 255, 0.55)"
  hud-line-soft: "rgba(226, 236, 255, 0.26)"
  hud-line-plate: "rgba(226, 236, 255, 0.45)"
  hud-line-accent: "rgba(255, 179, 71, 0.6)"
  hud-glow: "rgba(160, 200, 255, 0.22)"
  hud-scan: "rgba(226, 236, 255, 0.045)"
  # --- Console printed on paper (light theme) ---
  hud-ink-print: "#182235"
  hud-bright-print: "#0d1420"
  hud-dim-print: "#55637d"
  hud-accent-print: "#a05a12"
  hud-alert-print: "#b83a2e"
  hud-ready-print: "#1f7a4d"
  hud-fill-print: "rgba(244, 248, 244, 0.82)"
  hud-fill-2-print: "rgba(238, 244, 238, 0.9)"
  hud-fill-solid-print: "rgba(240, 246, 240, 0.94)"
  hud-line-print: "rgba(24, 34, 53, 0.24)"
  hud-line-accent-print: "rgba(160, 90, 18, 0.45)"
  hud-glow-print: "rgba(24, 34, 53, 0.12)"
  hud-scan-print: "rgba(24, 34, 53, 0.05)"
  # --- Overlays and cockpit ---
  overlay-ink: "rgba(0, 0, 0, 0.48)"
  overlay-ink-soft: "rgba(0, 0, 0, 0.25)"
  cockpit-arc: "rgba(5, 7, 12, 0.82)"
  cockpit-arc-soft: "rgba(5, 7, 12, 0.34)"
typography:
  display:
    fontFamily: "Anton, Anton Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, calc(1.1rem + 4vw), 3.9rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "0.005em"
  display-mobile:
    fontFamily: "Anton, Anton Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 9vw, 2.4rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.005em"
  display-compact:
    fontFamily: "Anton, Anton Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2rem, 8.2vw, 2.6rem)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "0.005em"
  display-collapsed:
    fontFamily: "Anton, Anton Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.01em"
  wordmark:
    fontFamily: "Anton, Anton Fallback, Arial Narrow, system-ui, sans-serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.01em"
  body:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.7
  body-small:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  tagline:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 0.8rem + 0.6vw, 1.15rem)"
    fontWeight: 400
    lineHeight: 1.5
  tagline-mobile:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.5
  lede:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.5
  heading-2:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "2.1875rem"
    fontWeight: 640
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  heading-3:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "1.8125rem"
    fontWeight: 630
    lineHeight: 1.2
  heading-4:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 630
    lineHeight: 1.2
  caption:
    fontFamily: "Inter Variable, Inter Fallback, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono Fallback, IBM Plex Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
  hud-readout:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono Fallback, IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.14em"
  hud-chip:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono Fallback, IBM Plex Mono, monospace"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.12em"
  mono-measure:
    fontFamily: "JetBrains Mono Variable, JetBrains Mono Fallback, IBM Plex Mono, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.01em"
rounded:
  none: "0px"
  hairline: "2px"
  identifier-pill: "3px"
  scrollbar-thumb: "99px"
spacing:
  xs: "0.4rem"
  sm: "0.7rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
components:
  eyecatch-bar:
    backgroundColor: "{colors.void-raised}"
    textColor: "{colors.ink-strong-night}"
    rounded: "{rounded.none}"
    height: "3.5rem"
  eyecatch-mark:
    backgroundColor: "{colors.cel-red}"
    textColor: "{colors.hud-bright}"
    rounded: "{rounded.none}"
    size: "2.1rem"
  eyecatch-tab:
    backgroundColor: "{colors.void-raised}"
    textColor: "{colors.ink-soft-night}"
    typography: "{typography.label}"
    height: "3.5rem"
  eyecatch-tab-active:
    backgroundColor: "{colors.void-raised}"
    textColor: "{colors.ink-strong-night}"
    typography: "{typography.label}"
    height: "3.5rem"
  hud-primary-cta:
    backgroundColor: "{colors.cel-red}"
    textColor: "{colors.void-sunk}"
    typography: "{typography.hud-readout}"
    rounded: "{rounded.none}"
    padding: "0.9rem 1.1rem"
  hud-cta:
    backgroundColor: "{colors.hud-fill}"
    textColor: "{colors.hud-ink}"
    typography: "{typography.hud-readout}"
    rounded: "{rounded.none}"
    padding: "0.9rem 1.1rem"
  hud-voice:
    backgroundColor: "{colors.hud-fill}"
    textColor: "{colors.hud-bright}"
    typography: "{typography.hud-readout}"
    rounded: "{rounded.none}"
    padding: "0.4rem 0.6rem"
  cockpit-arc:
    backgroundColor: "{colors.cockpit-arc}"
    rounded: "{rounded.none}"
    height: "17vh"
  page-lede:
    textColor: "{colors.ink-soft}"
    typography: "{typography.lede}"
    width: "62ch"
  examples-wall:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.none}"
    padding: "1.5rem"
  example-plate:
    backgroundColor: "{colors.print-raised}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.none}"
    size: "19rem"
  filter-chip:
    backgroundColor: "{colors.print-raised}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.45rem 0.7rem"
  filter-chip-active:
    backgroundColor: "{colors.ink-body}"
    textColor: "{colors.print-raised}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0.45rem 0.7rem"
  revision-cell:
    backgroundColor: "{colors.print-raised}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.none}"
    padding: "0.7rem 0.9rem"
  sidebar-item:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.none}"
  data-panel:
    backgroundColor: "{colors.print}"
    textColor: "{colors.ink-body}"
    rounded: "{rounded.hairline}"
  data-panel-head:
    backgroundColor: "{colors.print-sunk}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.none}"
  capability-planet:
    backgroundColor: "{colors.planet-blue}"
  example-crystal:
    backgroundColor: "{colors.hud-accent}"
  ink-outline:
    backgroundColor: "{colors.ink-hull}"
  hud-canvas-quad:
    backgroundColor: "{colors.hud-fill-solid}"
    rounded: "{rounded.none}"
    width: "100dvw"
    height: "100dvh"
---

# Design System: InstancedMesh2 Docs

## Overview

**Creative North Star: "Cel & Retino"** — an 1980s comic magazine printing an anime.
One world, two registers, three recurring marks: **ink line**, **flat cel colour**,
**45% halftone**.

**The cel register (splash).** A pilotable deep-space viewport drawn by hand:
every body carries an ink hull outline, lit surfaces quantize into four hard toon
bands, rocks are unlit flat-albedo hulls, planets are each their own colour — one
flat base with blob continents wrapped around the sphere — with a moon apiece and
hash-derived rings on the ringed worlds, the belt drifts over a seeded map, and
exhaust is a dense cyan plume from two alternating nozzles. The console floats on
the glass as **line-work** — no boxes, no blur, no glow slabs — so the world stays
visible behind every readout. The one exception is the legend plate: a filled
caption box, because it is the page's only product statement — and an opaque
one, so the copy's contrast never rides the animated scene behind it.

**The print register (docs).** Vellum paper in light, deep indigo in dark, an
eyecatch bar with a vermillion mark and panel tabs, a ticked numbered index,
title blocks whose frontmatter description prints as the lead line, caption boxes
for asides, data panels for tables, sheet tabs for pagination, and a revision
block pinned to the bottom so no page trails off into empty paper.

**Key Characteristics**
- Ink outlines on every 3D body; hard toon bands on the lit ones, flat per-instance
  albedo on the unlit rocks and smoke.
- A neutral console (ink-white + amber + red) so the sky carries the colour.
- Halftone as texture, never as a reading surface.
- The world is seeded: same map, same rings, same sky on every visit.
- Scale you can see: the telemetry counts the instances, the console never lies.
- The console can be drawn by the scene itself: the same five voices render as DOM
  line-work or as a texture on a screen-space quad inside the canvas.

## Colors

### Cel register (dark, the void)
- **void** `#12142a` / **void-raised** `#1a1d38` / **void-sunk** `#0b0c16`: space and chrome.
- **deep-space** `#0b1120`: the splash ground under the canvas, one step bluer than the void.
- **ink-strong-night** `#f4efe2` → **ink-faint-night** `#7c7a70`: the paper-white ink ramp.
- **frame-night** `#3a3f66` / **frame-soft-night** `#262a48`: hairlines and rules.
- **cel-amber** `#ffb347` (links, active — the dark register's interactive accent), with **cel-amber-deep** `#ffd08a` (secondary ink) and **cel-amber-pale** `#3a2412` (warm raised surface); **cel-red** `#ff5a36` (the signal — marks, primary CTA, active tab).
- **cel-cyan** `#39c7d6` (with `cel-cyan-deep #7fe0ea` / `cel-cyan-pale #143038`) is reserved for cel-register subjects and the light print register; the docs' dark register no longer inks interactives with it.

### Print register (light, the sheet)
- **print** `#f2ecdf` / **print-raised** `#faf6ec` / **print-sunk** `#e6dccb`.
- **ink-strong** `#171a26` → **ink-faint** `#767a8c`: graphite ramp for text.
- **blueprint** `#17606d` (links), **safety-orange** `#c93c1b` (the one provably different case).

### The sky carries the colour
Planets: `planet-blue #6fb3ff`, `planet-coral #ff8a5c`, `planet-violet #b98cff`,
`planet-teal #5fd0c8`, `planet-sand #ffd479`, `planet-red #ff6b6b`,
`planet-green #9de37a`, `planet-indigo #7f8cff`, `planet-ice #f0f4ff`.
Each planet texture is one flat base colour plus blob continents, tiled in u so the
sphere seam never shows; rings are `ring-ice #dfe8ff` and only appear on the
hash-ringed worlds. Exhaust is `exhaust-cyan #5fe0ff`; its boot schematic is
`phosphor-cream #f6f1e6`. Example crystals cycle eight bright accents
(`#ffb347`, `#66e0ff`, `#ff8ad4`, `#ffe066`, `#ffd479`, `#8fb8ff`, `#ff9f6b`,
`#9ecbff`); rocks are neutral grey. Cel accents `cel-magenta #ff4f9a`,
`cel-cream #ffe9b0` and `cel-green #8fd14f` are declared for subjects, never for
the console — `cel-magenta` is still reserved; the docs code register consumes
cream (keywords) and green (functions), and `cel-amber #ffb347` is the dark
register's interactive accent.

### Console palette (splash only)
- **hud-ink** `#f2f6ff`, **hud-bright** `#ffffff`, **hud-dim** `#a9b7cf` — line-work text.
- **hud-accent** `#ffb347` amber (examples, keys, armed toggle); **hud-alert** `#ff5f56` (alerts, and the warm half of the splash h1's chromatic aberration); **hud-ready** `#6ee7a8` is declared for objectives and ready states but no voice consumes it yet — the reticle core is `splash-orange` `#ff7a3d`.
- Cockpit arc: `cockpit-arc` `rgba(5,7,12,0.82)` → `cockpit-arc-soft` `rgba(5,7,12,0.34)` — the dashboard falloff under the bottom row.
- Overlays: `overlay-ink` `rgba(0,0,0,0.48)` and `overlay-ink-soft` `rgba(0,0,0,0.25)` — scanline and vignette veils, never behind body text.
- Glass: `hud-fill`, `hud-fill-2`, `hud-fill-solid` (copy-bearing anchored labels and console voices; the legend plate is an opaque sheet); hairlines `hud-line` — base `0.26`, raised to `0.55` on the console so line-work survives the scene (≥3:1) — with `hud-line-soft` for internal rows and `hud-line-plate` `0.45` for the plate's peer buttons; `hud-line-accent` is `0.6` where armed; `hud-scan` is the scanline ink.
- On the printed sheet the same console re-inks to graphite — `hud-ink-print #182235`, `hud-accent-print #a05a12`, `hud-alert-print #b83a2e`, `hud-ready-print #1f7a4d`, paper fills. The splash voices re-value themselves back to ink-white in both themes, so the world always reads behind them.

### Splash ink (always dark)
The viewport never follows the site theme, so the frame, corner ticks, reticle core
and anchored label text come from their own night palette: `splash-frame #7f9edb`,
`splash-ink #c6d4ec`, `splash-ink-strong #eef3fc`, `splash-orange #ff7a3d`.

### Code register (Expressive Code)
The docs' code blocks use the world's own Expressive Code themes
(`cel-retino-dark` / `cel-retino-light`, declared in `src/styles/code-theme.mjs`
and wired through Starlight's `expressiveCode.themes`). Token roles bind to the
palette:

| role | dark (cel) | light (print) |
| --- | --- | --- |
| keywords / operators | `cel-cream #ffe9b0` | `blueprint #17606d` |
| strings | `cel-amber-deep #ffd08a` | `safety-orange #c93c1b` |
| numbers / constants | `cel-amber #ffb347` | `hud-accent-print #a05a12` |
| functions / methods | `cel-green #8fd14f` | `hud-ready-print #1f7a4d` |
| comments | `ink-faint #7c7a70` | `ink-faint #767a8c` |
| variables / params | `ink-body #d9d3c4` | `ink-body #262b3d` |
| punctuation | `ink-soft #a8a394` | `ink-soft #4b5064` |

The code ground is `void-sunk #0b0c16` (dark) / `print-sunk #e6dccb` (light).
The two print substitutions keep the cel hue roles — the cel accents sit at
~1.3:1 on vellum and would ship as unreadable text — and Expressive Code's
automatic contrast fixer is switched off so these exact values reach the page.

### Toon shading
`patchCelMaterial`: `ezTone = ezShade / (ezShade + 0.45)` where
`ezShade = luminance(outgoingLight) / luminance(albedo)`; bands at
`0.25 / 0.5 / 0.72` (weights `0.30 / 0.32 / 0.38`); the fill is
`(albedo / luminance) * (luminance + lift) * (0.55 + band * 0.9)`, plus a hard
phosphor rim `step(0.4, pow(1 − |dot(normal, view)|, 3))`. No specular step: the
void lights, nothing reflects. `MeshBasicMaterial` bodies (rocks, smoke) skip the
band path entirely — no normals, no bands, no rim, just the flat albedo — and
every unlit material sets `toneMapped: false` so the albedo is the colour that
reaches the screen.

### Named Rules
**The Two Registers Rule.** One world, two registers: splash = cel (flat colour,
ink line, acetate); docs = print (45% halftone on margins, transitions, heading
tails).
**The Cel Rule.** Four hard luminance bands and one hard rim step on lit bodies;
no smooth gradients, no cast reflections — the void lights, nothing reflects.
**The Sky Carries the Colour Rule.** The sky carries the colour: one distinct hue
per planet, cyan exhaust, neutral rocks. The console stays ink-white + amber + red;
green only for objectives. The docs' dark register follows the same discipline —
its interactive accent is `cel-amber #ffb347` with `cel-amber-deep #ffd08a` as the
secondary ink, never cyan on the void; `cel-cyan` stays with the cel subjects and
the light register keeps its blueprint teal.
**The Seed Rule.** The map follows seeds: orbit radii and ringed worlds derive from
`hashString(name)`, so the system reads the same on every visit.

## Typography

**Display:** Anton (uppercase, tight) · **Body:** Inter Variable · **Notation:** JetBrains Mono Variable.

Anton carries every title block, tab and plate title; Inter carries prose at a 65ch
measure; the mono is the instrument voice — labels, readouts, distances, revision cells,
tables. Tabular numerals wherever numbers are compared.

### Hierarchy
- **Display** (`clamp(2.4rem, calc(1.1rem + 4vw), 3.9rem)`, lh 0.98): plate titles, uppercase.
- **Display-mobile** (`clamp(1.9rem, 9vw, 2.4rem)`) and **display-compact** (`clamp(2rem, 8.2vw, 2.6rem)`): the plate at narrow widths.
- **Display-collapsed** (`1.1rem`): the plate as a tab, and every Anton micro-title.
- **Wordmark** (`1.15rem`): the bar title in Anton, uppercase.
- **Docs headings** (ramp: `heading-2`/`heading-3`/`heading-4`): h2 `2.1875rem` (35px), h3 `1.8125rem` (29px), h4 `1.5rem` (24px), weights 640/630/630 — Starlight's Inter steps, now bound in the machine layer.
- **Body** (16px, lh 1.7, 65ch) and **body-small** (0.875rem) for tables.
- **Tagline** (`clamp(0.95rem, 0.8rem + 0.6vw, 1.15rem)`; 0.9rem on mobile).
- **Lede** (`1.125rem`, weight 500, lh 1.5, 62ch, `--sd-ink-soft`): the page description under the title block — one size and one weight above body.
- **Caption** (0.9375rem): aside and note copy.
- **Label** (700 mono, 0.6875rem, ls 0.14em, uppercase): groups, tabs, callout titles.
- **HUD readout** (700 mono, 0.75rem, ls 0.14em) and **HUD chip** (700 mono, 0.6875rem, ls 0.12em, the same step on mobile): console values and control hints. HUD labels (`dt`) print at 400 against 700 values, so the roles separate at a glance.
- **Mono measure** (0.8125rem): code, tables, revision values.

**The Anton 400 Rule.** Anton ships a single 400; it is never faux-bolded —
`font-weight: 400` with `font-synthesis: none` on every Anton role, the splash
h1 included.

The 0.6875rem floor is absolute — no functional text ships below 11px. The
mobile console steps sit on the floor: the HUD chips and the sound key are
0.6875rem at every width.

**Delivery.** The three typefaces preload (`Head.astro`) and carry
metric-compatible fallback faces — `Inter Fallback` (Arial), `Anton Fallback`
(Arial Narrow), `JetBrains Mono Fallback` (Courier New) — with `size-adjust`,
`ascent-override`, `descent-override` and `line-gap-override` computed from the
shipped woff2 files (`world.css`). The `font-display: swap` window therefore
paints with the same line boxes the webfonts produce, so the swap does not
reflow the page.

## Layout

**Splash**: full-bleed cel viewport under a 3.5rem eyecatch bar. Legend plate top-left
(632×287 desktop, `calc(100% - 1.2rem)` mobile), target readout top-center, telemetry
right, flight bottom-left, control chips bottom-center, sound bottom-right, anchored
doc labels projected from their bodies (max 4, sensor range 200u, pushed clear of the
plate). The bottom row shares one **1.5rem baseline**; under `50rem` the chips lift to
`4.6rem` so the thumbs have the glass. Mobile hides the telemetry and flight stacks and
collapses the bar to mark + search + GitHub + menu.

**Docs**: Starlight shell — 3.5rem eyecatch bar, ticked numbered sidebar, 68rem content
column, right TOC, revision block pinned to the bottom of the last content panel. Every
hand-written page carries a frontmatter `description`; the title block prints it as the
`.page-lede` lead line under the hairline rule.

**Breakpoints**: `50rem` (mobile: bar condenses, plate becomes a tab, chips reflow) and
`72rem` (TOC appears). Content measure 65ch.

**The Cockpit Rule.** The console wraps the canopy: every voice leans with the
curve, and the bottom row shares one 1.5rem baseline.

## Elevation & Depth

Depth is drawn, not cast. The world and the console build elevation from line
weight, cut corners and ink; the printed sheet allows itself one lift — on data
panels and the incumbent overlay chrome — and nothing else.
- **Hairlines and ticks** — 1px rules, corner ticks, the active-item left rule; elevation is a change of line weight.
- **Chamfers** — cut corners on the plate and console chips (clip-path), not shadows.
- **Halftone** — dot fields on heading tails and margins; static paper grain on the light body.
- **Ink** — the black (or white, on the dark ship) back-face hull pushed along the averaged normals in the vertex shader; never optional.
- **Glass** — translucent fills only where copy must survive over the scene (anchored labels and console voices). The legend plate is an opaque sheet, so its copy's measured contrast is stable over the animated scene.
- **The cockpit arc** — the one full-width drawn surface: a soft dark dashboard falloff with a hairline top edge under the bottom voices.
- **Printed lift** — the three incumbent shadow steps survive on data panels and Starlight's overlay chrome only. Never on the console, never on a 3D body.

### Shadow Vocabulary
- **sheet-edge** (`0 1px 1px rgba(27,43,82,0.06), 0 2px 3px rgba(27,43,82,0.08)`): `--sl-shadow-sm`, data panels and printed plates at rest.
- **overlay-lift** (`0 2px 2px rgba(27,43,82,0.05), 0 6px 10px rgba(27,43,82,0.1)`): `--sl-shadow-md`, incumbent overlay chrome (search modal, menus).
- **overlay-deep** (`0 3px 3px rgba(27,43,82,0.04), 0 12px 22px rgba(27,43,82,0.14)`): `--sl-shadow-lg`, the largest incumbent overlay.
- In the cel register all three swap to black alphas (0.35 / 0.5), so printed lift never glows on the night sheet.

**The Drawn-Depth Rule.** Elevation is a change of line weight, a chamfer, a
halftone field or an ink hull. Shadows belong to printed panels and overlay
chrome; they never touch the console or a 3D body.

**The Halftone Rule.** Halftone never sits under body text; it lives on margins,
heading tails, transitions.

**The Ink Rule.** Every 3D body carries an ink hull outline — white on the dark
ship, black on bright bodies. No outline, no anime.

## Shapes

- **Corners**: square by default; the only curves are the 2px hairline, the 3px identifier pill and the 99px scrollbar thumb.
- **Chamfers**: `7px` small voices, `10px` panels, `16px` the plate, cut top-right.
- **Forms**: sphere planets (48×32) with tilted instanced rings, low-poly icosahedral moons and example crystals, angular icosahedral rocks, octahedral smoke puffs, a faceted glTF ship — nothing organic, nothing smooth.
- **Marks**: a 6px square lit marker leads every CTA; the vermillion block mark carries the bar.

**The Curvature Rule.** Curvature is a per-voice lean plus a dashboard arc, never
a bevel or a gradient card.

## Components

### Signature — the eyecatch bar
A 3.5rem band: a skew-cut vermillion `IM2` block with white ink, the product title
in Anton uppercase, panel tabs in mono caps with a 3px vermillion underline on the
active section, then search, theme and social controls. The band is `void-raised`
under the cel register and `print-raised` on the light sheet; over the splash it is
`hud-fill-2` glass. The bar reserves a 4px inset above its vermillion rule (the
inner strip reclaims it), so the tabs never sit flush on the rule. On mobile it
condenses to mark + search + GitHub + menu.

### Signature — the legend plate
The one filled caption box: title in Anton, tagline, then four actions — **one primary**
(filled vermillion, ink text) and three hairline peers, the last one GitHub with a visible
label and `aria-label`. It collapses to a compact tab **only when the pilot takes the
controls** (canvas press or throttle) and reopens from the tab on any device. The
~70ms grow animates grid tracks — the plate's column track and the body's row
tracks — never `width`/`max-width`/`padding`/`max-height`.

### Signature — the console voices
Every readout is line-work on the viewport: mono label + tabular value, a hairline
underline, no box. The reticle is the only frame at the centre; the chevrons at the
screen edge point to off-screen objectives and vanish once found.

### Signature — the cockpit
The console wraps the canopy: each voice carries its own lean — the telemetry rail
`rotateY(−7°)`, the flight readout, chips and sound key `rotateX(+5…6°)`, the compass
`rotateX(−6°)` — and a soft dark dashboard arc (17vh, 22vh on mobile) with a hairline
top edge sits under it. In the DOM fallback the voices keep their pointer parallax;
inside the canvas the lean is baked as cosine scaling into the drawn texture, because
the snapshot drops CSS transforms. The bottom row shares one baseline at 1.5rem.

### Signature — the splash's motion grammar
The splash draws at most 60 times a second: physics keeps the rAF cadence and an
accumulator gates rendering, so a 120Hz display never burns frames the eye cannot
see. Boot is `2.4s cubic ease-out` — the schematic phosphor assembles into the cel
surface. The first throttle input fires a `~0.5s` launch shake, then the frame goes
stable. Parked for `0.7s` the camera orbits to `π·0.46` of a high side profile
(`+85%` height) and swings back on throttle. Anchored blocks chase their bodies at
`0.2` per frame while projection targets are recomputed at `~8Hz`, so the DOM never
measures per frame. `prefers-reduced-motion` snaps every one of these to its end state.

### The console can live inside the splash canvas
`#hud-drawable` hosts the five voices as `drawable` descendants (WICG
html-in-canvas); `hudcanvas.ts` mirrors them into a 2D canvas and maps that onto
a camera-parented quad, so the console is drawn by the scene. The host canvas is
hidden with `filter: opacity(0)` — `opacity`/`visibility` on the canvas or on a
voice blanks the snapshots — and the per-voice curvature is baked into the drawn
texture because the snapshot drops CSS transforms. Without the feature the
voices are relocated to the document, `data-hud-canvas` stays off, and the fixed
DOM rules above take over.

### Signature — the instanced bodies
Planets (one hue each from nine `PLANET_HUES`, hash-derived rings on the ringed
worlds, a moon apiece), example crystals, a 460-rock belt, a dense cyan exhaust,
the ship — all `InstancedMesh2`, all ink-outlined, all seeded. Planets are spheres
of radius `4.4` with rings at `5.1–6.4` and moons of radius `0.5`; crystals are
icosahedra of radius `2.6`. The ink hull is the same geometry pushed along the
averaged normals by a per-body width — ship `0.03` in white, beacons `0.08`, rocks
`0.12`, crystals `0.16`, default `0.07` — in `ink-hull` `#05090b`. The lit bodies
(planets, crystals, ship) take the toon bands; the rocks and smoke are unlit
`MeshBasicMaterial` — flat per-instance albedo, no light response,
`castShadow = false`, `receiveShadow = false`.

### Signature — the examples wall
The examples sheet is a wall, not a column: it escapes the prose measure and centres
against the viewport as a hairline grid of plates (poster → animated WebP on hover),
filter chips in mono caps (active chip inverts to ink) and a search field. A plate
opens the live scene in a framed viewer (dialog + iframe) with a "SHEET ↗" escape to
its own page.

### Docs components
- **Title block**: `h1` in Anton uppercase, hairline rule with a vermillion sheet tick, then the frontmatter description as `.page-lede` (Inter 1.125rem/500, 62ch).
- **Caption box** (aside): 1px ink border, square corners, paper-raised fill, mono-caps title, sheet-edge shadow.
- **Data panel** (table): 1px ink border, 2px radius, print-sunk header in mono caps, hairline row rules, tabular numerals, sheet-edge shadow.
- **Sheet tab** (pagination): bordered blocks with Anton link titles.
- **Revision block** (footer): label/value cells, pinned to the bottom.
- **Identifier pill**: inline `code`, 3px radius.

**The Line-Work Rule.** The console has no boxes: readouts are line-work on the
viewport, so the world stays visible behind them.

**The One Primary Rule.** Exactly one primary action per surface; everything else
is a hairline peer.

**The Plate Is Control Rule.** The legend plate is a control, not an interruption:
it collapses only when the pilot takes the controls, and the toggle brings it back
on any device.

## Do's and Don'ts

### Do
- Do draw with ink, flat colour and halftone; keep the world visible behind the console.
- Do let the sky carry the colour; keep the console ink-white + amber + red.
- Do keep one primary action per surface and hairlines for every peer.
- Do seed the map and the rings from the name hash, so the sky is stable.
- Do keep the plate a control: it collapses on scene input and always reopens.
- Do cap at 60fps, count the instances in the telemetry, and honour `prefers-reduced-motion`.
- Do keep the console line-work — no boxes, no blur, no glow slabs.

### Don't
- Don't put boxes, blur or glow slabs in the console — line-work only.
- Don't wash the screen in one hue, and don't use green outside objectives.
- Don't ship a 3D body without its ink hull, or smooth-shade a banded surface.
- Don't put halftone under body text, or decorative texture on a reading surface.
- Don't auto-dismiss the entry point on a bare keypress, and don't hide the CTAs from the tab order.
- Don't let the readout collide with the plate on mobile: the plate wins while it is open.
- Don't cast shadows on the console or a 3D body — printed lift belongs to data panels and overlay chrome.
- Don't ship functional text below the 0.6875rem floor, and don't copy the sub-11px steps the floor replaced.

### Known drift (findings to read, not rules)
A typographic assessment of the built world found these defects; all are now
closed or accounted for, and nothing here is normative:
- Fixed: the hero h1 is Anton 400 with `font-synthesis: none` on every Anton role; the five sub-11px strings are now 0.6875rem; `.plate-slug` uses `--sd-ink-soft` (7.40:1 light / 6.53:1 dark); `tabular-nums` covers `.revision-value`, the sidebar counter, `#st-version`, `#compass-target` and the examples `.chip` counts; the three woff2 files actually used are preloaded in `Head.astro`; the dead `'Space Grotesk Variable'` in `theme.css` is now the Inter stack; the HUD chip and sound steps are 0.6875rem at every width; docs h2/h3/h4 are bound as `heading-2`/`heading-3`/`heading-4` (35/29/24px, 640/630/630); the TOC links read at line-height 1.4; the lede is 1.125rem/500; the HUD `dt` labels are 400 against 700 values; the hero CTAs shrink inside the 320px plate (`minmax(0, 1fr)`) and the hero h1 clamps to three lines; the code register is the world's own Expressive Code theme (`code-theme.mjs`).
- Fixed: the URL detector's `line-length` heuristic reports ~91 chars/line on docs pages at a 72ch measure. The prose measure is now 65ch (`.sl-markdown-content :is(p, li, dd, pre)` in `theme.css`, inside the 68rem column) — 656px, 82 detector-chars — and the rule reads zero on every audited route. The two `tight-leading` findings were Starlight's visually-hidden `sr-only` spans inheriting the heading line-height (1.2); they now carry 1.5 (`theme.css`).
- Fixed: the legend plate's copy measured as low-contrast because the plate was translucent over the animated scene. The plate (and its collapsed tab) now uses an opaque fill (`--sd-hero-plate`), with no `backdrop-filter` or drop-shadow `filter`, so the copy's contrast is frame-independent. The examples wall's hover preview swaps with `visibility` instead of `opacity: 0` (a raster at zero opacity reads as buried), the wall's mono captions sit at `0.05em` tracking, the empty-filter status line drops its uppercase transform, and inline `code` is `white-space: nowrap` so a chip cannot fragment into two overlapping boxes. The TOC rail is capped at `14rem` (`12rem` below 1200px, a margin note, not a column) and the main pane absorbs the difference.
- Fixed: the `examples/Loader` route was an accidental page (a component in `src/pages` that loaded a missing `index.js`). It is renamed `_Loader.astro` — Astro ignores it as a route — and the live example pages import it as before; the build ships 70 pages, no 404-ing shell.
- Fixed: the dark register no longer inks interactives in cyan. `--sd-blueprint` and `--sd-teal` now bind the cel-amber channel (`#ffb347` / `#ffe9b0`) with `cel-amber-deep #ffd08a` and `cel-amber-pale #3a2412`, and the dark code theme drops `#39c7d6` (keywords cream `#ffe9b0`, strings `#ffd08a`); the URL detector's `ai-color-palette` ("cyan neon on dark") count fell to zero on the audited routes. `cel-cyan #39c7d6` remains declared for cel-register subjects and the light print register.
- Reserved, not yet consumed by a body or voice: `hud-ready #6ee7a8` and `cel-magenta #ff4f9a` are declared in the stylesheets and kept in the machine layer so the doctrine survives; the code register is the first consumer of `cel-cream #ffe9b0` and `cel-green #8fd14f`, and the reticle core reads `splash-orange`, not `hud-alert`.
- Delivery note: the html-in-canvas WebGL fast path (`texElementSubImage2D` + `updateElementGeometry`) is coded behind a feature detect but not implemented in current Chromium, so the 2D `drawElementImage` → `CanvasTexture` path is what runs today.
