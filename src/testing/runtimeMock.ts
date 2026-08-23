import type {
  MutationResult,
  RevisionedValue,
  RuntimeContextValue,
  RuntimeParticipantValue,
  RuntimePort
} from "../application/ports";
import type { CoverStoryState, PlayerIntentState } from "../domain/model";

type SharedListener = Parameters<RuntimePort["subscribeSharedState"]>[0];
type PlayerListener = Parameters<RuntimePort["subscribePlayerState"]>[0];
type ParticipantListener = Parameters<RuntimePort["subscribeParticipants"]>[0];
type ContextListener = Parameters<RuntimePort["subscribeContext"]>[0];
type LifecycleListener = Parameters<RuntimePort["subscribeLifecycle"]>[0];

export class RecordingRuntimeMock implements RuntimePort {
  sharedWrites: Array<{ value: CoverStoryState; expectedRevision: number }> = [];
  playerWrites: Array<{ value: PlayerIntentState; expectedRevision: number }> = [];
  messages: Array<{ type: string; payload: unknown }> = [];
  rejections: MutationResult[] = [];
  analytics: Array<Parameters<RuntimePort["reportAnalytics"]>[0]> = [];
  teardownCount = 0;
  readyCount = 0;
  settingsCount = 0;
  lobbyCount = 0;
  autoEcho = true;
  rejectNextShared?: MutationResult;
  rejectNextPlayer?: MutationResult;

  private shared: RevisionedValue<CoverStoryState>;
  private readonly playerValues = new Map<string, RevisionedValue<PlayerIntentState>>();
  private contextValue: RuntimeContextValue;
  private participantValues: RuntimeParticipantValue[];
  private lifecycleValue = "boot";
  private sharedListeners = new Set<SharedListener>();
  private playerListeners = new Set<PlayerListener>();
  private participantListeners = new Set<ParticipantListener>();
  private contextListeners = new Set<ContextListener>();
  private lifecycleListeners = new Set<LifecycleListener>();

  constructor(options: {
    state?: CoverStoryState;
    participants?: RuntimeParticipantValue[];
    context?: Partial<RuntimeContextValue>;
  } = {}) {
    this.shared = { value: options.state, revision: options.state ? 1 : 0 };
    this.participantValues = options.participants ?? [];
    this.contextValue = {
      surfaceKind: "host-display",
      isAuthority: true,
      roomId: "mock-room",
      ...options.context
    };
  }

  context() { return this.contextValue; }
  participants() { return this.participantValues; }
  sharedState() { return this.shared; }
  ownPlayerState() {
    const participantId = this.contextValue.participantId ?? "";
    return this.playerValues.get(participantId) ?? { value: undefined, revision: 0 };
  }

  async writeSharedState(value: CoverStoryState, expectedRevision: number) {
    this.sharedWrites.push({ value, expectedRevision });
    if (this.rejectNextShared) return this.consumeRejection("shared");
    if (expectedRevision !== this.shared.revision) {
      return this.rejected("stale-revision", this.shared.revision, "Shared revision is stale.");
    }
    const result: MutationResult = { status: "applied", revision: expectedRevision + 1 };
    if (this.autoEcho) this.emitShared(value, result.revision);
    return result;
  }

  async writeOwnPlayerState(value: PlayerIntentState, expectedRevision: number) {
    this.playerWrites.push({ value, expectedRevision });
    if (this.rejectNextPlayer) return this.consumeRejection("player");
    const participantId = this.contextValue.participantId;
    if (!participantId) return this.rejected("not-owner", expectedRevision, "No controller owner.");
    const current = this.playerValues.get(participantId)?.revision ?? 0;
    if (expectedRevision !== current) return this.rejected("stale-revision", current, "Player revision is stale.");
    const result: MutationResult = { status: "applied", revision: current + 1 };
    if (this.autoEcho) this.emitPlayer(participantId, value, result.revision);
    return result;
  }

  subscribeSharedState(listener: SharedListener) { this.sharedListeners.add(listener); return this.unsubscribe(this.sharedListeners, listener); }
  subscribePlayerState(listener: PlayerListener) { this.playerListeners.add(listener); return this.unsubscribe(this.playerListeners, listener); }
  subscribeParticipants(listener: ParticipantListener) { this.participantListeners.add(listener); return this.unsubscribe(this.participantListeners, listener); }
  subscribeContext(listener: ContextListener) { this.contextListeners.add(listener); return this.unsubscribe(this.contextListeners, listener); }
  subscribeLifecycle(listener: LifecycleListener) { this.lifecycleListeners.add(listener); return this.unsubscribe(this.lifecycleListeners, listener); }

  async reportReady() { this.readyCount += 1; }
  async openSettings() { this.settingsCount += 1; }
  async returnToLobby() { this.lobbyCount += 1; }
  async reportAnalytics(event: Parameters<RuntimePort["reportAnalytics"]>[0]) { this.analytics.push(event); }

  emitShared(value: CoverStoryState | undefined, revision = this.shared.revision + 1) {
    this.shared = { value, revision };
    for (const listener of this.sharedListeners) listener(this.shared);
  }

  emitPlayer(participantId: string, value: PlayerIntentState | undefined, revision = 1) {
    const snapshot = { value, revision };
    this.playerValues.set(participantId, snapshot);
    for (const listener of this.playerListeners) listener(participantId, snapshot);
  }

  emitParticipants(participants: RuntimeParticipantValue[]) {
    this.participantValues = participants;
    for (const listener of this.participantListeners) listener(participants);
  }

  emitContext(context: RuntimeContextValue) {
    this.contextValue = context;
    for (const listener of this.contextListeners) listener(context);
  }

  emitLifecycle(lifecycle: string) {
    this.lifecycleValue = lifecycle;
    for (const listener of this.lifecycleListeners) listener(lifecycle);
  }

  disposeSubscriptions() {
    this.sharedListeners.clear();
    this.playerListeners.clear();
    this.participantListeners.clear();
    this.contextListeners.clear();
    this.lifecycleListeners.clear();
    this.teardownCount += 1;
  }

  private unsubscribe<T>(set: Set<T>, value: T) {
    return () => { set.delete(value); this.teardownCount += 1; };
  }

  private rejected(reason: "stale-revision" | "not-owner", revision: number, message: string): MutationResult {
    const result: MutationResult = { status: "rejected", reason, revision, message };
    this.rejections.push(result);
    return result;
  }

  private consumeRejection(kind: "shared" | "player") {
    const result = kind === "shared" ? this.rejectNextShared! : this.rejectNextPlayer!;
    if (kind === "shared") this.rejectNextShared = undefined;
    else this.rejectNextPlayer = undefined;
    this.rejections.push(result);
    return result;
  }
}
