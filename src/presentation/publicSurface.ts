import type { GameCoordinator } from "../application/coordinator";
import { countdown, html, progressDots, scoreRows, statusStrip, surfaceAssetPath } from "./dom";
import { buildPublicViewModel, type PublicViewModel } from "./viewModels";

const logoUrl = surfaceAssetPath("cover-story-logo.png");
const stageTextureUrl = surfaceAssetPath("comic-stage-texture.png");

export class PublicSurfaceRenderer {
  private unsubscribe?: () => void;
  private ticker?: number;
  private currentView?: PublicViewModel;
  private resultsPage = 0;
  private resultsRound = 0;
  private resultsPageChangedAt = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly mode: "host" | "spectator"
  ) {}

  connect(coordinator: GameCoordinator) {
    this.unsubscribe = coordinator.subscribe((snapshot) => this.render(buildPublicViewModel(snapshot)));
    this.ticker = window.setInterval(() => this.updateCountdown(), 250);
  }

  dispose() {
    this.unsubscribe?.();
    if (this.ticker !== undefined) window.clearInterval(this.ticker);
  }

  private render(view: PublicViewModel) {
    this.currentView = view;
    if (view.phase === "results" && view.results?.roundNumber !== this.resultsRound) {
      this.resultsRound = view.results?.roundNumber ?? 0;
      this.resultsPage = 0;
      this.resultsPageChangedAt = Date.now();
    }
    if (view.phase !== "results") {
      this.resultsPage = 0;
      this.resultsRound = 0;
    }
    this.root.innerHTML = `<main class="public-surface phase-${view.phase}">
      <div class="stage-texture" style="background-image:url('${stageTextureUrl}')" aria-hidden="true"></div>
      ${showDecor(view)}
      <header class="broadcast-header">
        <img class="game-logo" src="${logoUrl}" alt="" />
        <p class="surface-tag">${this.mode === "host" ? "Live room feed" : "Spectator feed"}</p>
        ${statusStrip(view)}
      </header>
      ${this.phaseBody(view)}
      <footer class="passive-note"><span aria-hidden="true">★</span> Every choice happens on a controller <span aria-hidden="true">★</span></footer>
    </main>`;
    this.updateCountdown();
  }

  private phaseBody(view: PublicViewModel): string {
    if (view.phase === "connecting") {
      return `<section class="connecting-stage"><div class="signal-core" aria-hidden="true">?</div><h1>${html(view.title)}</h1><p>${html(view.subtitle)}</p></section>`;
    }
    if (view.phase === "lobby") {
      return `<section class="lobby-stage">
        <div class="lobby-copy"><p class="stage-ribbon">3–8 players · 3 rounds</p><h1>${html(view.title)}</h1><p>${html(view.subtitle)}</p></div>
        ${evidenceWheel(view, false)}
        <div class="join-command"><span>Join on your phone</span><strong>${Math.max(0, 3 - view.players.length) || "Ready to start"}</strong><small>${view.players.length < 3 ? "more players needed" : "Room director starts from their controller"}</small></div>
      </section>`;
    }
    if (view.phase === "instructions") {
      return `<section class="instructions-stage">
        <div class="instructions-copy"><p class="stage-ribbon">The whole game in 10 seconds</p><h1>Make the story stick.</h1><p>Hide your motive inside a ridiculous alibi. Then expose somebody else.</p>${countdown(view.countdownAt)}</div>
        ${evidenceWheel(view, true)}
      </section>`;
    }
    if (view.phase === "round-intro") {
      return caseStage(view, `<div class="motive-alert"><span aria-hidden="true">!</span><p>Your secret motive is live on your controller</p></div>${countdown(view.countdownAt)}`);
    }
    if (view.phase === "writing" || view.phase === "voting") {
      return caseStage(view, `${progressDots(view)}${countdown(view.countdownAt)}`);
    }
    if (view.phase === "results" && view.results) {
      const pageSize = 4;
      const pages = Math.ceil(view.results.answers.length / pageSize);
      const orderedAnswers = [...view.results.answers].sort(
        (left, right) =>
          right.favoriteVotes - left.favoriteVotes ||
          right.pointsEarned - left.pointsEarned ||
          left.authorName.localeCompare(right.authorName)
      );
      const answers = orderedAnswers.slice(
        this.resultsPage * pageSize,
        this.resultsPage * pageSize + pageSize
      );
      const topVotes = Math.max(0, ...view.results.answers.map((answer) => answer.favoriteVotes));
      return `<section class="results-stage">
        <div class="verdict-lockup"><span>Case file opened</span><h1>${html(view.title)}</h1><p>${html(view.subtitle)}</p></div>
        <div class="answer-stage"><div class="answer-wall">${answers
          .map((answer, index) => `<article class="answer-card${index === 0 ? " answer-card--lead" : ""}${topVotes > 0 && answer.favoriteVotes === topVotes ? " answer-card--favorite" : ""}" style="--reveal-index:${index}">${topVotes > 0 && answer.favoriteVotes === topVotes ? '<span class="favorite-sticker">Crowd favorite</span>' : ""}<p class="answer-copy">“${html(answer.text)}”</p><div class="motive-reveal"><span>Motive exposed</span>${html(answer.angle.label)}</div><p class="byline"><b>${html(answer.authorName)}</b><span>${answer.favoriteVotes} favorite · ${answer.decodedByPlayerIds.length} decoded</span><strong>+${answer.pointsEarned}</strong></p></article>`)
          .join("")}</div>
        ${pages > 1 ? `<p class="result-page">Answers ${this.resultsPage * pageSize + 1}–${Math.min((this.resultsPage + 1) * pageSize, view.results.answers.length)} of ${view.results.answers.length}</p>` : ""}</div>
        <aside class="score-panel"><p>Score race</p>${scoreRows(view.scoreboard, true)}${countdown(view.countdownAt)}</aside>
      </section>`;
    }
    if (view.phase === "finale") {
      const topScore = view.scoreboard[0]?.score ?? 0;
      const winners = view.scoreboard.filter((player) => player.score === topScore);
      const favoriteCount = Math.max(0, ...view.scoreboard.map((player) => player.favoriteVotes));
      const favorites = view.scoreboard.filter((player) => player.favoriteVotes === favoriteCount);
      const detectiveCount = Math.max(0, ...view.scoreboard.map((player) => player.correctDecodes));
      const detectives = view.scoreboard.filter((player) => player.correctDecodes === detectiveCount);
      return `<section class="finale-stage">
        <div class="winner-burst"><span>Final headline</span><h1>${winners.length ? html(tieLabel(winners)) : "The room"}</h1><strong>${topScore} points</strong></div>
        <div class="superlatives"><span><b>Best cover</b>${html(tieLabel(favorites))}</span><span><b>Sharpest detective</b>${html(tieLabel(detectives))}</span></div>
        ${scoreRows(view.scoreboard, true)}
      </section>`;
    }
    return `<section class="intermission-stage"><div class="signal-core" aria-hidden="true">↻</div><h1>${html(view.title)}</h1><p>${html(view.subtitle)}</p>${countdown(view.countdownAt)}${scoreRows(view.scoreboard, true)}</section>`;
  }

  private updateCountdown() {
    if (
      this.currentView?.phase === "results" &&
      (this.currentView.results?.answers.length ?? 0) > 4 &&
      Date.now() - this.resultsPageChangedAt >= 8_000
    ) {
      const pages = Math.ceil((this.currentView.results?.answers.length ?? 0) / 4);
      this.resultsPage = (this.resultsPage + 1) % pages;
      this.resultsPageChangedAt = Date.now();
      this.render(this.currentView);
      return;
    }
    const node = this.root.querySelector<HTMLElement>("[data-deadline]");
    if (!node) return;
    const remaining = Math.max(0, Number(node.dataset.deadline) - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    node.textContent = `${seconds}s`;
    node.classList.toggle("is-urgent", seconds <= 10);
  }
}

function showDecor(view: PublicViewModel): string {
  const word: Partial<Record<PublicViewModel["phase"], string>> = {
    "round-intro": "BREAKING!",
    writing: "COVER IT!",
    voting: "CALL IT!",
    results: "BUSTED!",
    finale: "LEGEND!"
  };
  return word[view.phase]
    ? `<div class="show-word show-word--${view.phase}" aria-hidden="true">${word[view.phase]}</div>`
    : "";
}

function evidenceWheel(view: PublicViewModel, showRules: boolean): string {
  const players = view.players
    .map((player, index) => `<span class="player-token${player.connected ? "" : " is-offline"}" style="--token-index:${index};--token-count:${Math.max(view.players.length, 1)}" aria-label="${html(player.name)}${player.connected ? "" : ", reconnecting"}">${html(player.name.slice(0, 1).toUpperCase())}</span>`)
    .join("");
  return `<div class="evidence-wheel${showRules ? " evidence-wheel--rules" : ""}">
    <div class="wheel-rim" aria-label="Cover, Decode, Crown">
      <div class="wheel-sector wheel-sector--cover"><b>1</b><span>Cover</span></div>
      <div class="wheel-sector wheel-sector--decode"><b>2</b><span>Decode</span></div>
      <div class="wheel-sector wheel-sector--crown"><b>3</b><span>Crown</span></div>
      <div class="wheel-hub" aria-hidden="true">★</div>
    </div>
    <div class="player-token-ring">${players}</div>
  </div>`;
}

function tieLabel(players: Array<{ name: string }>): string {
  if (players.length === 0) return "The room";
  if (players.length > 3) return `${players.length}-way tie`;
  return players.map((player) => player.name).join(" & ");
}

function caseStage(view: PublicViewModel, content: string): string {
  return `<section class="case-stage">
    <div class="case-meta"><span>${html(view.roundLabel)}</span><strong>${view.phase === "voting" ? "Decode + crown" : view.phase === "writing" ? "Build your alibi" : "New case"}</strong></div>
    <div class="incident-panel"><span class="incident-label">Impossible incident</span><h1>${html(view.incident ?? view.title)}</h1></div>
    <p class="case-instruction">${html(view.subtitle)}</p>
    <div class="case-console">${content}</div>
  </section>`;
}
