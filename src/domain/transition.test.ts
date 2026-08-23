import { describe, expect, it } from "vitest";

import {
  applyInternalCommand,
  applyPlayerIntent,
  createInitialState,
  type CoverStoryState,
  type PlayerIntentEnvelope
} from "./transition";

const roster = [
  { id: "p1", name: "Avery", connected: true },
  { id: "p2", name: "Blake", connected: true },
  { id: "p3", name: "Casey", connected: true }
];

function writingState(): CoverStoryState {
  const initial = createInitialState("session-1", roster, 1_000);
  const instructions = applyInternalCommand(initial, {
    kind: "show-instructions",
    deadlineAt: 10_000
  }).state;
  const intro = applyInternalCommand(instructions, {
    kind: "begin-round",
    roundId: "round-1",
    roundNumber: 1,
    incident: { id: "soup", text: "The town fountain is now soup." },
    assignments: {
      p1: { id: "ghost", label: "impress a ghost" },
      p2: { id: "budget", label: "budget cuts" },
      p3: { id: "pigeons", label: "revenge on pigeons" }
    },
    anglePool: [
      { id: "ghost", label: "impress a ghost" },
      { id: "budget", label: "budget cuts" },
      { id: "pigeons", label: "revenge on pigeons" },
      { id: "tourism", label: "boost tourism" }
    ],
    deadlineAt: 12_000
  }).state;
  return applyInternalCommand(intro, {
    kind: "open-writing",
    deadlineAt: 72_000
  }).state;
}

function coverIntent(
  state: CoverStoryState,
  id: string,
  text: string,
  overrides: Partial<PlayerIntentEnvelope> = {}
): PlayerIntentEnvelope {
  return {
    id,
    expectedPhase: "writing",
    expectedSequence: state.sequence,
    issuedAt: 2_000,
    roundId: "round-1",
    payload: { kind: "submit-cover", text },
    ...overrides
  };
}

describe("cover submission policy", () => {
  it("locks the first valid cover and handles duplicates, rewrites, motive leaks, and stale rounds", () => {
    const state = writingState();
    const first = applyPlayerIntent(
      state,
      { actorId: "p1", actorRole: "controller", now: 2_100 },
      coverIntent(state, "intent-1", "The soup was a peace offering to the basement ghost.")
    );

    expect(first.status).toBe("applied");
    expect(first.state.submissions.p1?.text).toBe(
      "The soup was a peace offering to the basement ghost."
    );

    const duplicate = applyPlayerIntent(
      first.state,
      { actorId: "p1", actorRole: "controller", now: 2_200 },
      coverIntent(first.state, "intent-1", "Changed text")
    );
    expect(duplicate.status).toBe("duplicate");
    expect(duplicate.state).toBe(first.state);

    const rewrite = applyPlayerIntent(
      first.state,
      { actorId: "p1", actorRole: "controller", now: 2_300 },
      coverIntent(first.state, "intent-2", "A completely different cover story")
    );
    expect(rewrite.status).toBe("rejected");
    expect(rewrite.status === "rejected" ? rewrite.reason : undefined).toBe("already-submitted");

    const leak = applyPlayerIntent(
      state,
      { actorId: "p1", actorRole: "controller", now: 2_400 },
      coverIntent(state, "intent-3", "I did it to impress a ghost")
    );
    expect(leak.status).toBe("rejected");
    expect(leak.status === "rejected" ? leak.reason : undefined).toBe("motive-revealed");

    const stale = applyPlayerIntent(
      state,
      { actorId: "p2", actorRole: "controller", now: 2_500 },
      coverIntent(state, "intent-4", "It was legally classified as plumbing.", {
        roundId: "round-0"
      })
    );
    expect(stale.status).toBe("rejected");
    expect(stale.status === "rejected" ? stale.reason : undefined).toBe("stale-round");
  });
});

describe("ballot policy and scoring", () => {
  it("rejects self-voting and awards favorite, detective, and readable-cover points", () => {
    let state = writingState();
    for (const [actorId, text] of [
      ["p1", "The soup was a peace offering to the basement ghost."],
      ["p2", "Water funding was moved to a more delicious department."],
      ["p3", "The pigeons had controlled the fountain for long enough."]
    ] as const) {
      const applied = applyPlayerIntent(
        state,
        { actorId, actorRole: "controller", now: 3_000 },
        coverIntent(state, `cover-${actorId}`, text)
      );
      expect(applied.status).toBe("applied");
      state = applied.state;
    }

    state = applyInternalCommand(state, {
      kind: "open-voting",
      deadlineAt: 50_000,
      ballots: {
        p1: {
          decodeAnswerId: "cover-p2",
          angleOptions: [
            { id: "budget", label: "budget cuts" },
            { id: "ghost", label: "impress a ghost" },
            { id: "pigeons", label: "revenge on pigeons" }
          ],
          favoriteAnswerIds: ["cover-p2", "cover-p3"]
        },
        p2: {
          decodeAnswerId: "cover-p3",
          angleOptions: [
            { id: "pigeons", label: "revenge on pigeons" },
            { id: "budget", label: "budget cuts" },
            { id: "ghost", label: "impress a ghost" }
          ],
          favoriteAnswerIds: ["cover-p1", "cover-p3"]
        },
        p3: {
          decodeAnswerId: "cover-p1",
          angleOptions: [
            { id: "ghost", label: "impress a ghost" },
            { id: "budget", label: "budget cuts" },
            { id: "pigeons", label: "revenge on pigeons" }
          ],
          favoriteAnswerIds: ["cover-p1", "cover-p2"]
        }
      }
    }).state;

    const selfVote = applyPlayerIntent(
      state,
      { actorId: "p1", actorRole: "controller", now: 4_000 },
      {
        id: "vote-self",
        expectedPhase: "voting",
        expectedSequence: state.sequence,
        issuedAt: 4_000,
        roundId: "round-1",
        payload: {
          kind: "submit-ballot",
          decodeAnswerId: "cover-p2",
          angleGuessId: "budget",
          favoriteAnswerId: "cover-p1"
        }
      }
    );
    expect(selfVote.status).toBe("rejected");
    expect(selfVote.status === "rejected" ? selfVote.reason : undefined).toBe("invalid-favorite");

    const ballots = [
      ["p1", "cover-p2", "budget", "cover-p3"],
      ["p2", "cover-p3", "pigeons", "cover-p1"],
      ["p3", "cover-p1", "ghost", "cover-p1"]
    ] as const;
    for (const [actorId, decodeAnswerId, angleGuessId, favoriteAnswerId] of ballots) {
      const voted = applyPlayerIntent(
        state,
        { actorId, actorRole: "controller", now: 4_500 },
        {
          id: `vote-${actorId}`,
          expectedPhase: "voting",
          expectedSequence: state.sequence,
          issuedAt: 4_500,
          roundId: "round-1",
          payload: {
            kind: "submit-ballot",
            decodeAnswerId,
            angleGuessId,
            favoriteAnswerId
          }
        }
      );
      expect(voted.status).toBe("applied");
      state = voted.state;
    }

    const results = applyInternalCommand(state, {
      kind: "close-voting",
      deadlineAt: 70_000
    }).state;

    expect(results.phase).toBe("results");
    expect(results.scores.p1).toMatchObject({
      score: 300,
      correctDecodes: 1,
      decodedByOthers: 1,
      favoriteVotes: 2
    });
    expect(results.scores.p2.score).toBe(100);
    expect(results.scores.p3.score).toBe(200);
    expect(results.lastRoundResults?.answers.find((answer) => answer.authorId === "p1")?.pointsEarned).toBe(240);
  });
});

describe("durable intent receipts", () => {
  it("keeps accepted intent ids idempotent after phase and round transitions", () => {
    let state = writingState();
    const original = coverIntent(
      state,
      "durable-cover",
      "The fountain was reassigned to the municipal lunch department."
    );
    const accepted = applyPlayerIntent(
      state,
      { actorId: "p1", actorRole: "controller", now: 3_000 },
      original
    );
    expect(accepted.status).toBe("applied");
    state = accepted.state;

    const voting = applyInternalCommand(state, {
      kind: "open-voting",
      ballots: {},
      deadlineAt: 8_000
    });
    expect(voting.status).toBe("applied");
    const replay = applyPlayerIntent(
      voting.state,
      { actorId: "p1", actorRole: "controller", now: 3_500 },
      original
    );
    expect(replay.status).toBe("duplicate");
    expect(replay.state).toBe(voting.state);
  });
});
