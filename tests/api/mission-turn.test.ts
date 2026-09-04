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
