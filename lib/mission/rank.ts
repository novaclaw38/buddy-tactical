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
