# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary user (the child):** kids aged 4-10 who want an elite, mission-based
experience. They interact primarily by voice with an AI "Field Commander"
persona inside the Command Orb interface.

**Primary buyer (the parent):** parents seeking educational value, progress
tracking, and meaningful off-screen engagement for their kids — the target
is turning screen time from something to feel guilty about into something
structured and character-building.

## Product Purpose

Buddy is an AI-powered "Tactical Academy" that solves the "guilt-free
sitter" problem: it transforms a child's screen time into a structured,
educational, character-building mission experience, while giving parents
visibility that the time was well spent.

## Positioning

Mission content is generated live by an LLM reacting to what the child
actually says — not a fixed script or pre-recorded branching tree. No two
sessions play out the same way, which a conventional scripted edutainment
app cannot truthfully claim.

## Operating Context

- **Parent flow:** sign up / log in (Supabase Auth, email/password), create
  one or more child profiles under the account.
- **Child flow:** device must already have an active parent session; the
  child then picks their own profile via an avatar + PIN combination (a
  lightweight in-app profile switch, not a second authentication system)
  and lands directly on their mission screen.
- **Mission loop:** child holds a button to talk → audio is transcribed
  (Groq Whisper) → an LLM (Groq) generates the next mission beat in a
  "Field Commander" persona, reacting to what the child said → the response
  is spoken back (Groq PlayAI TTS) and shown as revealed text. Rank
  progresses across turns and is tracked per child, per course.
- **Full product vision** (only the "Core Cadet Experience" MVP slice is
  built so far) includes: multiple 6-month course tracks (Robotics, Beast
  Intelligence/Animals, Field Rations/Cooking, Botany Ops/Gardening),
  weekly "Sunday Storybook" after-action reports delivered to parents via
  WhatsApp, a Parent Dashboard (live engagement pulse, rank-up/certificate
  history, referral "Squad Assembly"), and a Payfast subscription
  (R149/month, South African market) gated behind a "Bio-Signature
  Blueprint" memory-gift hook. None of these are implemented yet.

## Capabilities and Constraints

- All AI processing (speech-to-text, mission-content generation,
  text-to-speech) runs through Groq exclusively — no ElevenLabs, no OpenAI.
  This was a deliberate choice (free-tier availability, single vendor/API
  key) and should not be treated as an implementation detail up for
  substitution without discussion.
- The child has no independent auth identity; PIN gating is a cosmetic
  sibling-switch safeguard, not a security boundary — the real access
  control (isolating one parent's data from another's) is enforced via
  Supabase Row Level Security, not the PIN.
- Every AI call (STT, LLM, TTS) gets one retry on failure before falling
  back to a fixed in-character line ("Comms are glitchy, Cadet — say that
  again?") — the child must never see a raw error.
- If microphone access is denied, the app must fall back to a tap-to-answer
  (multiple-choice) interaction rather than blocking the child from
  continuing the mission.
- Currently implemented: only the "Core Cadet Experience" MVP (one course —
  Robotics; parent auth; child PIN profile; the voice-driven mission loop).
  Payments, WhatsApp reporting, the parent dashboard, and additional course
  tracks are designed (see product purpose above) but not yet built.

## Brand Commitments

- **Name:** Buddy — Tactical Academy.
- **Aesthetic direction:** "Full Tactical" — modeled after elite cockpits
  and mission-control centers, not a soft/candy children's-app look.
- **Palette:** Command Black (`#0A0A0B`), Tactical Teal (`#00F5FF`), Alert
  Orange (`#FF8A00`).
- **Typography:** JetBrains Mono (or an equivalent monospaced "terminal"
  face) as the primary voice, paired with a thin sharp sans-serif for
  secondary HUD metrics.
- **The Command Orb:** the AI avatar is a pulsing teal sphere with
  multi-layered mechanical rings that expand/rotate and grow more complex
  as the child ranks up (single ring at Recruit/Month 1, up to 6-7
  interlocked rings at Specialist/Month 6) — this progression is a binding
  visual commitment, not just a placeholder animation idea.
- **Voice persona:** the AI speaks as a "Field Commander" — crisp,
  professional, encouraging; never scary, never condescending toward a
  4-10 year old.

## Evidence on Hand

No real user content, testimonials, case studies, or press exist yet — this
is a pre-launch product. The full feature set (course tracks, Sunday
Storybooks, Parent Dashboard, referral mechanic) described above is
confirmed product *intent* from the founder's spec, not evidence of
anything built or validated. Future work must not fabricate usage data,
customer quotes, or completed-feature claims beyond the Core Cadet
Experience MVP that actually exists in this codebase today.

## Product Principles

1. **Voice-first, screen-light.** The mission loop is a spoken conversation
   with an AI commander, not another tap-to-progress screen-time app.
2. **Never break the fiction for a child.** Technical failures (AI errors,
   denied permissions) always resolve into an in-character response or
   fallback path — a raw error or dead end is a product failure, not just a
   bug.
3. **Guilt-free by design, not by claim.** The product's value to parents
   is structural (real educational mechanics, tracked progress) — future
   work should earn the "guilt-free" positioning through what the product
   actually does, not through marketing copy alone.
4. **Ship the vertical slice, not the vision.** The full feature set
   (payments, WhatsApp reports, dashboard, multiple courses) is real
   product direction, but each piece ships as its own scoped, working
   sub-project rather than being half-built across the board.
5. **The tactical aesthetic is load-bearing, not decorative.** "Full
   Tactical" (palette, typography, Orb ring progression, Field Commander
   voice) is a brand commitment that later design work extends, not a
   skin that can be swapped for a generic child-friendly look.

## Accessibility & Inclusion

No specific accessibility requirement has been established beyond general
good practice at this stage (MVP). Revisit if a concrete need (e.g.
non-verbal children, screen-reader support for the parent-facing surfaces)
is identified later.
