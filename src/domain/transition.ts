import {
  GAME_SCHEMA_VERSION,
  TOTAL_ROUNDS,
  emptyScore,
  type Angle,
  type CoverStoryPhase,
  type CoverStoryState,
  type DomainParticipantRole,
  type Incident,
  type IntentReceipt,
  type IntentRejectionReason,
  type PlayerBallot,
  type PlayerIntentEnvelope,
  type PlayerSummary
} from "./model";
import { scoreRound } from "./scoring";

export type {
  CoverStoryState,
  PlayerIntentEnvelope,
  PlayerIntentState
} from "./model";

export interface PlayerIntentContext {
  actorId: string;
  actorRole: DomainParticipantRole;
  now: number;
}

export type PlayerTransitionResult =
  | { status: "applied"; state: CoverStoryState }
  | { status: "duplicate"; state: CoverStoryState }
  | { status: "rejected"; state: CoverStoryState; reason: IntentRejectionReason };

export type InternalCommand =
  | { kind: "show-instructions"; deadlineAt: number }
  | {
      kind: "begin-round";
      roundId: string;
      roundNumber: number;
      incident: Incident;
      assignments: Record<string, Angle>;
      anglePool: Angle[];
      deadlineAt: number;
    }
  | { kind: "open-writing"; deadlineAt: number }
  | { kind: "open-voting"; ballots: Record<string, PlayerBallot>; deadlineAt: number }
  | { kind: "close-voting"; deadlineAt: number }
  | { kind: "show-next-round"; deadlineAt: number }
  | { kind: "show-finale" }
  | { kind: "sync-roster"; roster: PlayerSummary[] };

export type InternalTransitionResult =
  | { status: "applied"; state: CoverStoryState }
  | { status: "rejected"; state: CoverStoryState; reason: string };

export function createInitialState(
  sessionId: string,
  roster: PlayerSummary[],
  _now: number
): CoverStoryState {
  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    sessionId,
    sequence: 0,
    phase: "lobby",
    deadlineAt: null,
    totalRounds: TOTAL_ROUNDS,
    roundNumber: 0,
    roundId: null,
    roster: roster.map((player) => ({ ...player })),
    acknowledgedPlayerIds: [],
    incident: null,
    assignments: {},
    anglePool: [],
    submissions: {},
    ballots: {},
    votes: {},
    receipts: {},
    scores: Object.fromEntries(roster.map((player) => [player.id, emptyScore()])),
    lastRoundResults: null
  };
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeCover(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function withReceipt(
  state: CoverStoryState,
  actorId: string,
  receipt: IntentReceipt
): CoverStoryState {
  return {
    ...state,
    sequence: state.sequence + 1,
    receipts: {
      ...state.receipts,
      [actorId]: receipt
    }
  };
}

function reject(
  state: CoverStoryState,
  context: PlayerIntentContext,
  intent: PlayerIntentEnvelope,
  reason: IntentRejectionReason
): PlayerTransitionResult {
  return {
    status: "rejected",
    reason,
    state: withReceipt(state, context.actorId, {
      intentId: intent.id,
      status: "rejected",
      reason,
      confirmedAt: context.now
    })
  };
}

function validateEnvelope(
  state: CoverStoryState,
  context: PlayerIntentContext,
  intent: PlayerIntentEnvelope
): PlayerTransitionResult | undefined {
  const previousReceipt = state.receipts[context.actorId];
  if (previousReceipt?.intentId === intent.id) {
    return { status: "duplicate", state };
  }
  if (context.actorRole !== "controller") {
    return reject(state, context, intent, "not-a-controller");
  }
  if (!state.roster.some((player) => player.id === context.actorId)) {
    return reject(state, context, intent, "not-in-round");
  }
  if (intent.expectedSequence > state.sequence) {
    return reject(state, context, intent, "future-sequence");
  }
  if (intent.expectedPhase !== state.phase) {
    return reject(state, context, intent, "phase-closed");
  }
  if (intent.roundId !== state.roundId) {
    return reject(state, context, intent, "stale-round");
  }
  return undefined;
}

export function applyPlayerIntent(
  state: CoverStoryState,
  context: PlayerIntentContext,
  intent: PlayerIntentEnvelope
): PlayerTransitionResult {
  const envelopeFailure = validateEnvelope(state, context, intent);
  if (envelopeFailure) {
    return envelopeFailure;
  }

  if (intent.payload.kind === "acknowledge-instructions") {
    if (state.phase !== "instructions") {
      return reject(state, context, intent, "phase-closed");
    }
    const acknowledgedPlayerIds = state.acknowledgedPlayerIds.includes(context.actorId)
      ? state.acknowledgedPlayerIds
      : [...state.acknowledgedPlayerIds, context.actorId];
    return {
      status: "applied",
      state: {
        ...withReceipt(state, context.actorId, {
          intentId: intent.id,
          status: "accepted",
          confirmedAt: context.now
        }),
        acknowledgedPlayerIds
      }
    };
  }

  if (intent.payload.kind === "submit-cover") {
    if (state.phase !== "writing") {
      return reject(state, context, intent, "phase-closed");
    }
    if (state.submissions[context.actorId]) {
      return reject(state, context, intent, "already-submitted");
    }

    const text = normalizeCover(intent.payload.text);
    const length = Array.from(text).length;
    if (length < 3) {
      return reject(state, context, intent, "cover-too-short");
    }
    if (length > 140) {
      return reject(state, context, intent, "cover-too-long");
    }
    const assignment = state.assignments[context.actorId];
    if (!assignment) {
      return reject(state, context, intent, "invalid-motive");
    }
    if (normalizeText(text).includes(normalizeText(assignment.label))) {
      return reject(state, context, intent, "motive-revealed");
    }
    if (
      Object.values(state.submissions).some(
        (submission) => normalizeText(submission.text) === normalizeText(text)
      )
    ) {
      return reject(state, context, intent, "duplicate-cover");
    }

    return {
      status: "applied",
      state: {
        ...withReceipt(state, context.actorId, {
          intentId: intent.id,
          status: "accepted",
          confirmedAt: context.now
        }),
        submissions: {
          ...state.submissions,
          [context.actorId]: {
            id: intent.id,
            authorId: context.actorId,
            text,
            submittedAt: context.now
          }
        }
      }
    };
  }

  if (state.phase !== "voting") {
    return reject(state, context, intent, "phase-closed");
  }
  if (intent.payload.kind !== "submit-ballot") {
    return reject(state, context, intent, "phase-closed");
  }
  const ballotPayload = intent.payload;
  if (state.votes[context.actorId]) {
    return reject(state, context, intent, "already-voted");
  }
  const ballot = state.ballots[context.actorId];
  if (!ballot || ballot.decodeAnswerId !== ballotPayload.decodeAnswerId) {
    return reject(state, context, intent, "invalid-decode");
  }
  if (!ballot.angleOptions.some((angle) => angle.id === ballotPayload.angleGuessId)) {
    return reject(state, context, intent, "invalid-motive");
  }
  if (!ballot.favoriteAnswerIds.includes(ballotPayload.favoriteAnswerId)) {
    return reject(state, context, intent, "invalid-favorite");
  }
  const favorite = Object.values(state.submissions).find(
    (submission) => submission.id === ballotPayload.favoriteAnswerId
  );
  if (!favorite || favorite.authorId === context.actorId) {
    return reject(state, context, intent, "invalid-favorite");
  }

  return {
    status: "applied",
    state: {
      ...withReceipt(state, context.actorId, {
        intentId: intent.id,
        status: "accepted",
        confirmedAt: context.now
      }),
      votes: {
        ...state.votes,
        [context.actorId]: {
          id: intent.id,
          voterId: context.actorId,
          decodeAnswerId: ballotPayload.decodeAnswerId,
          angleGuessId: ballotPayload.angleGuessId,
          favoriteAnswerId: ballotPayload.favoriteAnswerId,
          submittedAt: context.now
        }
      }
    }
  };
}

function nextState(
  state: CoverStoryState,
  phase: CoverStoryPhase,
  updates: Partial<CoverStoryState>
): CoverStoryState {
  return {
    ...state,
    ...updates,
    phase,
    sequence: state.sequence + 1
  };
}

export function applyInternalCommand(
  state: CoverStoryState,
  command: InternalCommand
): InternalTransitionResult {
  if (command.kind === "sync-roster") {
    const scores = { ...state.scores };
    for (const player of command.roster) {
      scores[player.id] ??= emptyScore();
    }
    return {
      status: "applied",
      state: nextState(state, state.phase, { roster: command.roster, scores })
    };
  }

  if (command.kind === "show-instructions") {
    if (state.phase !== "lobby") {
      return { status: "rejected", state, reason: "Instructions require the lobby phase." };
    }
    return {
      status: "applied",
      state: nextState(state, "instructions", {
        deadlineAt: command.deadlineAt,
        acknowledgedPlayerIds: [],
        receipts: {}
      })
    };
  }

  if (command.kind === "begin-round") {
    if (!(["instructions", "next-round"] as CoverStoryPhase[]).includes(state.phase)) {
      return { status: "rejected", state, reason: "A round cannot begin from this phase." };
    }
    return {
      status: "applied",
      state: nextState(state, "round-intro", {
        roundId: command.roundId,
        roundNumber: command.roundNumber,
        incident: command.incident,
        assignments: command.assignments,
        anglePool: command.anglePool,
        deadlineAt: command.deadlineAt,
        submissions: {},
        ballots: {},
        votes: {},
        lastRoundResults: null
      })
    };
  }

  if (command.kind === "open-writing") {
    if (state.phase !== "round-intro") {
      return { status: "rejected", state, reason: "Writing requires a round intro." };
    }
    return {
      status: "applied",
      state: nextState(state, "writing", { deadlineAt: command.deadlineAt })
    };
  }

  if (command.kind === "open-voting") {
    if (state.phase !== "writing") {
      return { status: "rejected", state, reason: "Voting requires writing." };
    }
    return {
      status: "applied",
      state: nextState(state, "voting", {
        ballots: command.ballots,
        votes: {},
        deadlineAt: command.deadlineAt
      })
    };
  }

  if (command.kind === "close-voting") {
    if (state.phase !== "voting") {
      return { status: "rejected", state, reason: "Results require voting." };
    }
    const { results, scores } = scoreRound(state);
    return {
      status: "applied",
      state: nextState(state, "results", {
        deadlineAt: command.deadlineAt,
        scores,
        lastRoundResults: results
      })
    };
  }

  if (command.kind === "show-next-round") {
    if (state.phase !== "results" || state.roundNumber >= state.totalRounds) {
      return { status: "rejected", state, reason: "No next round is available." };
    }
    return {
      status: "applied",
      state: nextState(state, "next-round", { deadlineAt: command.deadlineAt })
    };
  }

  if (state.phase !== "results" || state.roundNumber < state.totalRounds) {
    return { status: "rejected", state, reason: "The finale requires the last result." };
  }
  return {
    status: "applied",
    state: nextState(state, "finale", { deadlineAt: null })
  };
}
