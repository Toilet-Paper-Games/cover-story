import { escapeHtml } from "@tpgames/game-kit";

import type { PublicViewModel, ScoreRow } from "./viewModels";

export const html = escapeHtml;

export function statusStrip(view: PublicViewModel): string {
  const disconnected = view.players.filter((player) => !player.connected).length;
  return `<div class="status-strip" aria-label="Room status">
    <span>${html(view.roundLabel)}</span>
    ${view.phase === "lobby" ? "" : `<span>${view.players.length} classmate${view.players.length === 1 ? "" : "s"}</span>`}
    ${disconnected ? `<span>${disconnected} reconnecting</span>` : ""}
  </div>`;
}

export function scoreRows(rows: ScoreRow[], compact = false): string {
  return `<ol class="scoreboard${compact ? " scoreboard--compact" : ""}">
    ${rows
      .map(
        (row) => `<li class="score-row">
          <span class="rank">${row.rank}</span>
          <span class="score-name">${html(row.name)}${row.connected ? "" : " · reconnecting"}</span>
          <strong>${row.score}</strong>
        </li>`
      )
      .join("")}
  </ol>`;
}

export function progressDots(view: PublicViewModel): string {
  if (view.expectedCount === 0) return "";
  const percentage = Math.round((view.submittedCount / view.expectedCount) * 100);
  return `<div class="submission-progress" aria-label="${view.submittedCount} of ${view.expectedCount} submitted">
    <div class="progress-score"><strong>${view.submittedCount}</strong><span>of ${view.expectedCount}<br/>locked in</span></div>
    <div class="dot-row">${Array.from({ length: view.expectedCount }, (_, index) =>
      `<span class="progress-dot${index < view.submittedCount ? " is-filled" : ""}"></span>`
    ).join("")}</div>
    <div class="progress-track" aria-hidden="true"><span style="width:${percentage}%"></span></div>
    <p>${view.submittedCount === view.expectedCount ? "Everybody’s in!" : "Waiting on the rest of the class…"}</p>
  </div>`;
}

export function countdown(deadlineAt: number | null): string {
  if (deadlineAt === null) return "";
  return `<p class="countdown" role="timer" aria-live="off" data-deadline="${deadlineAt}">—</p>`;
}
