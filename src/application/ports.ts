import type {
  CoverStoryState,
  DomainParticipantRole,
  PlayerIntentState,
  PlayerSummary
} from "../domain/model";

export interface RevisionedValue<T> {
  value: T | undefined;
  revision: number;
}

export type MutationResult =
  | { status: "applied"; revision: number }
  | { status: "accepted"; revision?: number }
  | {
      status: "rejected";
      reason: "not-authority" | "not-owner" | "stale-revision" | "invalid-request";
      revision: number;
      message: string;
    };

export interface RuntimeContextValue {
  surfaceKind: DomainParticipantRole;
  participantId?: string;
  authorityParticipantId?: string;
  isAuthority: boolean;
  roomId: string;
}

export interface RuntimeParticipantValue extends PlayerSummary {
  role: DomainParticipantRole;
}

export interface RuntimePort {
  context(): RuntimeContextValue;
  participants(): RuntimeParticipantValue[];
  sharedState(): RevisionedValue<CoverStoryState>;
  ownPlayerState(): RevisionedValue<PlayerIntentState>;
  writeSharedState(value: CoverStoryState, expectedRevision: number): Promise<MutationResult>;
  writeOwnPlayerState(value: PlayerIntentState, expectedRevision: number): Promise<MutationResult>;
  subscribeSharedState(
    listener: (snapshot: RevisionedValue<CoverStoryState>) => void
  ): () => void;
  subscribePlayerState(
    listener: (participantId: string, snapshot: RevisionedValue<PlayerIntentState>) => void
  ): () => void;
  subscribeParticipants(listener: (participants: RuntimeParticipantValue[]) => void): () => void;
  subscribeContext(listener: (context: RuntimeContextValue) => void): () => void;
  subscribeLifecycle(listener: (lifecycle: string) => void): () => void;
  reportReady(): Promise<void>;
  openSettings(): Promise<void>;
  returnToLobby(): Promise<void>;
  reportAnalytics(event: {
    type: "milestone.reached" | "round.completed" | "outcome.recorded";
    name: string;
    dimensions?: Record<string, string | number | boolean>;
    metrics?: Record<string, number>;
  }): Promise<void>;
}

export interface ClockPort {
  now(): number;
  setTimer(callback: () => void, delayMs: number): unknown;
  clearTimer(timer: unknown): void;
}

export interface RandomPort {
  next(): number;
}

export interface IdGeneratorPort {
  next(prefix: string): string;
}

export interface PromptRoundContent {
  incident: { id: string; text: string };
  angles: Array<{ id: string; label: string }>;
}

export interface PromptContentPort {
  forRound(roundNumber: number, random: RandomPort): PromptRoundContent;
}

export interface AnalyticsPort {
  report(event: Parameters<RuntimePort["reportAnalytics"]>[0]): Promise<void>;
}

export interface SoundPort {
  play(effect: "round-start" | "voting-open" | "results" | "finale"): void;
}
