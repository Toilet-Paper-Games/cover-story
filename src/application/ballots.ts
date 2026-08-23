import type { Angle, CoverStoryState, CoverSubmission, PlayerBallot, PlayerSummary } from "../domain/model";
import type { RandomPort } from "./ports";

export function shuffle<T>(values: readonly T[], random: RandomPort): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random.next() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex]!, result[index]!];
  }
  return result;
}

function angleChoices(correct: Angle, pool: Angle[], random: RandomPort): Angle[] {
  const decoys = shuffle(
    pool.filter((angle) => angle.id !== correct.id),
    random
  ).slice(0, 2);
  return shuffle([correct, ...decoys], random);
}

function assignDecodeTargets(
  players: PlayerSummary[],
  answers: CoverSubmission[]
): Record<string, CoverSubmission> {
  const assignments: Record<string, CoverSubmission> = {};
  const playerByAnswer: Record<string, string> = {};

  function assignUnique(player: PlayerSummary, visited: Set<string>): boolean {
    for (const answer of answers) {
      if (answer.authorId === player.id || visited.has(answer.id)) continue;
      visited.add(answer.id);
      const currentPlayerId = playerByAnswer[answer.id];
      const currentPlayer = players.find((candidate) => candidate.id === currentPlayerId);
      if (!currentPlayer || assignUnique(currentPlayer, visited)) {
        assignments[player.id] = answer;
        playerByAnswer[answer.id] = player.id;
        return true;
      }
    }
    return false;
  }

  for (const player of players) {
    assignUnique(player, new Set());
  }

  const use = Object.fromEntries(answers.map((answer) => [answer.id, 0]));
  for (const answer of Object.values(assignments)) use[answer.id] += 1;
  for (const player of players) {
    if (assignments[player.id]) continue;
    const fallback = answers
      .filter((answer) => answer.authorId !== player.id)
      .sort((left, right) => use[left.id]! - use[right.id]!)[0];
    if (fallback) {
      assignments[player.id] = fallback;
      use[fallback.id] += 1;
    }
  }
  return assignments;
}

function assignFavoriteCandidates(
  players: PlayerSummary[],
  answers: CoverSubmission[],
  count: number
): Record<string, string[]> {
  const answerByAuthor = Object.fromEntries(answers.map((answer) => [answer.authorId, answer]));
  if (answers.length === players.length && players.every((player) => answerByAuthor[player.id])) {
    return Object.fromEntries(
      players.map((player, index) => [
        player.id,
        Array.from({ length: count }, (_, offset) => {
          const candidate = players[(index + offset + 1) % players.length]!;
          return answerByAuthor[candidate.id]!.id;
        })
      ])
    );
  }
  const use = Object.fromEntries(answers.map((answer) => [answer.id, 0]));
  const candidates: Record<string, string[]> = {};
  for (const player of players) {
    const selected = answers
      .filter((answer) => answer.authorId !== player.id)
      .sort((left, right) => use[left.id]! - use[right.id]!)
      .slice(0, count);
    candidates[player.id] = selected.map((answer) => answer.id);
    for (const answer of selected) use[answer.id] += 1;
  }
  return candidates;
}

export function buildBallots(
  state: CoverStoryState,
  random: RandomPort
): Record<string, PlayerBallot> {
  const answers = shuffle(Object.values(state.submissions), random);
  const players = shuffle(state.roster, random);
  const ballots: Record<string, PlayerBallot> = {};
  const decodeTargets = assignDecodeTargets(players, answers);
  const favoriteCandidates = assignFavoriteCandidates(players, answers, Math.min(3, answers.length - 1));

  for (const player of players) {
    const eligible = answers.filter((answer) => answer.authorId !== player.id);
    const target = decodeTargets[player.id];
    if (!target) {
      continue;
    }
    const correct = state.assignments[target.authorId];
    if (!correct) {
      continue;
    }
    ballots[player.id] = {
      decodeAnswerId: target.id,
      angleOptions: angleChoices(correct, state.anglePool, random),
      favoriteAnswerIds: shuffle(favoriteCandidates[player.id] ?? [], random)
    };
  }

  return ballots;
}
