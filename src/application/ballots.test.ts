import { describe, expect, it } from "vitest";

import { SeededRandom } from "./defaults";
import { buildBallots } from "./ballots";
import { stateFactories } from "../testing/fixtures";

describe("ballot assignment", () => {
  it("balances decode targets while excluding every player's own answer", () => {
    const state = stateFactories.voting(8);
    const targetCounts: Record<string, number> = {};
    const favoriteExposure: Record<string, number> = {};

    for (const player of state.roster) {
      const ballot = state.ballots[player.id]!;
      const target = Object.values(state.submissions).find(
        (submission) => submission.id === ballot.decodeAnswerId
      )!;
      expect(target.authorId).not.toBe(player.id);
      expect(
        ballot.favoriteAnswerIds.every((answerId) =>
          Object.values(state.submissions).some(
            (submission) => submission.id === answerId && submission.authorId !== player.id
          )
        )
      ).toBe(true);
      for (const answerId of ballot.favoriteAnswerIds) {
        favoriteExposure[answerId] = (favoriteExposure[answerId] ?? 0) + 1;
      }
      targetCounts[target.id] = (targetCounts[target.id] ?? 0) + 1;
    }

    const counts = Object.values(targetCounts);
    expect(Object.keys(targetCounts)).toHaveLength(8);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    const exposure = Object.values(favoriteExposure);
    expect(Object.keys(favoriteExposure)).toHaveLength(8);
    expect(Math.max(...exposure) - Math.min(...exposure)).toBeLessThanOrEqual(1);
  });

  it("is deterministic for a seeded random source", () => {
    const state = stateFactories.waiting(5);
    const first = buildBallots(state, new SeededRandom(9));
    const second = buildBallots(state, new SeededRandom(9));
    expect(first).toEqual(second);
    expect(Object.keys(state.submissions)).toHaveLength(4);
  });
});
