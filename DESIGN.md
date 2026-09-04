---
name: Buddy — Tactical Academy
description: An AI mission-control HUD for kids, built from scanned instrumentation, teal-and-orange signal color, and a monospace terminal voice.
colors:
  command-black: "#0a0a0b"
  command-black-raised: "#101014"
  tactical-teal: "#00f5ff"
  tactical-teal-dim: "#0a3c40"
  alert-orange: "#ff8a00"
typography:
  body:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  title:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.02em"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "32px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.tactical-teal}"
    rounded: "{rounded.none}"
    padding: "12px"
  button-primary-hover:
    backgroundColor: "{colors.tactical-teal-dim}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.alert-orange}"
    rounded: "{rounded.none}"
    padding: "12px"
  button-secondary-hover:
    backgroundColor: "{colors.command-black-raised}"
  input:
    backgroundColor: "{colors.command-black-raised}"
    textColor: "{colors.tactical-teal}"
    rounded: "{rounded.none}"
    padding: "12px"
---

# Design System: Buddy — Tactical Academy

## Overview

**Creative North Star: "The Mission Control Deck"**

Buddy's interface reads as scanned instrumentation inside a command deck, not
a children's app dressed up in dark mode. Every functional control wears a
bracketed HUD-frame — the corner marks of a targeting reticle or an
equipment readout — and the whole page sits under a constant, faint CRT
scanline drift, as if the child is looking at Buddy through a real cockpit
display rather than a phone screen. There is exactly one glowing object on
any given screen at rest: the Command Orb. Everything else stays flat,
square-cornered, and quiet, so that when something does light up or expand,
it reads as instrumentation actually responding, not decoration.

The system currently has almost no elevation outside the Orb's core glow
(`0 6px 24px -4px` of Tactical Teal). That glow is a confirmed direction to
extend, not a one-off: further work should give other key moments of
feedback (control hover/active states, the System Reboot transition) their
own deliberate glow or lift, using the Orb's soft, colored, offset shadow as
the reference — never a flat zero-offset halo.

Two colors do all the signaling: Tactical Teal for the system's own voice
(the Commander, primary actions, focus/system state) and Alert Orange for
anything that needs the child's attention (warnings, the talk control, PIN
errors). Command Black is not a background color choice — it is the
committed world. This is not a dark-mode variant of a lighter design; there
is no light mode.

**Key Characteristics:**
- Bracketed HUD-frame corners on every functional control, never a plain box border
- Command Black is the only background — no light-mode counterpart exists
- Exactly one glowing element at rest (the Orb); other glow/lift is confirmed direction, not yet implemented elsewhere
- Square corners everywhere except the Orb and the circular "Hold to Talk" control
- Single monospace voice (JetBrains Mono) end to end — no secondary display or body face
- A constant, near-invisible CRT scanline drift over the entire viewport

## Colors

Two accents, one ground. The palette is small on purpose: a child under
pressure to make a choice should never have to guess which color means what.

### Primary
- **Tactical Teal** (`#00f5ff`): the system's own voice. Body text color,
  the Command Orb's core and rings, primary button text/border, focus
  states, HUD-frame corner brackets, scrollbar and text-selection color.
- **Tactical Teal Dim** (`#0a3c40`): the hover/pressed fill for
  teal-bordered controls — a dark tonal wash, never a lighter tint.

### Secondary
- **Alert Orange** (`#ff8a00`): reserved for what needs the child's
  attention — the "Hold to Talk" control (the one action a mission turn
  actually requires), PIN and login error text, the Sign Up action
  (a secondary path relative to Log In).

### Neutral
- **Command Black** (`#0a0a0b`): the page background — the only background
  color in the system.
- **Command Black Raised** (`#101014`): the fill for inputs and raised
  surfaces sitting slightly above the base black.

### Named Rules
**The One Voice, One Alert Rule.** Teal means the system talking to the
child (Commander, primary controls, focus). Orange means the child needs to
act or something needs attention (talk button, errors). A control is never
styled in both at once.

## Typography

**Body/Display/Label Font:** JetBrains Mono (fallback: `ui-monospace, monospace`)

**Character:** One monospace voice carries the entire system — headings,
body copy, and the mission transcript all read as terminal output from the
same instrument. There is no serif or humanist sans anywhere; character
comes from scale and letter-spacing, not from a second typeface.

### Hierarchy
- **Headline** (400 weight, 1.5rem/`text-2xl`, -0.02em tracking, 1.3 line-height): page-level titles ("Tactical Academy — Parent Access", "Select Your Cadet").
- **Title** (400 weight, 1.25rem/`text-xl`, -0.02em tracking, 1.3 line-height): in-context titles (the mission screen's "Cadet {name} — Rank {n}" header, "Add a New Cadet").
- **Body** (400 weight, 1rem, normal tracking, 1.5 line-height): form labels, mission transcript lines, standard copy.
- **Label** (400 weight, 0.875rem/`text-sm`): the profile-picker "Back" link and other low-emphasis actions.

### Named Rules
**The Terminal Prefix Rule.** Mission transcript lines are always prefixed with the speaker's role in caps (`COMMANDER:` / `CADET:`) before the message — never shown as an unlabeled chat bubble.

## Layout

Every screen is a single centered column: `flex flex-col items-center
justify-center` inside a `min-h-screen` container with generous outer
padding (`p-8`, 32px) and consistent internal gaps (`gap-8` between major
blocks such as heading/Orb/transcript/control; `gap-3` within a form's own
stacked fields). Forms cap at `max-w-sm` so input rows never stretch full
width even on a wide screen. There is no grid, sidebar, or multi-column
layout anywhere in the current system — every surface is a single vertical
sequence a child can follow top to bottom without visual choice-paralysis.

## Elevation & Depth

The system is flat by default: no borders-plus-shadow combinations, no card
surfaces, no drop shadows on inputs or buttons. Depth is conveyed instead by
the HUD-frame bracket treatment (see Shapes) and by the one deliberate
exception — the Command Orb's core, which carries a soft, colored, offset
glow. Confirmed direction extends this glow/lift language to other moments
of feedback going forward (hover/active states, the System Reboot
transition); until that's implemented, only the Orb carries it.

### Shadow Vocabulary
- **Orb Core Glow** (`box-shadow: 0 6px 24px -4px var(--tactical-teal)`): the Command Orb's only depth cue — a soft offset glow, never a symmetric halo. Reference shadow shape for any future glow/lift work.

### Named Rules
**The One Glow Rule (currently).** At present only the Orb carries elevation; every other surface stays flat. This is being deliberately extended — new glow/lift should follow the Orb's offset, colored-shadow shape, not invent a flat drop-shadow language.

## Shapes

Square corners are the default across the entire system — no
`border-radius` appears on any container, input, or button except two
confirmed exceptions: the Command Orb (fully circular, `rounded-full`) and
the "Hold to Talk" control (also `rounded-full`, the only interactive
element that shares the Orb's circular language). Every other control wears
a 1px straight border plus the HUD-frame's four corner brackets (10×10px,
2px stroke) rather than a rounded outline — the bracket reads as scanned
instrumentation, a rounded box reads as generic UI chrome.

### Named Rules
**The Circle Is Sacred Rule.** Circular shape is reserved for the Orb and the talk control — the two things the child directly speaks to or through. No other element may borrow the circular form.

## Components

Controls should feel **instrumented and responsive**: every functional
element wears its HUD-frame brackets and reacts immediately to hover/focus,
never soft or ambiguous about its state.

### Buttons
- **Shape:** square corners, HUD-frame bracket border (no `border-radius`), except "Hold to Talk" which is `rounded-full`.
- **Primary (teal):** transparent background, Tactical Teal text and border, `p-3` (12px) padding. Used for the system's own actions (Log In, Confirm PIN).
- **Secondary (orange):** transparent background, Alert Orange text and border. Used for the child/parent-attention path (Sign Up, Create Profile, Hold to Talk).
- **Hover:** teal buttons fill with Tactical Teal Dim; orange buttons fill with Command Black Raised — always a dark tonal fill, never a lighter tint or the accent color itself as background.
- **Focus:** every button and input gets a 2px Alert Orange (or Tactical Teal, on the orange Create-Profile button) `focus-visible` outline — focus state always uses the *opposite* accent from the control's own color, so it's never ambiguous with a hover fill.
- **Ghost/Text link:** the "Back" button in the PIN flow — small, underlined, teal by default, shifts to Alert Orange on hover.

### Inputs / Fields
- **Style:** Command Black Raised background, Tactical Teal text, HUD-frame bracket border, `p-3` (12px, `p-2` for the shorter PIN field), placeholder text at 50% Tactical Teal opacity.
- **Focus:** 2px Alert Orange `focus-visible` outline, matching the button focus rule.
- **Error:** rendered as a separate `role="alert"` line in Alert Orange below the field, wrapped in its own HUD-frame when it's a page-level error (e.g. login failure) — never an inline red-underline or border-color change on the field itself.

### The Command Orb (signature)
The AI avatar and the system's only glowing element. Three concentric
layers: two outer rings (teal border at 40%/25% opacity, counter-rotating
on voice amplitude) around a solid teal core (`w-16 h-16`) carrying the
system's one soft offset glow. Amplitude (0–1, driven by mic input level)
scales the core up to 1.25× and the rings up to 1.12×, with the rings also
rotating up to ±25°/±18° — the Orb visibly "listens" rather than just
pulsing uniformly.

### Mission Transcript (signature)
Each turn renders as a single line prefixed `COMMANDER:` (Tactical Teal) or
`CADET:` (Alert Orange). The newest line only plays a `steps()`-timed
clip-path wipe (the terminal-reveal effect, ~18ms per character, capped at
2.4s) so it appears to type itself in; every prior line is already fully
visible with no re-animation on re-render.

### System Reboot Transition
A full-viewport overlay (fixed, `z-index: 100`, `pointer-events: none`)
triggered on rank-up: a scanline-striped teal/black wipe that reveals from
bottom to top then fades, `900ms cubic-bezier(0.16, 1, 0.3, 1)`. Distinct
from the ambient scanline drift — this is a deliberate, one-time "system
just changed state" event, not the constant background texture.

## Do's and Don'ts

### Do:
- **Do** wrap every functional control in the `hud-frame` bracket treatment — it is the system's substitute for both rounded corners and elevation.
- **Do** keep the circular form reserved for the Orb and the talk control only.
- **Do** use Tactical Teal for the system's own voice/actions and Alert Orange for anything requiring the child's attention — never mix the two on one control.
- **Do** extend the Orb's soft offset colored glow, not a flat drop-shadow, when adding depth to other elements.
- **Do** prefix every transcript line with the speaker's role in caps before the message.

### Don't:
- **Don't** introduce `border-radius` on any container, input, or button other than the Orb and the talk control.
- **Don't** add a light-mode variant — Command Black is the only ground this system has.
- **Don't** use a second typeface for headings or body — JetBrains Mono carries the entire hierarchy.
- **Don't** replay the terminal-reveal typewriter effect on a transcript line that was already visible before the current render.
- **Don't** use a flat, zero-offset colored halo as a shadow — every glow in this system carries a real offset and blur, following the Orb core's shape.
