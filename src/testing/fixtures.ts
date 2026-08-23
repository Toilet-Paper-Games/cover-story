import { buildBallots } from "../application/ballots";
import { coverStoryPrompts } from "../application/content";
import { SeededRandom } from "../application/defaults";
import type { CoordinatorSnapshot } from "../application/coordinator";
import type { RuntimeParticipantValue } from "../application/ports";
import type { CoverStoryState, PlayerIntentEnvelope, PlayerSummary } from "../domain/model";
import { applyInternalCommand, applyPlayerIntent, createInitialState } from "../domain/transition";

const names = ["Mina", "Theo", "Jun", "Bea", "Omar", "Liv", "Rafi", "Kit"];

export function playerFixtures(count: number): PlayerSummary[] {
  return names.slice(0, count).map((name, index) => ({ id: `p${index + 1}`, name, connected: true }));
}

export const players = {
  minimum: playerFixtures(3),
  typical: playerFixtures(5),
  maximum: playerFixtures(8)
};

const covers = [
  "The fountain needed a warmer personality before the inspectors arrived.",
  "Someone finally upgraded municipal water to include lunch.",
  "The pigeons had controlled downtown dining for long enough.",
  "It was the only reasonable response to an aggressively boring postcard.",
  "Tourists kept asking for local flavor, so we became very literal.",
  "The emergency committee misunderstood the phrase liquid assets.",
  "A tiny parade required an unexpectedly large bowl.",
  "It solved three problems and created only nine new ones."
];

function internal(state: CoverStoryState, command: Parameters<typeof applyInternalCommand>[1]) {
  const result = applyInternalCommand(state, command);
  if (result.status === "rejected") throw new Error(result.reason);
  return result.state;
}

function roundBase(count: number, roundNumber = 1): CoverStoryState {
  let state = createInitialState("fixture-session", playerFixtures(count), 1_000);
  state = internal(state, { kind: "show-instructions", deadlineAt: 16_000 });
  if (roundNumber > 1) {
    state = {
      ...state,
      phase: "next-round",
      roundNumber: roundNumber - 1,
      deadlineAt: 2_000
    };
  }
  const random = new SeededRandom(101 + roundNumber);
  const content = coverStoryPrompts.forRound(roundNumber, random);
  const assignments = Object.fromEntries(
    state.roster.map((player, index) => [player.id, content.angles[index]!])
  );
  return internal(state, {
    kind: "begin-round",
    roundId: `round-${roundNumber}`,
    roundNumber,
    incident: content.incident,
    assignments,
    anglePool: content.angles,
    deadlineAt: 8_000
  });
}

function writing(count: number, roundNumber = 1): CoverStoryState {
  return internal(roundBase(count, roundNumber), { kind: "open-writing", deadlineAt: 61_000 });
}

function coverIntent(state: CoverStoryState, playerId: string, index: number): PlayerIntentEnvelope {
  return {
    id: `answer-${state.roundNumber}-${playerId}`,
    expectedPhase: "writing",
    expectedSequence: state.sequence,
    issuedAt: 4_000 + index,
    roundId: state.roundId,
    payload: { kind: "submit-cover", text: covers[index]! }
  };
}

function withCovers(state: CoverStoryState, amount = state.roster.length): CoverStoryState {
  for (const [index, player] of state.roster.slice(0, amount).entries()) {
    const result = applyPlayerIntent(
      state,
      { actorId: player.id, actorRole: "controller", now: 4_000 + index },
      coverIntent(state, player.id, index)
    );
    state = result.state;
  }
  return state;
}

function voting(count: number, roundNumber = 1): CoverStoryState {
  let state = withCovers(writing(count, roundNumber));
  return internal(state, {
    kind: "open-voting",
    ballots: buildBallots(state, new SeededRandom(90)),
    deadlineAt: 41_000
  });
}

function withVotes(state: CoverStoryState): CoverStoryState {
  for (const [index, player] of state.roster.entries()) {
    const ballot = state.ballots[player.id];
    if (!ballot) continue;
    const target = Object.values(state.submissions).find(
      (answer) => answer.id === ballot.decodeAnswerId
    );
    const correctAngle = target ? state.assignments[target.authorId] : undefined;
    const result = applyPlayerIntent(
      state,
      { actorId: player.id, actorRole: "controller", now: 5_000 + index },
      {
        id: `vote-${state.roundNumber}-${player.id}`,
        expectedPhase: "voting",
        expectedSequence: state.sequence,
        issuedAt: 5_000 + index,
        roundId: state.roundId,
        payload: {
          kind: "submit-ballot",
          decodeAnswerId: ballot.decodeAnswerId,
          angleGuessId: correctAngle?.id ?? ballot.angleOptions[0]!.id,
          favoriteAnswerId: ballot.favoriteAnswerIds[0]!
        }
      }
    );
    state = result.state;
  }
  return state;
}

function results(count: number, roundNumber = 1): CoverStoryState {
  return internal(withVotes(voting(count, roundNumber)), { kind: "close-voting", deadlineAt: 19_000 });
}

export const stateFactories = {
  lobby: (count = 5) => createInitialState("fixture-session", playerFixtures(count), 1_000),
  instructions: (count = 5) => internal(createInitialState("fixture-session", playerFixtures(count), 1_000), { kind: "show-instructions", deadlineAt: 16_000 }),
  roundIntro: (count = 5, round = 1) => roundBase(count, round),
  writing: (count = 5, round = 1) => writing(count, round),
  waiting: (count = 5, round = 1) => withCovers(writing(count, round), count - 1),
  voting: (count = 5, round = 1) => voting(count, round),
  results: (count = 5, round = 1) => results(count, round),
  nextRound: (count = 5, round = 1) => internal(results(count, round), { kind: "show-next-round", deadlineAt: 6_000 }),
  reconnect: (count = 5) => ({
    ...writing(count, 2),
    roster: playerFixtures(count).map((player, index) => ({ ...player, connected: index !== 1 }))
  }),
  finale: (count = 5) => internal({ ...results(count, 3), roundNumber: 3 }, { kind: "show-finale" })
};

export type ScenarioName = keyof typeof stateFactories;

export function scenarioSnapshot(
  scenario: ScenarioName,
  options: { count?: number; playerId?: string; authority?: boolean; surface?: "controller" | "host-display" | "spectator" } = {}
): CoordinatorSnapshot {
  const count = options.count ?? 5;
  const fixtureState = stateFactories[scenario](count);
  const state = fixtureState.deadlineAt === null
    ? fixtureState
    : { ...fixtureState, deadlineAt: Date.now() + 30_000 };
  const surface = options.surface ?? "controller";
  const participantId = surface === "controller"
    ? options.playerId ?? (scenario === "reconnect" ? "p2" : "p1")
    : undefined;
  const runtimePlayers: RuntimeParticipantValue[] = state.roster.map((player) => ({ ...player, role: "controller" }));
  return {
    state,
    sharedRevision: state.sequence + 1,
    participants: runtimePlayers,
    context: {
      surfaceKind: surface,
      participantId,
      authorityParticipantId: options.authority ? participantId : "p1",
      isAuthority: Boolean(options.authority),
      roomId: "fixture-room"
    },
    lifecycle: scenario === "reconnect" ? "players-loading" : "started",
    ownPlayerState: undefined,
    ownPlayerRevision: 0,
    playerStates: {},
    playerWritePending: false,
    lastError: null
  };
}
