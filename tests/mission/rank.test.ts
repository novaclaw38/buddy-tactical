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
