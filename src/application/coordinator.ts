import { buildBallots, shuffle } from "./ballots";
import { SeededRandom, hashSeed, silentSound } from "./defaults";
import type {
  ClockPort,
  IdGeneratorPort,
  MutationResult,
  PromptContentPort,
  RandomPort,
  RuntimeContextValue,
  RuntimeParticipantValue,
  RuntimePort,
  SoundPort
} from "./ports";
import type {
  CoverStoryState,
  PlayerIntentEnvelope,
  PlayerIntentState,
  PlayerSummary
} from "../domain/model";
import {
  applyInternalCommand,
  applyPlayerIntent,
  createInitialState,
  type InternalCommand
} from "../domain/transition";

export const PHASE_DURATIONS = {
  instructions: 15_000,
  roundIntro: 7_000,
  writing: 60_000,
  voting: 40_000,
  results: 18_000,
  nextRound: 5_000
} as const;

export interface CoordinatorSnapshot {
  state: CoverStoryState | undefined;
  sharedRevision: number;
  participants: RuntimeParticipantValue[];
  context: RuntimeContextValue;
  lifecycle: string;
  ownPlayerState: PlayerIntentState | undefined;
  ownPlayerRevision: number;
  playerStates: Record<string, PlayerIntentState>;
  playerWritePending: boolean;
  lastError: string | null;
}

export interface CoordinatorDependencies {
  runtime: RuntimePort;
  clock: ClockPort;
  random: RandomPort;
  ids: IdGeneratorPort;
  prompts: PromptContentPort;
  sound?: SoundPort;
}

export type CoordinatorActionResult =
  | MutationResult
  | { status: "rejected"; reason: "not-controller" | "not-ready"; message: string };

type SnapshotListener = (snapshot: CoordinatorSnapshot) => void;

function controllerRoster(participants: RuntimeParticipantValue[]): PlayerSummary[] {
  return participants
    .filter((participant) => participant.role === "controller")
    .slice(0, 8)
    .map(({ connected, id, name }) => ({ connected, id, name }));
}

function rosterForState(
  state: CoverStoryState,
  participants: RuntimeParticipantValue[]
): PlayerSummary[] {
  const liveControllers = controllerRoster(participants);
  if (state.phase === "lobby" || state.phase === "instructions") {
    return liveControllers;
  }
  return state.roster.map((player) => ({
    ...player,
    connected: liveControllers.find((candidate) => candidate.id === player.id)?.connected ?? false
  }));
}

function sameRoster(left: PlayerSummary[], right: PlayerSummary[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export class GameCoordinator {
  private readonly runtime: RuntimePort;
  private readonly clock: ClockPort;
  private readonly random: RandomPort;
  private readonly ids: IdGeneratorPort;
  private readonly prompts: PromptContentPort;
  private readonly sound: SoundPort;
  private readonly listeners = new Set<SnapshotListener>();
  private readonly unsubscribers: Array<() => void> = [];
  private snapshotValue: CoordinatorSnapshot;
  private timer: unknown;
  private disposed = false;
  private commitInFlight = false;
  private driveQueued = false;
  private readyReported = false;

  constructor(dependencies: CoordinatorDependencies) {
    this.runtime = dependencies.runtime;
    this.clock = dependencies.clock;
    this.random = dependencies.random;
    this.ids = dependencies.ids;
    this.prompts = dependencies.prompts;
    this.sound = dependencies.sound ?? silentSound;
    const shared = this.runtime.sharedState();
    const own = this.runtime.ownPlayerState();
    this.snapshotValue = {
      state: shared.value,
      sharedRevision: shared.revision,
      participants: this.runtime.participants(),
      context: this.runtime.context(),
      lifecycle: "boot",
      ownPlayerState: own.value,
      ownPlayerRevision: own.revision,
      playerStates: {},
      playerWritePending: false,
      lastError: null
    };
  }

  start(): void {
    this.unsubscribers.push(
      this.runtime.subscribeSharedState((shared) => {
        this.commitInFlight = false;
        this.patch({ state: shared.value, sharedRevision: shared.revision, lastError: null });
        this.requestDrive();
      }),
      this.runtime.subscribePlayerState((participantId, playerState) => {
        const playerStates = {
          ...this.snapshotValue.playerStates,
          ...(playerState.value ? { [participantId]: playerState.value } : {})
        };
        const isOwn = participantId === this.snapshotValue.context.participantId;
        this.patch({
          playerStates,
          ...(isOwn
            ? {
                ownPlayerState: playerState.value,
                ownPlayerRevision: playerState.revision,
                playerWritePending: false
              }
            : {})
        });
        this.requestDrive();
      }),
      this.runtime.subscribeParticipants((participants) => {
        this.patch({ participants });
        this.requestDrive();
      }),
      this.runtime.subscribeContext((context) => {
        this.patch({ context });
        this.requestDrive();
      }),
      this.runtime.subscribeLifecycle((lifecycle) => {
        this.patch({ lifecycle });
        this.requestDrive();
      })
    );

    if (!this.readyReported) {
      this.readyReported = true;
      void this.runtime.reportReady();
    }
    this.requestDrive();
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.clearPhaseTimer();
    for (const unsubscribe of this.unsubscribers.splice(0)) {
      unsubscribe();
    }
    this.listeners.clear();
  }

  snapshot(): CoordinatorSnapshot {
    return this.snapshotValue;
  }

  subscribe(listener: SnapshotListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshotValue);
    return () => {
      this.listeners.delete(listener);
    };
  }

  acknowledgeInstructions(): Promise<CoordinatorActionResult> {
    return this.submitIntent({ kind: "acknowledge-instructions" });
  }

  submitCover(text: string): Promise<CoordinatorActionResult> {
    return this.submitIntent({ kind: "submit-cover", text });
  }

  submitBallot(input: {
    decodeAnswerId: string;
    angleGuessId: string;
    favoriteAnswerId: string;
  }): Promise<CoordinatorActionResult> {
    return this.submitIntent({ kind: "submit-ballot", ...input });
  }

  openSettings(): Promise<void> {
    if (
      this.snapshotValue.context.surfaceKind !== "controller" ||
      !this.snapshotValue.context.isAuthority
    ) {
      return Promise.resolve();
    }
    return this.runtime.openSettings();
  }

  returnToLobby(): Promise<void> {
    if (
      this.snapshotValue.context.surfaceKind !== "controller" ||
      !this.snapshotValue.context.isAuthority
    ) {
      return Promise.resolve();
    }
    return this.runtime.returnToLobby();
  }

  private async submitIntent(
    payload: PlayerIntentEnvelope["payload"]
  ): Promise<CoordinatorActionResult> {
    const { context, state } = this.snapshotValue;
    if (context.surfaceKind !== "controller" || !context.participantId) {
      return {
        status: "rejected",
        reason: "not-controller",
        message: "Only a controller can submit a player intent."
      };
    }
    if (!state) {
      return {
        status: "rejected",
        reason: "not-ready",
        message: "The room is still preparing the game."
      };
    }

    const pendingIntent: PlayerIntentEnvelope = {
      id: this.ids.next(payload.kind),
      expectedPhase: state.phase,
      expectedSequence: state.sequence,
      issuedAt: this.clock.now(),
      roundId: state.roundId,
      payload
    };
    const value: PlayerIntentState = { pendingIntent };
    this.patch({ playerWritePending: true, lastError: null });
    const result = await this.runtime.writeOwnPlayerState(value, this.snapshotValue.ownPlayerRevision);
    if (result.status === "rejected") {
      this.patch({ playerWritePending: false, lastError: result.message });
    }
    return result;
  }

  private patch(updates: Partial<CoordinatorSnapshot>) {
    this.snapshotValue = { ...this.snapshotValue, ...updates };
    for (const listener of this.listeners) {
      listener(this.snapshotValue);
    }
  }

  private requestDrive() {
    if (this.driveQueued || this.disposed) {
      return;
    }
    this.driveQueued = true;
    queueMicrotask(() => {
      this.driveQueued = false;
      void this.drive();
    });
  }

  private async drive() {
    if (this.disposed) {
      return;
    }
    this.clearPhaseTimer();
    if (!this.snapshotValue.context.isAuthority || this.commitInFlight) {
      return;
    }

    const state = this.snapshotValue.state;
    if (!state) {
      const initial = createInitialState(
        this.ids.next("session"),
        controllerRoster(this.snapshotValue.participants),
        this.clock.now()
      );
      await this.commit(initial);
      return;
    }

    const nextRoster = rosterForState(state, this.snapshotValue.participants);
    if (!sameRoster(state.roster, nextRoster)) {
      await this.applyInternal({ kind: "sync-roster", roster: nextRoster });
      return;
    }

    for (const [participantId, playerState] of Object.entries(this.snapshotValue.playerStates)) {
      const intent = playerState.pendingIntent;
      if (!intent || state.receipts[participantId]?.intentId === intent.id) {
        continue;
      }
      const participant = this.snapshotValue.participants.find(
        (candidate) => candidate.id === participantId
      );
      const transition = applyPlayerIntent(
        state,
        {
          actorId: participantId,
          actorRole: participant?.role ?? "spectator",
          now: this.clock.now()
        },
        intent
      );
      if (transition.status !== "duplicate") {
        await this.commit(transition.state);
        return;
      }
    }

    const now = this.clock.now();
    const deadlineReached = state.deadlineAt !== null && now >= state.deadlineAt;
    const connectedIds = state.roster.filter((player) => player.connected).map((player) => player.id);

    if (
      state.phase === "lobby" &&
      this.snapshotValue.lifecycle === "started" &&
      connectedIds.length >= 3
    ) {
      await this.applyInternal({
        kind: "show-instructions",
        deadlineAt: now + PHASE_DURATIONS.instructions
      });
      return;
    }

    if (
      state.phase === "instructions" &&
      (deadlineReached ||
        (connectedIds.length >= 3 &&
          connectedIds.every((playerId) => state.acknowledgedPlayerIds.includes(playerId))))
    ) {
      await this.beginRound(state.roundNumber + 1);
      return;
    }

    if (state.phase === "round-intro" && deadlineReached) {
      this.sound.play("round-start");
      await this.applyInternal({
        kind: "open-writing",
        deadlineAt: now + PHASE_DURATIONS.writing
      });
      return;
    }

    const submittedIds = Object.keys(state.submissions);
    if (
      state.phase === "writing" &&
      (deadlineReached ||
        (connectedIds.length >= 2 && connectedIds.every((playerId) => submittedIds.includes(playerId))))
    ) {
      this.sound.play("voting-open");
      await this.applyInternal({
        kind: "open-voting",
        ballots: buildBallots(state, this.random),
        deadlineAt: now + PHASE_DURATIONS.voting + (state.roster.length >= 7 ? 10_000 : 0)
      });
      return;
    }

    const eligibleVoters = Object.keys(state.ballots).filter((playerId) =>
      connectedIds.includes(playerId)
    );
    if (
      state.phase === "voting" &&
      (deadlineReached || eligibleVoters.every((playerId) => Boolean(state.votes[playerId])))
    ) {
      this.sound.play("results");
      await this.applyInternal({
        kind: "close-voting",
        deadlineAt: now + PHASE_DURATIONS.results + (state.roster.length >= 7 ? 7_000 : 0)
      });
      return;
    }

    if (state.phase === "results" && deadlineReached) {
      if (state.roundNumber >= state.totalRounds) {
        this.sound.play("finale");
        await this.applyInternal({ kind: "show-finale" });
      } else {
        await this.applyInternal({
          kind: "show-next-round",
          deadlineAt: now + PHASE_DURATIONS.nextRound
        });
      }
      return;
    }

    if (state.phase === "next-round" && deadlineReached) {
      await this.beginRound(state.roundNumber + 1);
      return;
    }

    this.schedulePhaseTimer(state.deadlineAt);
  }

  private async beginRound(roundNumber: number) {
    const state = this.snapshotValue.state;
    if (!state) {
      return;
    }
    const content = this.prompts.forRound(roundNumber, this.random);
    const assignedAngles = shuffle(content.angles, this.random).slice(0, state.roster.length);
    const assignments = Object.fromEntries(
      state.roster.map((player, index) => [player.id, assignedAngles[index] ?? content.angles[0]!])
    );
    await this.applyInternal({
      kind: "begin-round",
      roundId: this.ids.next("round"),
      roundNumber,
      incident: content.incident,
      assignments,
      anglePool: content.angles,
      deadlineAt: this.clock.now() + PHASE_DURATIONS.roundIntro
    });
  }

  private async applyInternal(command: InternalCommand) {
    const state = this.snapshotValue.state;
    if (!state) {
      return;
    }
    const transition = applyInternalCommand(state, command);
    if (transition.status === "rejected") {
      this.patch({ lastError: transition.reason });
      return;
    }
    const result = await this.commit(transition.state);
    if (result?.status !== "rejected" && command.kind === "close-voting") {
      await this.runtime.reportAnalytics({
        type: "round.completed",
        name: "cover-story-round-completed",
        dimensions: { round: state.roundNumber },
        metrics: {
          submissions: Object.keys(state.submissions).length,
          votes: Object.keys(state.votes).length
        }
      });
    }
  }

  private async commit(nextState: CoverStoryState): Promise<MutationResult | undefined> {
    this.commitInFlight = true;
    const result = await this.runtime.writeSharedState(
      nextState,
      this.snapshotValue.sharedRevision
    );
    if (result.status === "rejected") {
      this.commitInFlight = false;
      if (result.reason !== "stale-revision") {
        this.patch({ lastError: result.message });
      }
      this.requestDrive();
    }
    return result;
  }

  private schedulePhaseTimer(deadlineAt: number | null) {
    if (deadlineAt === null || !this.snapshotValue.context.isAuthority) {
      return;
    }
    this.timer = this.clock.setTimer(
      () => this.requestDrive(),
      Math.max(0, deadlineAt - this.clock.now())
    );
  }

  private clearPhaseTimer() {
    if (this.timer === undefined) {
      return;
    }
    this.clock.clearTimer(this.timer);
    this.timer = undefined;
  }
}

export function createCoordinatorRandom(sessionId: string): RandomPort {
  return new SeededRandom(hashSeed(sessionId));
}
