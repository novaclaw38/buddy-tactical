# Core Cadet Experience — MVP Design

## Purpose

Buddy is an AI-powered "Tactical Academy" for kids aged 4-10, solving the
"guilt-free sitter" problem by turning screen time into structured,
educational, character-building missions. This is the first sub-project: a
thin vertical slice that proves the core mission loop (voice in, AI-generated
content, voice out) is fun and educational before any monetization, WhatsApp
reporting, or full parent dashboard is built.

## Scope

In scope:
- One course track: Robotics ("Operation Iron Blueprint")
- One child profile per parent account (multiple profiles allowed, but no
  multi-child switching UI polish needed yet)
- The Command Orb mission loop: voice in → AI-generated mission content →
  voice out
- Minimal parent flow: sign up, log in, create a child profile
- Minimal child flow: PIN/avatar profile picker, then straight into the Orb

Out of scope (future sub-projects):
- Payfast payments / subscription gating / the Vault monetization hook
- Sunday Storybooks (WhatsApp AARs)
- Parent Dashboard (Live Pulse, Rank Up History, Squad Assembly/referrals)
- Additional course tracks (Beast Intelligence, Field Rations, Botany Ops)
- Full "Full Tactical" visual system (scanlines, HUD-mask, mechanical SFX) —
  a simplified version of the Command Black / Tactical Teal / Alert Orange
  palette and Orb visual is in scope; the full aesthetic pass is layered on
  via the `impeccable` skill during implementation, not blocking this spec.

## Technical Stack

- **Frontend:** Next.js (App Router) + React, Tailwind CSS, mobile-responsive
- **Backend/data:** Supabase (Postgres + Auth)
- **AI pipeline:** Groq for all three legs — Whisper (STT), LLM (mission
  content generation), PlayAI TTS (voice output). Single vendor, single API
  key, free tier available on all three.

## Architecture

### Auth model

- **Parent:** Supabase Auth, email/password.
- **Child:** No independent Supabase Auth identity. A `children` row
  (`id`, `parent_id`, `name`, `avatar`, `pin_hash`, `rank`) lives under the
  parent's account. The device must have an active parent session to reach
  the child-profile picker; the child then enters their PIN/avatar
  combination to select their own profile and land on their mission screen.
  This is a lightweight in-app profile switch, not a second auth system.

### Data model (Supabase tables)

- `children`: id, parent_id (fk → auth.users), name, avatar, pin_hash, rank,
  created_at
- `mission_progress`: id, child_id (fk), course ("robotics" for MVP),
  rank, turns_completed, updated_at
- `mission_turns` (optional log for debugging/tuning prompts): id, child_id,
  role (child/orb), transcript_or_text, created_at

### Mission loop (per turn)

1. Child taps mic on the Command Orb screen → browser records audio.
2. Audio sent to backend route → **Groq Whisper** transcribes it.
3. Transcript + course context (course="robotics", current rank, recent
   turn history) sent to **Groq LLM** with a system prompt establishing the
   "Field Commander" persona. LLM returns structured JSON:
   `{ orb_text: string, rank_delta: number, mission_complete: boolean }`.
4. `orb_text` sent to **Groq TTS (PlayAI)** → audio buffer returned to
   frontend.
5. Frontend plays audio, pulses the Orb core with playback amplitude, and
   types `orb_text` on screen with a terminal-reveal (typewriter) effect.
6. If `rank_delta > 0`, persist new rank to `mission_progress` and trigger
   the "System Reboot" full-screen transition before the next turn starts.

### Error handling

- Each Groq call (STT, LLM, TTS) gets one retry on failure. If it still
  fails, the Orb responds in-character with a fixed fallback line ("Comms
  are glitchy, Cadet — say that again?") instead of surfacing a raw error.
- If the browser denies microphone permission, the session falls back to a
  tap-to-answer (multiple choice) mode for that session rather than
  blocking the child from continuing.

## Testing

- Unit tests for the rank/progress calculation logic (pure function,
  isolated from the Groq calls).
- One integration test against a mocked Groq client verifying the
  STT → LLM → TTS request/response shape and the retry-then-fallback path.
- Manual verification of the live voice loop in-browser (via the `run`
  skill) — the actual feel of the interaction isn't meaningfully covered by
  automated tests.

## Open items deferred to implementation

- Exact LLM system prompt / age-appropriateness guardrails for the
  Field Commander persona — tuned during implementation, not blocking
  design approval.
- Visual polish level (scanlines, HUD-mask, SFX) — handled via the
  `impeccable` skill as a follow-up pass on top of a functional first
  build.
