import {
  emptyScore,
  type AnswerResult,
  type CoverStoryState,
  type PlayerScore,
  type RoundResults
} from "./model";

function addPoints(
  scores: Record<string, PlayerScore>,
  roundPoints: Record<string, number>,
  playerId: string,
  points: number
) {
  const score = scores[playerId];
  if (!score) {
    return;
  }
  score.score += points;
  roundPoints[playerId] = (roundPoints[playerId] ?? 0) + points;
}

export function scoreRound(state: CoverStoryState): {
  scores: Record<string, PlayerScore>;
  results: RoundResults;
} {
  if (!state.incident) {
    throw new Error("Cannot score a round without an incident.");
  }

  const scores = Object.fromEntries(
    state.roster.map((player) => [player.id, { ...(state.scores[player.id] ?? emptyScore()) }])
  );
  const roundPoints = Object.fromEntries(state.roster.map((player) => [player.id, 0]));
  const favoriteVotesByAnswer: Record<string, number> = {};
  const decodedByAnswer: Record<string, string[]> = {};
  const submissionsById = Object.fromEntries(
    Object.values(state.submissions).map((submission) => [submission.id, submission])
  );

  for (const vote of Object.values(state.votes)) {
    const favorite = submissionsById[vote.favoriteAnswerId];
    if (favorite) {
      addPoints(scores, roundPoints, favorite.authorId, 100);
      scores[favorite.authorId]!.favoriteVotes += 1;
      favoriteVotesByAnswer[favorite.id] = (favoriteVotesByAnswer[favorite.id] ?? 0) + 1;
    }

    const decoded = submissionsById[vote.decodeAnswerId];
    const correctAngle = decoded ? state.assignments[decoded.authorId] : undefined;
    if (decoded && correctAngle?.id === vote.angleGuessId) {
      addPoints(scores, roundPoints, vote.voterId, 60);
      scores[vote.voterId]!.correctDecodes += 1;
      addPoints(scores, roundPoints, decoded.authorId, 40);
      scores[decoded.authorId]!.decodedByOthers += 1;
      decodedByAnswer[decoded.id] = [...(decodedByAnswer[decoded.id] ?? []), vote.voterId];
    }
  }

  const answers: AnswerResult[] = Object.values(state.submissions).map((submission) => {
    const author = state.roster.find((player) => player.id === submission.authorId);
    const angle = state.assignments[submission.authorId];
    if (!angle) {
      throw new Error(`Missing angle assignment for ${submission.authorId}.`);
    }
    return {
      answerId: submission.id,
      authorId: submission.authorId,
      authorName: author?.name ?? "Player",
      text: submission.text,
      angle,
      favoriteVotes: favoriteVotesByAnswer[submission.id] ?? 0,
      decodedByPlayerIds: decodedByAnswer[submission.id] ?? [],
      pointsEarned:
        (favoriteVotesByAnswer[submission.id] ?? 0) * 100 +
        (decodedByAnswer[submission.id]?.length ?? 0) * 40
    };
  });

  return {
    scores,
    results: {
      roundNumber: state.roundNumber,
      incident: state.incident,
      answers,
      roundPoints
    }
  };
}
