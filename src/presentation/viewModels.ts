import type { CoordinatorSnapshot } from "../application/coordinator";
import type {
  Angle,
  CoverStoryPhase,
  CoverSubmission,
  PlayerBallot,
  PlayerScore,
  PlayerSummary,
  RoundResults
} from "../domain/model";

export interface ScoreRow extends PlayerSummary, PlayerScore {
  rank: number;
}

export interface PublicViewModel {
  phase: CoverStoryPhase | "connecting";
  eyebrow: string;
  title: string;
  subtitle: string;
  roundLabel: string;
  countdownAt: number | null;
  players: PlayerSummary[];
  submittedCount: number;
  expectedCount: number;
  results: RoundResults | null;
  scoreboard: ScoreRow[];
  incident: string | null;
}

export interface ControllerViewModel extends PublicViewModel {
  playerId?: string;
  playerName: string;
  isAuthority: boolean;
  isReconnecting: boolean;
  isLateJoiner: boolean;
  assignment: Angle | null;
  ballot: PlayerBallot | null;
  submissions: Record<string, CoverSubmission>;
  hasSubmittedCover: boolean;
  hasSubmittedVote: boolean;
  instructionsAcknowledged: boolean;
  writePending: boolean;
  rejection: string | null;
  personalResult: {
    correct: boolean;
    guessed: string;
    actual: string;
    roundPoints: number;
  } | null;
}

const phaseCopy: Record<CoverStoryPhase, { eyebrow: string; title: string; subtitle: string }> = {
  lobby: {
    eyebrow: "The yearbook room",
    title: "Class picture pending",
    subtitle: "Join on your phone. Three cover artists are needed to start."
  },
  instructions: {
    eyebrow: "How to play",
    title: "Make the unbelievable sound reasonable",
    subtitle: "Write a cover. Decode someone else's motive. Crown your favorite."
  },
  "round-intro": {
    eyebrow: "Breaking school news",
    title: "A fresh incident just made the yearbook",
    subtitle: "Your private motive is waiting on your controller."
  },
  writing: {
    eyebrow: "Anonymous statements",
    title: "Everyone has an explanation",
    subtitle: "Write one sentence without naming your exact motive."
  },
  voting: {
    eyebrow: "Read between the lines",
    title: "Decode and crown",
    subtitle: "Match one cover to its motive, then choose the best cover story."
  },
  results: {
    eyebrow: "Permanent record",
    title: "The truth comes out",
    subtitle: "Detectives score. Clever clues score when decoded. Favorites score biggest."
  },
  "next-round": {
    eyebrow: "Turn the page",
    title: "Another incident is developing",
    subtitle: "New story. New private motive. Same questionable judgment."
  },
  finale: {
    eyebrow: "Senior superlatives",
    title: "The cover story class of this room",
    subtitle: "The permanent record is now extremely permanent."
  }
};

function scoreboard(snapshot: CoordinatorSnapshot): ScoreRow[] {
  const state = snapshot.state;
  if (!state) return [];
  return state.roster
    .map((player) => ({ ...player, ...(state.scores[player.id] ?? zeroScore()), rank: 0 }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name))
    .map((player, index) => ({ ...player, rank: index + 1 }));
}

function zeroScore(): PlayerScore {
  return { score: 0, favoriteVotes: 0, correctDecodes: 0, decodedByOthers: 0 };
}

export function buildPublicViewModel(snapshot: CoordinatorSnapshot): PublicViewModel {
  const state = snapshot.state;
  if (!state) {
    return {
      phase: "connecting",
      eyebrow: "Cover Story",
      title: "Opening the yearbook",
      subtitle: "The room is connecting to the class archive.",
      roundLabel: "Preparing room",
      countdownAt: null,
      players: snapshot.participants.filter((player) => player.role === "controller"),
      submittedCount: 0,
      expectedCount: 0,
      results: null,
      scoreboard: [],
      incident: null
    };
  }
  const copy = phaseCopy[state.phase];
  const lobbyReady = state.phase === "lobby" && state.roster.length >= 3;
  const submittedCount =
    state.phase === "voting" ? Object.keys(state.votes).length : Object.keys(state.submissions).length;
  return {
    phase: state.phase,
    ...copy,
    ...(lobbyReady
      ? {
          title: "Class picture ready",
          subtitle: "The room director starts the game from their controller."
        }
      : {}),
    roundLabel:
      state.phase === "lobby" || state.phase === "instructions"
        ? `${state.roster.length} / 8 players`
        : `Round ${state.roundNumber} of ${state.totalRounds}`,
    countdownAt: state.deadlineAt,
    players: state.roster,
    submittedCount,
    expectedCount: state.roster.filter((player) => player.connected).length,
    results: state.lastRoundResults,
    scoreboard: scoreboard(snapshot),
    incident: state.incident?.text ?? null
  };
}

export function buildControllerViewModel(snapshot: CoordinatorSnapshot): ControllerViewModel {
  const publicView = buildPublicViewModel(snapshot);
  const state = snapshot.state;
  const playerId = snapshot.context.participantId;
  const ownReceipt = playerId && state ? state.receipts[playerId] : undefined;
  const rosterPlayer = playerId && state ? state.roster.find((player) => player.id === playerId) : undefined;
  const ownVote = playerId && state ? state.votes[playerId] : undefined;
  const decodedAnswer = ownVote
    ? state?.lastRoundResults?.answers.find((answer) => answer.answerId === ownVote.decodeAnswerId)
    : undefined;
  const guessedAngle = ownVote
    ? state?.anglePool.find((angle) => angle.id === ownVote.angleGuessId)
    : undefined;
  return {
    ...publicView,
    playerId,
    playerName:
      snapshot.participants.find((player) => player.id === playerId)?.name ?? "Cover artist",
    isAuthority: snapshot.context.isAuthority,
    isReconnecting:
      snapshot.lifecycle === "players-loading" ||
      snapshot.lifecycle === "paused" ||
      Boolean(rosterPlayer && !rosterPlayer.connected),
    isLateJoiner: Boolean(
      state &&
        playerId &&
        !rosterPlayer &&
        state.phase !== "lobby" &&
        state.phase !== "instructions"
    ),
    assignment: playerId && state ? state.assignments[playerId] ?? null : null,
    ballot: playerId && state ? state.ballots[playerId] ?? null : null,
    submissions: state?.submissions ?? {},
    hasSubmittedCover: Boolean(playerId && state?.submissions[playerId]),
    hasSubmittedVote: Boolean(playerId && state?.votes[playerId]),
    instructionsAcknowledged: Boolean(
      playerId && state?.acknowledgedPlayerIds.includes(playerId)
    ),
    writePending: snapshot.playerWritePending,
    rejection:
      ownReceipt?.status === "rejected"
        ? rejectionCopy(ownReceipt.reason)
        : snapshot.lastError,
    personalResult:
      playerId && ownVote && decodedAnswer && guessedAngle && state?.lastRoundResults
        ? {
            correct: decodedAnswer.angle.id === guessedAngle.id,
            guessed: guessedAngle.label,
            actual: decodedAnswer.angle.label,
            roundPoints: state.lastRoundResults.roundPoints[playerId] ?? 0
          }
        : null
  };
}

function rejectionCopy(reason?: string): string {
  const copy: Record<string, string> = {
    "already-submitted": "Your first cover is locked in for this round.",
    "already-voted": "Your ballot is already in the yearbook office.",
    "cover-too-short": "Give the cover a little more detail.",
    "cover-too-long": "Keep the cover to 140 characters.",
    "duplicate-cover": "That cover matches another answer. Make it yours.",
    "future-sequence": "The room changed before that action arrived. Try again.",
    "invalid-decode": "That cover is no longer on your ballot.",
    "invalid-favorite": "Choose a different eligible favorite.",
    "invalid-motive": "Choose one of the motives on your ballot.",
    "motive-revealed": "Hint at your motive without writing its exact words.",
    "not-a-controller": "Only a controller can submit.",
    "not-in-round": "You joined after this round began. You can play next round.",
    "phase-closed": "That page has already turned.",
    "stale-round": "That answer belonged to an earlier round."
  };
  return reason ? copy[reason] ?? reason : "That action could not be accepted.";
}
