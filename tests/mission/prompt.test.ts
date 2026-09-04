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
