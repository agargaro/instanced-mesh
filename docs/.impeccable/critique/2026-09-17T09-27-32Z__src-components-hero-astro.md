---
target_identity: "file:/home/ld/instanced-mesh/docs/src-components-hero-astro"
timestamp: 2026-09-17T09-27-32Z
slug: src-components-hero-astro
---
# Critique: the hero (splash legend plate) — src/components/Hero.astro
Method: dual-agent (A: ses_f51596303ffeCyb340QBZ1MqcC · B: ses_f51595708ffe9MthzsWUz1YYad)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | plate vanishes at 12s with no cue |
| 2 | Match System / Real World | 3 | "TAP TO EXPAND" is touch language on desktop |
| 3 | User Control and Freedom | 1 | auto-dismiss; no pin/dismiss/keyboard reopen |
| 4 | Consistency and Standards | 2 | only filled box in a line-work console; GitHub unlabeled |
| 5 | Error Prevention | 2 | unnamed GitHub link; timer deletes the docs paths |
| 6 | Recognition Rather Than Recall | 2 | six-term noun list; no code/install/version |
| 7 | Flexibility and Efficiency | 1 | can't pin/dismiss; 3 CTAs at equal weight |
| 8 | Aesthetic and Minimalist Design | 3 | spare, but 3 stacked textures on 632×287 |
| 9 | Error Recovery | 1 | losing the plate is unrecoverable for keyboard users |
| 10 | Help and Documentation | 3 | right three paths; missing install line |
| **Total** | | **20/40** | **Needs work** |

## Design Specificity Verdict
Specific in the words and the code (real API in the tagline; `measureHero()` keeps annotations off the plate) but the form is category HUD language and the plate is the one near-opaque slab in a system that declares line-work only. Detector: Hero.astro 0 findings (not waiver masking, verified with the attribute stripped); world.css 8 (3 hero font sizes off ramp: L385 mobile h1 clamp, L389 mobile tagline 0.9rem, L432 collapsed h1 1.1rem). No injected overlay available (puppeteer screenshots + DOM/pixel measurement used).

## Overall Impression
The world is excellent; the plate is a good guest the code protects, then deletes. Biggest opportunity: a real control (pinnable, keyboard-openable, re-measurable), not a 12s interruption.

## What's Working
1. Tagline is specific and readable (8.8–10.1:1 median).
2. The scene is coded to respect the plate (annotation no-go zone; verified push to y=462).
3. Register coherence with the console (ticks, chamfer, mono caps, fringing).

## Priority Issues
- **[P0] Collapsed plate is keyboard-unreachable; first keypress deletes the CTAs.** `collapseHero` on keydown capture (intro.ts:681); `.hero` plain div, no tabindex/role/aria-expanded; collapsed `.actions` display:none (world.css:436). Measured: first Tab collapses; 45 further Tabs never focus it. Fix: real `<button aria-expanded>`, ignore Tab/Escape/⌘K, keep CTAs visually hidden. `$impeccable harden`
- **[P1] 12s auto-dismiss with no warning; heroBox never re-measured.** intro.ts:683; measureHero only on resize → stale 632×287 exclusion after collapse to 135×64. Fix: collapse on scene interaction only or 30s+ with cue + keep-open; re-measure on collapse/expand. `$impeccable shape`
- **[P1] GitHub action unnamed, reads as an empty box with an orange dot.** Empty text → 71×56 / 156×40, no aria-label, SVG aria-hidden, orange `:last-child::before`. Fix: aria-label + visible GITHUB label, or move to header. `$impeccable clarify`
- **[P2] CTA borders 2.0:1 (needs 3:1); nothing is primary.** Border rgba(226,236,255,.26) composites 2.0:1; only the 6×6px marker is 12.46:1; four equal-weight controls. Fix: ≥3:1 borders, one filled primary CTA, stop the dotted empty GitHub box. `$impeccable colorize`
- **[P2] Mobile: readout paints through the title, runs off-screen, product name truncated.** Plate 31.0% of 390×844 (371×275 @ 14,66); #compass-target overlap 5,109px² (x191.5→385.2, y67.3→93.7), right edge 474.6 > 390; .site-title "InstancedMesh" (166 vs 151, text-overflow clip) because world.css:360 lacks :global(). Fix: reflow/hide the chip while expanded <50rem; max-width calc(100vw - 1.2rem); add :global(). `$impeccable layout`

## Persona Red Flags
- Keyboard/SR dev: first Tab collapses; 45 Tabs never reach the plate; 12 stops precede the CTAs; GitHub link unnamed.
- Mobile/thumb: 31% viewport; all four CTAs 40px (<44); "TAP TO EXPAND" 9px; title clipped; GitHub cell empty 156×40.
- First-timer: no install/import/code/version; Start vs Tutorial synonyms route differently; everything gone at 12s.

## Minor Observations
- Collapsed h1 17.6px with fixed −1.5px fringe → aberration inverts as type shrinks.
- Anton uppercase erases camel case (INSTANCEDMESH2).
- Two beacon labels stack at one position and overlap the TRIANGLES row (avoidance checks only heroBox).
- Waivers suppress two measured real issues (2.0:1 borders; 166→151 clipping).
- pointerdown anywhere (text selection) collapses; click re-expands → one-frame flicker.
- Collapse itself is a real gain (12.6% → 0.6% desktop): timing and irreversibility are the problem.

## Questions to Consider
1. Plate as guest of the scene, or scene as guest of the plate — you built avoidance then delete the plate at 12s.
2. The console forbids boxes; the hero is the one opaque slab. What earns the exception — and should its CTAs be line-work too?
3. A 12s timeout says "interruption": why is it the only surface stating the product's value, with a 9px tab as the only way back?
