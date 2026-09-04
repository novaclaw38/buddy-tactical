# PROJECT-CONTEXT.md

**Project:** Buddy — Tactical Academy. AI mission-based "guilt-free sitter" app for kids 4-10, subscription model for parents.

**Tech stack:** Next.js (App Router, TypeScript) + Tailwind, Supabase (Postgres + Auth), Groq (Whisper STT, LLM, PlayAI TTS), Vitest.

**Current phase:** Building sub-project 1 of several — "Core Cadet Experience MVP": parent auth, child PIN profile, one course (Robotics), voice-driven Command Orb mission loop. No payments, WhatsApp reports, or parent dashboard yet.

**Key constraints:** All AI calls go through Groq only (no ElevenLabs/OpenAI). Child has no independent auth, PIN/avatar picker under parent session only. One retry + in-character fallback on any AI call failure. Palette: Command Black `#0A0A0B`, Tactical Teal `#00F5FF`, Alert Orange `#FF8A00`.

**Done looks like:** Full voice loop working end-to-end (record → transcribe → generate mission beat → speak response), rank progresses and persists, tests passing per the plan's TDD steps.
