export const GAME_SCHEMA_VERSION = 1 as const;
export const TOTAL_ROUNDS = 3;

export type CoverStoryPhase =
  | "lobby"
  | "instructions"
  | "round-intro"
  | "writing"
  | "voting"
  | "results"
  | "next-round"
  | "finale";

export type DomainParticipantRole = "controller" | "host-display" | "spectator" | "logic";

export interface PlayerSummary {
  id: string;
  name: string;
  connected: boolean;
}

export interface Incident {
  id: string;
  text: string;
}

export interface Angle {
  id: string;
  label: string;
}

export interface CoverSubmission {
  id: string;
  authorId: string;
  text: string;
  submittedAt: number;
}

export interface PlayerBallot {
  decodeAnswerId: string;
  angleOptions: Angle[];
  favoriteAnswerIds: string[];
}

export interface VoteSubmission {
  id: string;
  voterId: string;
  decodeAnswerId: string;
  angleGuessId: string;
  favoriteAnswerId: string;
  submittedAt: number;
}

export type IntentRejectionReason =
  | "already-submitted"
  | "already-voted"
  | "cover-too-short"
  | "cover-too-long"
  | "duplicate-cover"
  | "future-sequence"
  | "invalid-decode"
  | "invalid-favorite"
  | "invalid-motive"
  | "motive-revealed"
  | "not-a-controller"
  | "not-in-round"
  | "phase-closed"
  | "stale-round";

export interface IntentReceipt {
  intentId: string;
  status: "accepted" | "rejected";
  reason?: IntentRejectionReason;
  confirmedAt: number;
}

export interface PlayerScore {
  score: number;
  favoriteVotes: number;
  correctDecodes: number;
  decodedByOthers: number;
}

export interface AnswerResult {
  answerId: string;
  authorId: string;
  authorName: string;
  text: string;
  angle: Angle;
  favoriteVotes: number;
  decodedByPlayerIds: string[];
  pointsEarned: number;
}

export interface RoundResults {
  roundNumber: number;
  incident: Incident;
  answers: AnswerResult[];
  roundPoints: Record<string, number>;
}

export interface CoverStoryState {
  schemaVersion: typeof GAME_SCHEMA_VERSION;
  sessionId: string;
  sequence: number;
  phase: CoverStoryPhase;
  deadlineAt: number | null;
  totalRounds: number;
  roundNumber: number;
  roundId: string | null;
  roster: PlayerSummary[];
  acknowledgedPlayerIds: string[];
  incident: Incident | null;
  assignments: Record<string, Angle>;
  anglePool: Angle[];
  submissions: Record<string, CoverSubmission>;
  ballots: Record<string, PlayerBallot>;
  votes: Record<string, VoteSubmission>;
  receipts: Record<string, IntentReceipt>;
  scores: Record<string, PlayerScore>;
  lastRoundResults: RoundResults | null;
}

export interface PlayerIntentState {
  pendingIntent?: PlayerIntentEnvelope;
}

export interface PlayerIntentEnvelope {
  id: string;
  expectedPhase: CoverStoryPhase;
  expectedSequence: number;
  issuedAt: number;
  roundId: string | null;
  payload:
    | { kind: "acknowledge-instructions" }
    | { kind: "submit-cover"; text: string }
    | {
        kind: "submit-ballot";
        decodeAnswerId: string;
        angleGuessId: string;
        favoriteAnswerId: string;
      };
}

export function emptyScore(): PlayerScore {
  return {
    score: 0,
    favoriteVotes: 0,
    correctDecodes: 0,
    decodedByOthers: 0
  };
}

