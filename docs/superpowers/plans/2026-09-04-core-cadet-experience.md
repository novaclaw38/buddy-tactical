# Core Cadet Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first playable vertical slice of Buddy — parent signup, child profile with PIN, and a voice-driven Command Orb mission loop (Groq Whisper STT → Groq LLM mission content → Groq PlayAI TTS) for one course track (Robotics).

**Architecture:** Next.js (App Router) monolith. Supabase for Postgres + parent auth. One API route (`/api/mission-turn`) orchestrates the three Groq calls per mission turn. Child "auth" is an in-app PIN/avatar picker gated behind an active parent session, not a second Supabase Auth identity.

**Tech Stack:** Next.js 14+ (App Router, TypeScript), React, Tailwind CSS, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), Groq SDK (`groq-sdk`), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-04-core-cadet-experience-design.md`

## Global Constraints

- Node 22, npm.
- One course track only for this plan: `"robotics"`.
- Child has no independent Supabase Auth identity — PIN/avatar picker only, requires an active parent session.
- All three AI legs (STT, LLM, TTS) go through Groq — no ElevenLabs, no OpenAI.
- Each Groq call: one retry on failure, then in-character fallback text (`"Comms are glitchy, Cadet — say that again?"`) — never surface a raw error to the child.
- Mic permission denied → session falls back to tap-to-answer (multiple choice), never blocks the child.
- Palette: Command Black `#0A0A0B`, Tactical Teal `#00F5FF`, Alert Orange `#FF8A00`. Primary font: JetBrains Mono.
- No payments, no WhatsApp, no dashboard, no other course tracks in this plan.
- Rank is server-authoritative: the mission-turn route reads current rank from `mission_progress` by `child_id` (never trusts a client-supplied rank) and persists the updated rank/turn count before responding.
- LLM responses are runtime-validated against a schema before being applied; a malformed response counts as a failure and routes into the same retry-then-fallback path as a network error.
- Child PIN is hashed with bcrypt, not plain SHA-256.
- Hold-to-Talk supports touch input (not mouse-only) and enforces a minimum hold duration before submitting a turn.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `.gitignore`, `.env.example`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: Next.js app runnable via `npm run dev`; Vitest runnable via `npm test`.

- [ ] **Step 1: Scaffold Next.js app**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-npm
```

When prompted, accept defaults for anything not already implied by flags.

- [ ] **Step 2: Install project dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr groq-sdk
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Add Vitest config**

`vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "vitest run"
```

- [ ] **Step 5: Add tactical theme CSS variables**

In `app/globals.css`, add at the top (after Tailwind directives):
```css
:root {
  --command-black: #0a0a0b;
  --tactical-teal: #00f5ff;
  --alert-orange: #ff8a00;
}

body {
  background-color: var(--command-black);
  color: var(--tactical-teal);
  font-family: "JetBrains Mono", ui-monospace, monospace;
}
```

- [ ] **Step 6: Add .env.example**

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
```

- [ ] **Step 7: Verify dev server boots**

Run: `npm run dev -- --port 3100 &` then `curl -sf http://localhost:3100 > /dev/null && echo OK`
Expected: `OK`. Kill the background server after (`kill %1` or equivalent).

- [ ] **Step 8: Verify test runner works**

Run: `npm test`
Expected: passes with "No test files found" or 0 tests (no test files yet) — must not error on config.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Tailwind and Vitest"
```

---

### Task 2: Supabase schema and client setup

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

**Interfaces:**
- Produces:
  - `createBrowserSupabaseClient(): SupabaseClient` in `lib/supabase/client.ts`
  - `createServerSupabaseClient(): Promise<SupabaseClient>` in `lib/supabase/server.ts`
  - Tables: `children(id uuid, parent_id uuid, name text, avatar text, pin_hash text, rank int, created_at timestamptz)`, `mission_progress(id uuid, child_id uuid, course text, rank int, turns_completed int, updated_at timestamptz)`, `mission_turns(id uuid, child_id uuid, role text, content text, created_at timestamptz)`

- [ ] **Step 1: Write migration SQL**

`supabase/migrations/0001_init.sql`:
```sql
create table children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  avatar text not null,
  pin_hash text not null,
  rank int not null default 1,
  created_at timestamptz not null default now()
);

create table mission_progress (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  course text not null,
  rank int not null default 1,
  turns_completed int not null default 0,
  updated_at timestamptz not null default now(),
  unique (child_id, course)
);

create table mission_turns (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children(id) on delete cascade,
  role text not null check (role in ('child', 'orb')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table children enable row level security;
alter table mission_progress enable row level security;
alter table mission_turns enable row level security;

create policy "Parents manage their own children"
  on children for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

create policy "Parents manage their children's progress"
  on mission_progress for all
  using (exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid()));

create policy "Parents manage their children's turns"
  on mission_turns for all
  using (exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid()))
  with check (exists (select 1 from children c where c.id = child_id and c.parent_id = auth.uid()));
```

**Flagging per project security rules: this RLS policy scopes all access to the authenticated parent (`auth.uid() = parent_id`, or the child belonging to that parent) — review before applying to a live database, since a wrong `USING` clause here would expose one parent's children to another.**

- [ ] **Step 2: Write browser Supabase client**

`lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 3: Write server Supabase client**

`lib/supabase/server.ts`:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

- [ ] **Step 4: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add supabase lib/supabase
git commit -m "feat: add Supabase schema and client helpers"
```

---

### Task 3: Rank/progress calculation logic (TDD)

**Files:**
- Create: `lib/mission/rank.ts`
- Test: `tests/mission/rank.test.ts`

**Interfaces:**
- Produces: `applyRankDelta(current: { rank: number; turnsCompleted: number }, delta: number): { rank: number; turnsCompleted: number; rankedUp: boolean }` in `lib/mission/rank.ts`
- Consumes: nothing (pure function, no earlier task dependency beyond scaffold)

- [ ] **Step 1: Write the failing tests**

`tests/mission/rank.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { applyRankDelta } from "@/lib/mission/rank";

describe("applyRankDelta", () => {
  it("increments turnsCompleted every call", () => {
    const result = applyRankDelta({ rank: 1, turnsCompleted: 0 }, 0);
    expect(result.turnsCompleted).toBe(1);
  });

  it("keeps rank unchanged when delta is 0", () => {
    const result = applyRankDelta({ rank: 2, turnsCompleted: 5 }, 0);
    expect(result.rank).toBe(2);
    expect(result.rankedUp).toBe(false);
  });

  it("increases rank by delta and flags rankedUp when delta is positive", () => {
    const result = applyRankDelta({ rank: 1, turnsCompleted: 3 }, 1);
    expect(result.rank).toBe(2);
    expect(result.rankedUp).toBe(true);
  });

  it("never decreases rank below the current rank", () => {
    const result = applyRankDelta({ rank: 3, turnsCompleted: 10 }, -1);
    expect(result.rank).toBe(3);
    expect(result.rankedUp).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/mission/rank.test.ts`
Expected: FAIL — `Cannot find module '@/lib/mission/rank'`

- [ ] **Step 3: Write minimal implementation**

`lib/mission/rank.ts`:
```typescript
export interface RankState {
  rank: number;
  turnsCompleted: number;
}

export interface RankResult extends RankState {
  rankedUp: boolean;
}

export function applyRankDelta(current: RankState, delta: number): RankResult {
  const safeDelta = Math.max(0, delta);
  const rank = current.rank + safeDelta;
  return {
    rank,
    turnsCompleted: current.turnsCompleted + 1,
    rankedUp: safeDelta > 0,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/mission/rank.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/mission/rank.ts tests/mission/rank.test.ts
git commit -m "feat: add rank progression logic"
```

---

### Task 4: Field Commander prompt builder

**Files:**
- Create: `lib/mission/prompt.ts`
- Test: `tests/mission/prompt.test.ts`

**Interfaces:**
- Produces: `buildMissionPrompt(context: { course: "robotics"; rank: number; recentTurns: Array<{ role: "child" | "orb"; content: string }> }): string` in `lib/mission/prompt.ts`
- Consumes: nothing new

- [ ] **Step 1: Write the failing test**

`tests/mission/prompt.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildMissionPrompt } from "@/lib/mission/prompt";

describe("buildMissionPrompt", () => {
  it("includes the Field Commander persona and course name", () => {
    const prompt = buildMissionPrompt({ course: "robotics", rank: 1, recentTurns: [] });
    expect(prompt).toContain("Field Commander");
    expect(prompt).toContain("robotics");
  });

  it("includes an age-appropriate constraint for ages 4-10", () => {
    const prompt = buildMissionPrompt({ course: "robotics", rank: 1, recentTurns: [] });
    expect(prompt.toLowerCase()).toContain("ages 4");
  });

  it("includes recent turn history when present", () => {
    const prompt = buildMissionPrompt({
      course: "robotics",
      rank: 2,
      recentTurns: [{ role: "child", content: "A sensor detects light." }],
    });
    expect(prompt).toContain("A sensor detects light.");
  });

  it("instructs the model to respond with the required JSON shape", () => {
    const prompt = buildMissionPrompt({ course: "robotics", rank: 1, recentTurns: [] });
    expect(prompt).toContain("orb_text");
    expect(prompt).toContain("rank_delta");
    expect(prompt).toContain("mission_complete");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/mission/prompt.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

`lib/mission/prompt.ts`:
```typescript
export interface MissionTurn {
  role: "child" | "orb";
  content: string;
}

export interface MissionContext {
  course: "robotics";
  rank: number;
  recentTurns: MissionTurn[];
}

export function buildMissionPrompt(context: MissionContext): string {
  const history = context.recentTurns
    .map((turn) => `${turn.role === "child" ? "Cadet" : "Commander"}: ${turn.content}`)
    .join("\n");

  return `You are the Field Commander, an AI mission guide for the Buddy Tactical Academy.
You speak to a child aged 4-10 in a crisp, professional, encouraging tone — never scary, never condescending.
Current course: ${context.course}. Cadet's current rank: ${context.rank}.

Generate the next short mission beat: a question, fact, or challenge appropriate for ages 4-10.
Keep language simple and positive. Do not include violence, fear, or mature themes.

Recent conversation:
${history || "(mission just started)"}

Respond with ONLY a JSON object of this exact shape, no other text:
{"orb_text": string, "rank_delta": number (0 or 1), "mission_complete": boolean}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/mission/prompt.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/mission/prompt.ts tests/mission/prompt.test.ts
git commit -m "feat: add Field Commander prompt builder"
```

---

### Task 5: Groq client wrappers (STT, LLM, TTS)

**Files:**
- Create: `lib/groq/client.ts`
- Create: `lib/groq/stt.ts`
- Create: `lib/groq/llm.ts`
- Create: `lib/groq/tts.ts`
- Test: `tests/groq/llm.test.ts`

**Interfaces:**
- Consumes: `buildMissionPrompt` from Task 4 (`lib/mission/prompt.ts`)
- Produces:
  - `getGroqClient(): Groq` in `lib/groq/client.ts`
  - `transcribeAudio(audio: Buffer): Promise<string>` in `lib/groq/stt.ts`
  - `generateMissionBeat(context: MissionContext): Promise<{ orb_text: string; rank_delta: number; mission_complete: boolean }>` in `lib/groq/llm.ts` — throws if the model's response doesn't match the expected shape (caller treats this the same as a network failure)
  - `synthesizeSpeech(text: string): Promise<Buffer>` in `lib/groq/tts.ts`

- [ ] **Step 1: Install zod for runtime response validation**

```bash
npm install zod
```

- [ ] **Step 2: Write shared Groq client factory**

`lib/groq/client.ts`:
```typescript
import Groq from "groq-sdk";

let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}
```

- [ ] **Step 3: Write STT wrapper**

`lib/groq/stt.ts`:
```typescript
import { getGroqClient } from "./client";
import { toFile } from "groq-sdk";

export async function transcribeAudio(audio: Buffer): Promise<string> {
  const groq = getGroqClient();
  const response = await groq.audio.transcriptions.create({
    file: await toFile(audio, "turn.webm"),
    model: "whisper-large-v3-turbo",
  });
  return response.text;
}
```

- [ ] **Step 4: Write the failing tests for the LLM wrapper**

`tests/groq/llm.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";

const create = vi.fn();

vi.mock("../../lib/groq/client", () => ({
  getGroqClient: () => ({
    chat: { completions: { create } },
  }),
}));

import { generateMissionBeat } from "@/lib/groq/llm";

describe("generateMissionBeat", () => {
  it("parses the model's JSON response into a typed mission beat", async () => {
    create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              orb_text: "Cadet, identify the sensor type.",
              rank_delta: 0,
              mission_complete: false,
            }),
          },
        },
      ],
    });

    const result = await generateMissionBeat({ course: "robotics", rank: 1, recentTurns: [] });
    expect(result.orb_text).toBe("Cadet, identify the sensor type.");
    expect(result.rank_delta).toBe(0);
    expect(result.mission_complete).toBe(false);
  });

  it("throws when the model response is missing required fields", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ orb_text: "Hi Cadet." }) } }],
    });

    await expect(generateMissionBeat({ course: "robotics", rank: 1, recentTurns: [] })).rejects.toThrow();
  });

  it("throws when the model response is not valid JSON", async () => {
    create.mockResolvedValue({
      choices: [{ message: { content: "not json" } }],
    });

    await expect(generateMissionBeat({ course: "robotics", rank: 1, recentTurns: [] })).rejects.toThrow();
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test -- tests/groq/llm.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 6: Write minimal LLM implementation with schema validation**

`lib/groq/llm.ts`:
```typescript
import { z } from "zod";
import { getGroqClient } from "./client";
import { buildMissionPrompt, MissionContext } from "../mission/prompt";

const missionBeatSchema = z.object({
  orb_text: z.string().min(1),
  rank_delta: z.number().int().min(0).max(1),
  mission_complete: z.boolean(),
});

export type MissionBeat = z.infer<typeof missionBeatSchema>;

export async function generateMissionBeat(context: MissionContext): Promise<MissionBeat> {
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: buildMissionPrompt(context) }],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Groq LLM returned no content");
  }

  const parsed: unknown = JSON.parse(content);
  return missionBeatSchema.parse(parsed);
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- tests/groq/llm.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 8: Write TTS wrapper**

`lib/groq/tts.ts`:
```typescript
import { getGroqClient } from "./client";

export async function synthesizeSpeech(text: string): Promise<Buffer> {
  const groq = getGroqClient();
  const response = await groq.audio.speech.create({
    model: "playai-tts",
    voice: "Fritz-PlayAI",
    input: text,
    response_format: "wav",
  });
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

- [ ] **Step 9: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add lib/groq tests/groq package.json package-lock.json
git commit -m "feat: add Groq STT, LLM, and TTS wrappers with response validation"
```

---

### Task 6: Mission-turn API route with retry/fallback

**Files:**
- Create: `app/api/mission-turn/route.ts`
- Test: `tests/api/mission-turn.test.ts`

**Interfaces:**
- Consumes: `transcribeAudio`, `generateMissionBeat`, `synthesizeSpeech` from Task 5; `applyRankDelta` from Task 3; `createServerSupabaseClient` from Task 2; `child_id` cookie (set in Task 8) as the sole source of which child this turn belongs to
- Produces: `POST /api/mission-turn` — accepts `multipart/form-data` with fields `audio` (file), `course` (string), `recentTurns` (JSON string of `MissionTurn[]`). Rank is never accepted from the client — the route reads it from `mission_progress` (row keyed by `child_id` + `course`, created with `rank: 1, turns_completed: 0` if absent) and writes the updated row back before responding. Returns JSON `{ orb_text: string; audio_base64: string; rank: number; ranked_up: boolean; mission_complete: boolean }` on success, or the fallback shape `{ orb_text: "Comms are glitchy, Cadet — say that again?"; audio_base64: null; rank: number; ranked_up: false; mission_complete: false }` on failure after retry (`rank` in the fallback is the persisted rank, unchanged).

- [ ] **Step 1: Write the failing test**

`tests/api/mission-turn.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const transcribeAudio = vi.fn();
const generateMissionBeat = vi.fn();
const synthesizeSpeech = vi.fn();
const getChildIdCookie = vi.fn();
const getMissionProgress = vi.fn();
const saveMissionProgress = vi.fn();

vi.mock("@/lib/groq/stt", () => ({ transcribeAudio: (...args: unknown[]) => transcribeAudio(...args) }));
vi.mock("@/lib/groq/llm", () => ({ generateMissionBeat: (...args: unknown[]) => generateMissionBeat(...args) }));
vi.mock("@/lib/groq/tts", () => ({ synthesizeSpeech: (...args: unknown[]) => synthesizeSpeech(...args) }));
vi.mock("@/lib/mission/progress", () => ({
  getChildIdFromCookies: (...args: unknown[]) => getChildIdCookie(...args),
  getMissionProgress: (...args: unknown[]) => getMissionProgress(...args),
  saveMissionProgress: (...args: unknown[]) => saveMissionProgress(...args),
}));

import { POST } from "@/app/api/mission-turn/route";

function makeRequest() {
  const form = new FormData();
  form.append("audio", new Blob([new Uint8Array([1, 2, 3])]), "turn.webm");
  form.append("course", "robotics");
  form.append("recentTurns", "[]");
  return new Request("http://localhost/api/mission-turn", { method: "POST", body: form });
}

beforeEach(() => {
  transcribeAudio.mockReset();
  generateMissionBeat.mockReset();
  synthesizeSpeech.mockReset();
  getChildIdCookie.mockReset().mockReturnValue("child-1");
  getMissionProgress.mockReset().mockResolvedValue({ rank: 1, turnsCompleted: 0 });
  saveMissionProgress.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/mission-turn", () => {
  it("returns orb text, audio, and rank progress on success, and persists the new rank", async () => {
    transcribeAudio.mockResolvedValue("A sensor detects light.");
    generateMissionBeat.mockResolvedValue({ orb_text: "Well done, Cadet.", rank_delta: 1, mission_complete: false });
    synthesizeSpeech.mockResolvedValue(Buffer.from("fake-audio"));

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(body.orb_text).toBe("Well done, Cadet.");
    expect(body.rank).toBe(2);
    expect(body.ranked_up).toBe(true);
    expect(typeof body.audio_base64).toBe("string");
    expect(saveMissionProgress).toHaveBeenCalledWith("child-1", "robotics", { rank: 2, turnsCompleted: 1 });
  });

  it("retries once then falls back in-character when the LLM call keeps failing, without advancing rank", async () => {
    transcribeAudio.mockResolvedValue("A sensor detects light.");
    generateMissionBeat.mockRejectedValue(new Error("groq down"));
    synthesizeSpeech.mockResolvedValue(Buffer.from("fake-audio"));

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(generateMissionBeat).toHaveBeenCalledTimes(2);
    expect(body.orb_text).toBe("Comms are glitchy, Cadet — say that again?");
    expect(body.audio_base64).toBeNull();
    expect(body.ranked_up).toBe(false);
    expect(body.rank).toBe(1);
    expect(saveMissionProgress).not.toHaveBeenCalled();
  });

  it("falls back when the child_id cookie is missing", async () => {
    getChildIdCookie.mockReturnValue(null);

    const response = await POST(makeRequest());
    expect(response.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/api/mission-turn.test.ts`
Expected: FAIL — route module not found.

- [ ] **Step 3: Write the mission-progress data helper**

`lib/mission/progress.ts`:
```typescript
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RankState } from "./rank";

export async function getChildIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("child_id")?.value ?? null;
}

export async function getMissionProgress(childId: string, course: string): Promise<RankState> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("mission_progress")
    .select("rank, turns_completed")
    .eq("child_id", childId)
    .eq("course", course)
    .maybeSingle();

  if (!data) {
    return { rank: 1, turnsCompleted: 0 };
  }
  return { rank: data.rank, turnsCompleted: data.turns_completed };
}

export async function saveMissionProgress(childId: string, course: string, state: RankState): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("mission_progress")
    .upsert(
      { child_id: childId, course, rank: state.rank, turns_completed: state.turnsCompleted, updated_at: new Date().toISOString() },
      { onConflict: "child_id,course" }
    );
}
```

- [ ] **Step 4: Write minimal route implementation**

`app/api/mission-turn/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/groq/stt";
import { generateMissionBeat } from "@/lib/groq/llm";
import { synthesizeSpeech } from "@/lib/groq/tts";
import { applyRankDelta } from "@/lib/mission/rank";
import { getChildIdFromCookies, getMissionProgress, saveMissionProgress } from "@/lib/mission/progress";
import type { MissionTurn } from "@/lib/mission/prompt";

const FALLBACK_TEXT = "Comms are glitchy, Cadet — say that again?";

async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fn();
  }
}

export async function POST(request: Request) {
  const childId = await getChildIdFromCookies();
  if (!childId) {
    return NextResponse.json({ error: "No active Cadet profile" }, { status: 401 });
  }

  const form = await request.formData();
  const audioFile = form.get("audio") as File;
  const course = String(form.get("course"));
  const recentTurns = JSON.parse(String(form.get("recentTurns"))) as MissionTurn[];

  const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
  const currentProgress = await getMissionProgress(childId, course);

  let orbText: string;
  let rankDelta = 0;
  let missionComplete = false;
  let audioBase64: string | null = null;
  let succeeded = false;

  try {
    const transcript = await withOneRetry(() => transcribeAudio(audioBuffer));
    const beat = await withOneRetry(() =>
      generateMissionBeat({
        course: course as "robotics",
        rank: currentProgress.rank,
        recentTurns: [...recentTurns, { role: "child", content: transcript }],
      })
    );
    orbText = beat.orb_text;
    rankDelta = beat.rank_delta;
    missionComplete = beat.mission_complete;

    const speech = await withOneRetry(() => synthesizeSpeech(orbText));
    audioBase64 = speech.toString("base64");
    succeeded = true;
  } catch {
    orbText = FALLBACK_TEXT;
    rankDelta = 0;
    missionComplete = false;
    audioBase64 = null;
  }

  const progress = succeeded
    ? applyRankDelta(currentProgress, rankDelta)
    : { ...currentProgress, rankedUp: false };

  if (succeeded) {
    await saveMissionProgress(childId, course, { rank: progress.rank, turnsCompleted: progress.turnsCompleted });
  }

  return NextResponse.json({
    orb_text: orbText,
    audio_base64: audioBase64,
    rank: progress.rank,
    ranked_up: progress.rankedUp,
    mission_complete: missionComplete,
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/api/mission-turn.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add app/api/mission-turn lib/mission/progress.ts tests/api/mission-turn.test.ts
git commit -m "feat: add mission-turn API route with server-authoritative rank persistence"
```

---

### Task 7: Parent auth pages (sign up / log in)

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`

**Interfaces:**
- Consumes: `createServerSupabaseClient` from Task 2
- Produces: `/login` route with email/password sign-up and sign-in forms; on success redirects to `/profiles`

- [ ] **Step 1: Write server actions for sign-up and sign-in**

`app/login/actions.ts`:
```typescript
"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/profiles");
}

export async function signIn(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect("/profiles");
}
```

- [ ] **Step 2: Write the login page**

`app/login/page.tsx`:
```typescript
import { signUp, signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl">Tactical Academy — Parent Access</h1>
      {error && <p className="text-[color:var(--alert-orange)]">{error}</p>}
      <form className="flex flex-col gap-3 w-full max-w-sm">
        <input name="email" type="email" placeholder="Email" required className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
        <input name="password" type="password" placeholder="Password" required minLength={8} className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
        <button formAction={signIn} className="p-2 border border-[color:var(--tactical-teal)]">Log In</button>
        <button formAction={signUp} className="p-2 border border-[color:var(--alert-orange)]">Sign Up</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual check in browser**

Run: `npm run dev`, open `http://localhost:3000/login`, confirm the form renders with Command Black background and teal-bordered inputs. Stop the dev server after.

- [ ] **Step 5: Commit**

```bash
git add app/login
git commit -m "feat: add parent sign-up and login page"
```

---

### Task 8: Child profile creation and PIN picker

**Files:**
- Create: `app/profiles/page.tsx`
- Create: `app/profiles/actions.ts`
- Create: `components/ProfilePicker.tsx`
- Create: `components/ChildProfileForm.tsx`
- Test: `tests/components/ProfilePicker.test.tsx`

**Interfaces:**
- Consumes: `createServerSupabaseClient` from Task 2, `children` table from Task 2
- Produces: `/profiles` route listing existing child profiles (`ProfilePicker`) plus a create-new-child form (`ChildProfileForm`); selecting a profile and entering the correct PIN sets a `child_id` cookie and redirects to `/mission`. `ProfilePicker` component signature: `ProfilePicker({ children }: { children: Array<{ id: string; name: string; avatar: string }> })`

- [ ] **Step 1: Write the failing component test**

`tests/components/ProfilePicker.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfilePicker } from "@/components/ProfilePicker";

describe("ProfilePicker", () => {
  it("renders one entry per child profile", () => {
    render(
      <ProfilePicker
        children={[
          { id: "1", name: "Alex", avatar: "🤖" },
          { id: "2", name: "Sam", avatar: "🚀" },
        ]}
      />
    );
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
  });

  it("shows a PIN prompt when a profile is selected", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<ProfilePicker children={[{ id: "1", name: "Alex", avatar: "🤖" }]} />);
    await user.click(screen.getByText("Alex"));
    expect(screen.getByPlaceholderText("Enter PIN")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Install user-event and run test to verify it fails**

```bash
npm install -D @testing-library/user-event
npm test -- tests/components/ProfilePicker.test.tsx
```
Expected: FAIL — module not found.

- [ ] **Step 3: Write the ProfilePicker component**

`components/ProfilePicker.tsx`:
```typescript
"use client";

import { useState } from "react";
import { selectChildProfile } from "@/app/profiles/actions";

interface ChildSummary {
  id: string;
  name: string;
  avatar: string;
}

export function ProfilePicker({ children }: { children: ChildSummary[] }) {
  const [selected, setSelected] = useState<ChildSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!selected) {
    return (
      <div className="flex gap-4 flex-wrap">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => setSelected(child)}
            className="flex flex-col items-center gap-2 p-4 border border-[color:var(--tactical-teal)]"
          >
            <span className="text-4xl">{child.avatar}</span>
            <span>{child.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <form
      action={async (formData: FormData) => {
        formData.set("childId", selected.id);
        const result = await selectChildProfile(formData);
        if (result?.error) {
          setError(result.error);
        }
      }}
      className="flex flex-col gap-3 items-center"
    >
      <p>Enter PIN for {selected.name}</p>
      <input name="pin" type="password" inputMode="numeric" placeholder="Enter PIN" className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
      {error && <p className="text-[color:var(--alert-orange)]">{error}</p>}
      <button type="submit" className="p-2 border border-[color:var(--tactical-teal)]">Confirm</button>
      <button type="button" onClick={() => setSelected(null)} className="text-sm underline">Back</button>
    </form>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/ProfilePicker.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write ChildProfileForm component**

`components/ChildProfileForm.tsx`:
```typescript
"use client";

import { createChildProfile } from "@/app/profiles/actions";

const AVATARS = ["🤖", "🚀", "🦾", "🛰️"];

export function ChildProfileForm() {
  return (
    <form action={createChildProfile} className="flex flex-col gap-3 max-w-sm">
      <input name="name" placeholder="Cadet's name" required className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
      <select name="avatar" required className="p-2 bg-black border border-[color:var(--tactical-teal)]">
        {AVATARS.map((avatar) => (
          <option key={avatar} value={avatar}>{avatar}</option>
        ))}
      </select>
      <input name="pin" type="password" inputMode="numeric" minLength={4} maxLength={6} placeholder="Set a 4-6 digit PIN" required className="p-2 bg-black border border-[color:var(--tactical-teal)]" />
      <button type="submit" className="p-2 border border-[color:var(--alert-orange)]">Create Profile</button>
    </form>
  );
}
```

- [ ] **Step 6: Install bcrypt for PIN hashing**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 7: Write server actions for profile creation and selection**

`app/profiles/actions.ts`:
```typescript
"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export async function createChildProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const name = String(formData.get("name"));
  const avatar = String(formData.get("avatar"));
  const pin = String(formData.get("pin"));

  await supabase.from("children").insert({
    parent_id: user.id,
    name,
    avatar,
    pin_hash: await hashPin(pin),
    rank: 1,
  });

  redirect("/profiles");
}

export async function selectChildProfile(formData: FormData): Promise<{ error?: string } | void> {
  const supabase = await createServerSupabaseClient();
  const childId = String(formData.get("childId"));
  const pin = String(formData.get("pin"));

  const { data: child } = await supabase.from("children").select("pin_hash").eq("id", childId).single();

  if (!child || !(await verifyPin(pin, child.pin_hash))) {
    return { error: "Incorrect PIN. Try again, Cadet." };
  }

  const cookieStore = await cookies();
  cookieStore.set("child_id", childId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/mission");
}
```

- [ ] **Step 8: Write the failing test for PIN mismatch**

`tests/profiles/selectChildProfile.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const maybeSingle = vi.fn();
const from = vi.fn(() => ({
  select: () => ({ eq: () => ({ single: maybeSingle }) }),
}));
const cookieSet = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: async () => ({ from }),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet }),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("REDIRECT");
  }),
}));

import { selectChildProfile } from "@/app/profiles/actions";
import bcrypt from "bcryptjs";

beforeEach(() => {
  maybeSingle.mockReset();
  cookieSet.mockReset();
});

describe("selectChildProfile", () => {
  it("returns an error and sets no cookie when the PIN is wrong", async () => {
    maybeSingle.mockResolvedValue({ data: { pin_hash: await bcrypt.hash("1234", 10) } });

    const form = new FormData();
    form.set("childId", "child-1");
    form.set("pin", "9999");

    const result = await selectChildProfile(form);

    expect(result?.error).toBe("Incorrect PIN. Try again, Cadet.");
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("sets the child_id cookie and redirects when the PIN is correct", async () => {
    maybeSingle.mockResolvedValue({ data: { pin_hash: await bcrypt.hash("1234", 10) } });

    const form = new FormData();
    form.set("childId", "child-1");
    form.set("pin", "1234");

    await expect(selectChildProfile(form)).rejects.toThrow("REDIRECT");
    expect(cookieSet).toHaveBeenCalledWith("child_id", "child-1", expect.objectContaining({ httpOnly: true }));
  });
});
```

- [ ] **Step 9: Run test to verify it fails, then passes**

Run: `npm test -- tests/profiles/selectChildProfile.test.ts`
Expected: FAILs first against the pre-bcrypt implementation only if run before Step 7 — since Step 7 already lands bcrypt, this should PASS, 2 tests, once Step 7's code is in place. If it fails, check that `verifyPin` is awaited and the mocked `from().select().eq().single` chain matches the actions code's query shape.

- [ ] **Step 10: Write the profiles page**

`app/profiles/page.tsx`:
```typescript
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProfilePicker } from "@/components/ProfilePicker";
import { ChildProfileForm } from "@/components/ChildProfileForm";

export default async function ProfilesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: children } = await supabase
    .from("children")
    .select("id, name, avatar")
    .eq("parent_id", user.id);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl">Select Your Cadet</h1>
      <ProfilePicker children={children ?? []} />
      <h2 className="text-lg">Add a New Cadet</h2>
      <ChildProfileForm />
    </main>
  );
}
```

- [ ] **Step 11: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 12: Commit**

```bash
git add app/profiles components/ProfilePicker.tsx components/ChildProfileForm.tsx tests/components/ProfilePicker.test.tsx tests/profiles/selectChildProfile.test.ts package.json package-lock.json
git commit -m "feat: add child profile creation and bcrypt-backed PIN picker"
```

---

### Task 9: Command Orb and mission transcript components

**Files:**
- Create: `components/CommandOrb.tsx`
- Create: `components/MissionTranscript.tsx`
- Test: `tests/components/MissionTranscript.test.tsx`

**Interfaces:**
- Produces:
  - `CommandOrb({ amplitude }: { amplitude: number })` in `components/CommandOrb.tsx` — `amplitude` is 0-1, scales the orb's visual pulse.
  - `MissionTranscript({ turns }: { turns: Array<{ role: "child" | "orb"; content: string }> })` in `components/MissionTranscript.tsx`

- [ ] **Step 1: Write the failing test for MissionTranscript**

`tests/components/MissionTranscript.test.tsx`:
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MissionTranscript } from "@/components/MissionTranscript";

describe("MissionTranscript", () => {
  it("renders each turn's content in order", () => {
    render(
      <MissionTranscript
        turns={[
          { role: "orb", content: "Cadet, report your status." },
          { role: "child", content: "All systems go." },
        ]}
      />
    );
    expect(screen.getByText("Cadet, report your status.")).toBeInTheDocument();
    expect(screen.getByText("All systems go.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/components/MissionTranscript.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write MissionTranscript component**

`components/MissionTranscript.tsx`:
```typescript
interface Turn {
  role: "child" | "orb";
  content: string;
}

export function MissionTranscript({ turns }: { turns: Turn[] }) {
  return (
    <div className="flex flex-col gap-2 max-w-xl w-full">
      {turns.map((turn, index) => (
        <p
          key={index}
          className={turn.role === "orb" ? "text-[color:var(--tactical-teal)]" : "text-[color:var(--alert-orange)]"}
        >
          {turn.role === "orb" ? "COMMANDER: " : "CADET: "}
          {turn.content}
        </p>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/components/MissionTranscript.test.tsx`
Expected: PASS.

- [ ] **Step 5: Write CommandOrb component**

`components/CommandOrb.tsx`:
```typescript
export function CommandOrb({ amplitude }: { amplitude: number }) {
  const scale = 1 + Math.min(Math.max(amplitude, 0), 1) * 0.4;

  return (
    <div
      style={{ transform: `scale(${scale})` }}
      className="w-32 h-32 rounded-full bg-[color:var(--tactical-teal)] shadow-[0_0_40px_var(--tactical-teal)] transition-transform duration-100"
    />
  );
}
```

- [ ] **Step 6: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/CommandOrb.tsx components/MissionTranscript.tsx tests/components/MissionTranscript.test.tsx
git commit -m "feat: add Command Orb and mission transcript components"
```

---

### Task 10: Mission page — wire up the voice loop

**Files:**
- Create: `app/mission/page.tsx`
- Create: `app/mission/MissionClient.tsx`
- Test: `tests/mission/MissionClient.test.tsx`

**Interfaces:**
- Consumes: `CommandOrb`, `MissionTranscript` from Task 9; `POST /api/mission-turn` from Task 6 (childId and rank are no longer sent by the client — the route derives both server-side); `createServerSupabaseClient` from Task 2; `child_id` cookie from Task 8
- Produces: `/mission` route — the playable child-facing screen. `MissionClient` supports both mouse and touch input for Hold-to-Talk, and requires a minimum 300ms hold before submitting a turn (a shorter hold is treated as an accidental tap and discarded, no request sent).

- [ ] **Step 1: Write the server page that loads the child's display name**

`app/mission/page.tsx`:
```typescript
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MissionClient } from "./MissionClient";

const COURSE = "robotics";

export default async function MissionPage() {
  const cookieStore = await cookies();
  const childId = cookieStore.get("child_id")?.value;
  if (!childId) {
    redirect("/profiles");
  }

  const supabase = await createServerSupabaseClient();
  const { data: child } = await supabase.from("children").select("id, name").eq("id", childId).single();
  if (!child) {
    redirect("/profiles");
  }

  return <MissionClient childName={child.name} course={COURSE} />;
}
```

- [ ] **Step 2: Write the failing test for the mic-denied fallback UI**

`tests/mission/MissionClient.test.tsx`:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MissionClient } from "@/app/mission/MissionClient";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    json: async () => ({ orb_text: "Acknowledged, Cadet.", audio_base64: null, rank: 1, ranked_up: false, mission_complete: false }),
  }));
});

describe("MissionClient", () => {
  it("shows tap-to-answer options when microphone access is denied", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });

    const user = userEvent.setup();
    render(<MissionClient childName="Alex" course="robotics" />);

    await user.pointer({ keys: "[MouseLeft>]", target: screen.getByText("Hold to Talk") });

    await waitFor(() => {
      expect(screen.getByText("Option A")).toBeInTheDocument();
      expect(screen.getByText("Option B")).toBeInTheDocument();
    });
  });

  it("submits a tap answer without recording audio", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });

    const user = userEvent.setup();
    render(<MissionClient childName="Alex" course="robotics" />);
    await user.pointer({ keys: "[MouseLeft>]", target: screen.getByText("Hold to Talk") });
    await waitFor(() => screen.getByText("Option A"));

    await user.click(screen.getByText("Option A"));

    await waitFor(() => {
      expect(screen.getByText("Acknowledged, Cadet.")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- tests/mission/MissionClient.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the client component driving the voice loop**

`app/mission/MissionClient.tsx`:
```typescript
"use client";

import { useRef, useState } from "react";
import { CommandOrb } from "@/components/CommandOrb";
import { MissionTranscript } from "@/components/MissionTranscript";

const MIN_HOLD_MS = 300;

interface Turn {
  role: "child" | "orb";
  content: string;
}

interface MissionTurnResponse {
  orb_text: string;
  audio_base64: string | null;
  rank: number;
  ranked_up: boolean;
  mission_complete: boolean;
}

export function MissionClient({ childName, course }: { childName: string; course: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  const [micDenied, setMicDenied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdStartedAtRef = useRef<number>(0);

  async function submitTurn(audioBlob: Blob | null, tapAnswer?: string) {
    const form = new FormData();
    form.append("audio", audioBlob ?? new Blob([]), "turn.webm");
    form.append("course", course);
    form.append("recentTurns", JSON.stringify(turns.slice(-6)));
    if (tapAnswer) {
      form.append("tapAnswer", tapAnswer);
    }

    const response = await fetch("/api/mission-turn", { method: "POST", body: form });
    const data: MissionTurnResponse = await response.json();

    setTurns((prev) => [...prev, { role: "orb", content: data.orb_text }]);
    setRank(data.rank);

    if (data.audio_base64) {
      const audio = new Audio(`data:audio/wav;base64,${data.audio_base64}`);
      audio.play();
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      holdStartedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const heldMs = Date.now() - holdStartedAtRef.current;
        if (heldMs < MIN_HOLD_MS) {
          return;
        }
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        submitTurn(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setAmplitude(0.6);
    } catch {
      setMicDenied(true);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setAmplitude(0);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-xl">Cadet {childName}{rank !== null ? ` — Rank ${rank}` : ""}</h1>
      <CommandOrb amplitude={amplitude} />
      <MissionTranscript turns={turns} />
      {micDenied ? (
        <div className="flex gap-2">
          <button onClick={() => submitTurn(null, "A")} className="p-2 border border-[color:var(--tactical-teal)]">Option A</button>
          <button onClick={() => submitTurn(null, "B")} className="p-2 border border-[color:var(--tactical-teal)]">Option B</button>
        </div>
      ) : (
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={(event) => {
            event.preventDefault();
            startRecording();
          }}
          onTouchEnd={(event) => {
            event.preventDefault();
            stopRecording();
          }}
          className="p-4 rounded-full border-2 border-[color:var(--alert-orange)]"
        >
          Hold to Talk
        </button>
      )}
    </main>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- tests/mission/MissionClient.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Manual verification of the full loop**

Requires real `.env.local` with `GROQ_API_KEY` and Supabase project credentials (apply migration from Task 2 first via `supabase db push` or the Supabase SQL editor).

Run: `npm run dev`, open `http://localhost:3000/login`, sign up, create a child profile, select it with the PIN, land on `/mission`, hold "Hold to Talk", speak, release, and confirm: transcript shows both turns, Orb pulses during recording, audio plays back the Commander's response, rank updates. Also verify on a touch device or browser device-emulation mode that touch works identically. Stop the dev server after.

- [ ] **Step 8: Commit**

```bash
git add app/mission tests/mission/MissionClient.test.tsx
git commit -m "feat: wire up mission page voice loop with touch support and min-hold guard"
```

---

### Task 11: Apply impeccable design pass

**Files:**
- Modify: `app/globals.css`, `components/CommandOrb.tsx`, `components/MissionTranscript.tsx`, `app/mission/MissionClient.tsx`, `app/login/page.tsx`, `app/profiles/page.tsx`

**Interfaces:**
- Consumes: all components from Tasks 7-10 (visual-only changes, no interface/signature changes)

- [ ] **Step 1: Invoke the impeccable skill for a design pass**

Run the `impeccable` skill against the current UI (login, profiles, mission pages) to apply the "Full Tactical" aesthetic: scanlines, HUD-mask borders, terminal-reveal typewriter effect on `MissionTranscript`, and the "System Reboot" scanline-wipe transition on rank-up (`ranked_up === true` from the mission-turn response). Follow the skill's own process for this pass — it may ask clarifying questions about density/motion before editing files.

- [ ] **Step 2: Verify no interface changes broke existing tests**

Run: `npm test`
Expected: all prior tests (Tasks 3-9) still PASS — this task is visual-only.

- [ ] **Step 3: Manual check in browser**

Run: `npm run dev`, click through login → profiles → mission, confirm scanline/terminal-reveal effects render and don't break the Hold-to-Talk interaction. Stop the dev server after.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: apply Full Tactical design pass to Cadet experience"
```
