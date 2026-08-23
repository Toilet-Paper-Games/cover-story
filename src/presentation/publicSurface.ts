import type { GameCoordinator } from "../application/coordinator";
import { countdown, html, progressDots, scoreRows, statusStrip } from "./dom";
import { buildPublicViewModel, type PublicViewModel } from "./viewModels";

const yearbookArtworkUrl = "/assets/card.png";

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
      ${showDecor(view)}
      <header class="masthead">
        <div class="brand-mark"><span>CS</span></div>
        <p class="surface-label">${this.mode === "host" ? "The shared yearbook" : "Spectator edition"}</p>
        ${statusStrip(view)}
      </header>
      ${this.phaseBody(view)}
      <footer class="passive-note">All choices happen on controllers · this display is view-only</footer>
    </main>`;
    this.updateCountdown();
  }

  private phaseBody(view: PublicViewModel): string {
    if (view.phase === "connecting") {
      return hero(view, `<div class="portrait-grid portrait-grid--loading"></div>`);
    }
    if (view.phase === "lobby") {
      return hero(
        view,
        `<div class="lobby-spread">
          <img class="yearbook-art" src="${html(yearbookArtworkUrl)}" alt="A collage of eccentric yearbook portraits" />
          <div class="join-note"><p class="kicker">Open TP Games on your phone</p><strong>${Math.max(0, 3 - view.players.length) || "Ready when the room starts"}</strong><p>${view.players.length < 3 ? "more players needed" : "Three rounds of suspicious explanations"}</p></div>
        </div>`
      );
    }
    if (view.phase === "instructions") {
      return hero(view, `<ol class="rules-list"><li><b>Cover it.</b><span>Explain the incident without naming your private motive.</span></li><li><b>Decode it.</b><span>Match one classmate's cover to its real motive.</span></li><li><b>Crown it.</b><span>Vote for the cover you wish were true.</span></li></ol>${countdown(view.countdownAt)}`);
    }
    if (view.phase === "round-intro") {
      return incidentSpread(view, `<div class="show-callout"><span aria-hidden="true">↘</span><p>Private motives are live on controllers</p></div>${countdown(view.countdownAt)}`);
    }
    if (view.phase === "writing" || view.phase === "voting") {
      return incidentSpread(view, `${progressDots(view)}${countdown(view.countdownAt)}`);
    }
    if (view.phase === "results" && view.results) {
      const pageSize = 4;
      const pages = Math.ceil(view.results.answers.length / pageSize);
      const answers = view.results.answers.slice(
        this.resultsPage * pageSize,
        this.resultsPage * pageSize + pageSize
      );
      const topVotes = Math.max(0, ...view.results.answers.map((answer) => answer.favoriteVotes));
      return `<section class="results-spread">
        <div class="section-heading"><p class="eyebrow">${html(view.eyebrow)}</p><h1>${html(view.title)}</h1><p>${html(view.subtitle)}</p></div>
        <div class="answer-stage"><div class="answer-wall">${answers
          .map((answer, index) => `<article class="answer-card${topVotes > 0 && answer.favoriteVotes === topVotes ? " answer-card--favorite" : ""}" style="--reveal-index:${index}">${topVotes > 0 && answer.favoriteVotes === topVotes ? '<span class="favorite-sticker">Crowd favorite</span>' : ""}<p class="answer-copy">“${html(answer.text)}”</p><div class="red-pen">Motive: ${html(answer.angle.label)}</div><p class="byline">${html(answer.authorName)} · ${answer.favoriteVotes} favorite vote${answer.favoriteVotes === 1 ? "" : "s"} · ${answer.decodedByPlayerIds.length} detective${answer.decodedByPlayerIds.length === 1 ? "" : "s"} · +${answer.pointsEarned}</p></article>`)
          .join("")}</div>
        ${pages > 1 ? `<p class="result-page">Answers ${this.resultsPage * pageSize + 1}–${Math.min((this.resultsPage + 1) * pageSize, view.results.answers.length)} of ${view.results.answers.length}</p>` : ""}</div>
        <aside class="score-panel"><p class="kicker">Class standings</p>${scoreRows(view.scoreboard, true)}${countdown(view.countdownAt)}</aside>
      </section>`;
    }
    if (view.phase === "finale") {
      const topScore = view.scoreboard[0]?.score ?? 0;
      const winners = view.scoreboard.filter((player) => player.score === topScore);
      const favoriteCount = Math.max(0, ...view.scoreboard.map((player) => player.favoriteVotes));
      const favorites = view.scoreboard.filter((player) => player.favoriteVotes === favoriteCount);
      const detectiveCount = Math.max(0, ...view.scoreboard.map((player) => player.correctDecodes));
      const detectives = view.scoreboard.filter((player) => player.correctDecodes === detectiveCount);
      return `<section class="finale-spread">
        <p class="eyebrow">${html(view.eyebrow)}</p>
        <div class="trophy-seal">CLASS<br/>LEGEND</div>
        <h1>${winners.length ? html(tieLabel(winners)) : "The class"}</h1>
        <p class="finale-deck">${winners.length ? `${topScore} points and a spotless, deeply suspicious permanent record.` : html(view.subtitle)}</p>
        <div class="superlatives"><span><b>Best Cover</b>${html(tieLabel(favorites))}</span><span><b>Sharpest Detective</b>${html(tieLabel(detectives))}</span></div>
        ${scoreRows(view.scoreboard, true)}
      </section>`;
    }
    return hero(view, `${countdown(view.countdownAt)}${scoreRows(view.scoreboard, true)}`);
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
  if (view.phase === "round-intro") {
    return '<div class="show-word show-word--incident" aria-hidden="true">INCIDENT!</div>';
  }
  if (view.phase === "writing") {
    return '<div class="show-word show-word--writing" aria-hidden="true">MAKE IT<br/>BELIEVABLE</div>';
  }
  if (view.phase === "voting") {
    return '<div class="show-word show-word--voting" aria-hidden="true">SUSPICIOUS!</div>';
  }
  if (view.phase === "results") {
    return '<div class="show-word show-word--results" aria-hidden="true">BUSTED</div>';
  }
  if (view.phase === "finale") {
    return `<div class="confetti-field" aria-hidden="true">${Array.from({ length: 18 }, (_, index) => `<i style="--i:${index}"></i>`).join("")}</div>`;
  }
  return "";
}

function tieLabel(players: Array<{ name: string }>): string {
  if (players.length === 0) return "The class";
  if (players.length > 3) return `${players.length}-way tie`;
  return players.map((player) => player.name).join(" & ");
}

function hero(view: PublicViewModel, content: string): string {
  return `<section class="hero-spread"><div class="hero-copy"><p class="eyebrow">${html(view.eyebrow)}</p><h1>${html(view.title)}</h1><p class="deck">${html(view.subtitle)}</p></div><div class="hero-detail">${content}</div></section>`;
}

function incidentSpread(view: PublicViewModel, content: string): string {
  return `<section class="incident-spread"><p class="eyebrow">${html(view.eyebrow)}</p><p class="round-stamp">${html(view.roundLabel)}</p><h1>${html(view.incident ?? view.title)}</h1><p class="deck">${html(view.subtitle)}</p>${content}</section>`;
}
