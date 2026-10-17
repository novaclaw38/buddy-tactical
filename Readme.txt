BUDDY - TACTICAL ACADEMY
========================

An AI mission-based "guilt-free sitter" app for kids aged 4-10, sold as a subscription to
parents.

CURRENT PHASE
-------------
Sub-project 1: the Core Cadet Experience MVP.
- Parent authentication
- Child PIN profile (the child has no independent auth; PIN/avatar picker sits under the
  parent session)
- One course (Robotics)
- Voice-driven Command Orb mission loop: record -> transcribe -> generate mission beat ->
  speak the response
- Rank progression that persists

Not built yet: payments, WhatsApp reports, parent dashboard.

TECH STACK
----------
Next.js (App Router, TypeScript), Tailwind CSS, Supabase (Postgres + Auth), Groq (Whisper
speech-to-text, LLM, PlayAI text-to-speech), Vitest. All AI calls go through Groq only.
On any AI failure the app retries once, then falls back to an in-character response.

BRAND
-----
Palette: Command Black #0A0A0B, Tactical Teal #00F5FF, Alert Orange #FF8A00.

PROJECT LAYOUT
--------------
  app/         Routes and API
  components/  UI components
  lib/         Shared logic
  supabase/    Database migrations
  tests/       Vitest tests
  docs/        Plans and notes
  PROJECT-CONTEXT.md, PRODUCT.md, DESIGN.md   Project context and product/design docs

GETTING STARTED
---------------
  npm install
  cp .env.example .env.local     (fill in the values; see .env.test.example for tests)
  npm run dev
  npm test
