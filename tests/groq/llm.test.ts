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
