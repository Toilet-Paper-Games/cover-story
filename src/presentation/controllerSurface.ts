import type { GameCoordinator } from "../application/coordinator";
import { countdown, html, scoreRows, statusStrip } from "./dom";
import { buildControllerViewModel, type ControllerViewModel } from "./viewModels";

export class ControllerSurfaceRenderer {
  private coordinator?: GameCoordinator;
  private unsubscribe?: () => void;
  private ticker?: number;
  private draft = "";
  private ballotStep: "decode" | "favorite" = "decode";
  private ballotAngleGuessId = "";
  private ballotFavoriteAnswerId = "";

  constructor(private readonly root: HTMLElement) {}

  connect(coordinator: GameCoordinator) {
    this.coordinator = coordinator;
    this.unsubscribe = coordinator.subscribe((snapshot) => this.render(buildControllerViewModel(snapshot)));
    this.ticker = window.setInterval(() => this.updateCountdown(), 250);
  }

  dispose() {
    this.unsubscribe?.();
    if (this.ticker !== undefined) window.clearInterval(this.ticker);
  }

  private render(view: ControllerViewModel) {
    const focused = document.activeElement;
    const restoreTextarea = focused instanceof HTMLTextAreaElement && this.root.contains(focused);
    const selection = restoreTextarea
      ? { start: focused.selectionStart, end: focused.selectionEnd }
      : undefined;
    if (restoreTextarea) this.draft = focused.value;
    const angleChoice = this.root.querySelector<HTMLInputElement>('input[name="angleGuessId"]:checked');
    const favoriteChoice = this.root.querySelector<HTMLInputElement>('input[name="favoriteAnswerId"]:checked');
    if (angleChoice) this.ballotAngleGuessId = angleChoice.value;
    if (favoriteChoice) this.ballotFavoriteAnswerId = favoriteChoice.value;
    this.root.innerHTML = `<main class="controller-surface phase-${view.phase} player-count-${view.players.length}">
      <header class="controller-header"><span class="player-avatar" aria-hidden="true">${html(view.playerName.slice(0, 1).toUpperCase())}</span><div><p class="eyebrow">${html(view.playerName)}</p><strong>Cover Story</strong></div>${view.isAuthority ? '<span class="authority-badge">Room director</span>' : ""}</header>
      ${phaseTrack(view)}
      ${statusStrip(view)}
      ${view.isReconnecting ? '<div class="notice notice--reconnect"><b>Reconnecting</b><span>Your confirmed answers are safe. This page will catch up automatically.</span></div>' : ""}
      ${view.rejection ? `<div class="notice notice--error" role="alert">${html(view.rejection)}</div>` : ""}
      ${this.phaseBody(view)}
    </main>`;
    this.bind(view);
    if (restoreTextarea) {
      const textarea = this.root.querySelector<HTMLTextAreaElement>("textarea");
      textarea?.focus({ preventScroll: true });
      if (textarea && selection) textarea.setSelectionRange(selection.start, selection.end);
    }
    this.updateCountdown();
  }

  private phaseBody(view: ControllerViewModel): string {
    if (view.phase === "connecting") return panel("Opening your yearbook…", "Waiting for the room's confirmed state.");
    if (view.isReconnecting) return panel("Holding your place", "Confirmed answers and scores are safe. Choices unlock after the room catches up.");
    if (view.isLateJoiner) return panel("Round in progress", "You’re in the room. Your first motive arrives when the next round begins.");
    if (view.phase === "lobby") return panel("You're in the class picture", `${view.players.length} joined · the room starts with 3 players.${view.isAuthority ? " You are the room director; start the game from the TP Games room controls." : ""}`);
    if (view.phase === "instructions") {
      if (view.instructionsAcknowledged) return submitted("Ready noted", "Waiting for the rest of the class.", view);
      return `<section class="controller-panel"><p class="eyebrow">Three quick moves</p><h1>Cover. Decode. Crown.</h1><ol class="phone-rules"><li>Write one sentence that explains the incident.</li><li>Hide your exact private motive.</li><li>Decode a classmate, then vote for a favorite.</li></ol>${countdown(view.countdownAt)}<button class="primary-action" data-action="ack" ${view.writePending ? "disabled" : ""}>${view.writePending ? "Handing it in…" : "I’m ready"}</button></section>`;
    }
    if (view.phase === "round-intro") return `<section class="controller-panel"><p class="eyebrow">${html(view.roundLabel)}</p><h1>${html(view.incident ?? "New incident")}</h1>${motiveCard(view)}<p class="helper">Hint at this motive. Never type its exact words.</p>${countdown(view.countdownAt)}</section>`;
    if (view.phase === "writing") {
      if (view.hasSubmittedCover) return submitted("Cover locked in", "Now pretend this was always your official statement.", view);
      return `<section class="controller-panel"><p class="eyebrow">${html(view.roundLabel)}</p><h1>${html(view.incident ?? "Explain yourself")}</h1>${motiveCard(view)}<div data-form="cover"><label for="cover">Your one-sentence cover</label><textarea id="cover" name="cover" minlength="3" maxlength="140" rows="4" required placeholder="Obviously, this happened because…">${html(this.draft)}</textarea><div class="form-meta"><span data-count>${this.draft.length}/140</span>${countdown(view.countdownAt)}</div><div class="action-dock"><button class="primary-action" type="button" data-action="submit-cover" ${view.writePending ? "disabled" : ""}>${view.writePending ? "Handing it in…" : "Lock in my cover"}</button></div></div></section>`;
    }
    if (view.phase === "voting") {
      if (view.hasSubmittedVote) return submitted("Ballot submitted", "Waiting for the class verdict.", view);
      if (!view.ballot) return submitted("No ballot this round", "You’ll join the next page when it turns.", view);
      const target = Object.values(view.submissions).find((answer) => answer.id === view.ballot?.decodeAnswerId);
      if (this.ballotStep === "decode") {
        return `<section class="controller-panel"><div class="ballot-steps" aria-label="Voting step 1 of 2"><b>1 Decode</b><span>2 Crown</span></div><p class="eyebrow">Read between the lines</p><h1>What motivated this cover?</h1><div class="quote-card"><span aria-hidden="true">“</span><p>${html(target?.text ?? "Cover unavailable")}</p></div>${countdown(view.countdownAt)}<div data-form="decode"><fieldset><legend>Choose the hidden motive</legend>${view.ballot.angleOptions.map((angle) => radio("angleGuessId", angle.id, angle.label, angle.id === this.ballotAngleGuessId)).join("")}</fieldset><div class="action-dock"><button class="primary-action" type="button" data-action="continue-decode">Continue to favorite</button></div></div></section>`;
      }
      return `<section class="controller-panel"><div class="ballot-steps" aria-label="Voting step 2 of 2"><span>✓ Decode</span><b>2 Crown</b></div><p class="eyebrow">Pick the room’s headline</p><h1>Which cover wins?</h1>${countdown(view.countdownAt)}<div data-form="ballot"><fieldset><legend>Choose your favorite cover</legend>${view.ballot.favoriteAnswerIds.map((id) => radio("favoriteAnswerId", id, Object.values(view.submissions).find((answer) => answer.id === id)?.text ?? "Cover unavailable", id === this.ballotFavoriteAnswerId)).join("")}</fieldset><div class="action-dock"><button class="primary-action" type="button" data-action="submit-ballot" ${view.writePending ? "disabled" : ""}>${view.writePending ? "Submitting…" : "Submit my ballot"}</button></div><button class="secondary-action" type="button" data-action="back-decode">Change my decode</button></div></section>`;
    }
    if (view.phase === "results") {
      const score = view.scoreboard.find((row) => row.id === view.playerId);
      const decode = view.personalResult
        ? `<div class="personal-result"><b>${view.personalResult.correct ? "Correct decode" : "Mystery missed"}</b><span>You guessed “${html(view.personalResult.guessed)}.” ${view.personalResult.correct ? "You read that cover perfectly." : `The motive was “${html(view.personalResult.actual)}.”`}</span><strong>+${view.personalResult.roundPoints} this round</strong></div>`
        : "";
      return `<section class="controller-panel"><p class="eyebrow">Permanent record updated</p><h1>${score ? `${score.score} points` : "Results are in"}</h1>${decode}<p class="deck">Favorites are worth 100. Correct decodes are worth 60. Being decoded is worth 40.</p>${scoreRows(view.scoreboard, true)}${countdown(view.countdownAt)}</section>`;
    }
    if (view.phase === "finale") return `<section class="controller-panel controller-finale"><p class="eyebrow">Senior superlatives</p><h1>${view.scoreboard[0]?.id === view.playerId ? "Class Legend" : "The class record"}</h1>${scoreRows(view.scoreboard)}${view.isAuthority ? '<button class="primary-action" data-action="lobby">Return everyone to lobby</button><button class="secondary-action" data-action="settings">Room settings</button>' : '<p class="helper">The room director controls what happens next.</p>'}</section>`;
    return panel(view.title, view.subtitle, countdown(view.countdownAt));
  }

  private bind(view: ControllerViewModel) {
    this.root.querySelector<HTMLTextAreaElement>("textarea")?.addEventListener("input", (event) => {
      this.draft = (event.currentTarget as HTMLTextAreaElement).value;
      const counter = this.root.querySelector("[data-count]");
      if (counter) counter.textContent = `${Array.from(this.draft).length}/140`;
    });
    for (const input of this.root.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
      input.addEventListener("change", () => {
        if (input.name === "angleGuessId") this.ballotAngleGuessId = input.value;
        if (input.name === "favoriteAnswerId") this.ballotFavoriteAnswerId = input.value;
      });
    }
    this.root.querySelector("[data-action='ack']")?.addEventListener("click", () => void this.coordinator?.acknowledgeInstructions());
    this.root.querySelector("[data-action='lobby']")?.addEventListener("click", () => void this.coordinator?.returnToLobby());
    this.root.querySelector("[data-action='settings']")?.addEventListener("click", () => void this.coordinator?.openSettings());
    this.root.querySelector("[data-action='back-decode']")?.addEventListener("click", () => {
      this.ballotStep = "decode";
      this.render(view);
    });
    const submitCover = () => {
      const value = this.root.querySelector<HTMLTextAreaElement>("textarea[name='cover']")?.value ?? "";
      if (Array.from(value.trim()).length < 3 || Array.from(value).length > 140) return;
      void this.coordinator?.submitCover(value);
    };
    this.root.querySelector("[data-action='submit-cover']")?.addEventListener("click", submitCover);

    const submitBallot = () => {
      if (!view.ballot || !this.ballotAngleGuessId || !this.ballotFavoriteAnswerId) return;
      void this.coordinator?.submitBallot({
        decodeAnswerId: view.ballot.decodeAnswerId,
        angleGuessId: this.ballotAngleGuessId,
        favoriteAnswerId: this.ballotFavoriteAnswerId
      });
    };
    this.root.querySelector("[data-action='submit-ballot']")?.addEventListener("click", submitBallot);

    const continueDecode = () => {
      if (!this.ballotAngleGuessId) return;
      this.ballotStep = "favorite";
      this.render(view);
    };
    this.root.querySelector("[data-action='continue-decode']")?.addEventListener("click", continueDecode);
    if (view.phase !== "writing") this.draft = "";
    if (view.phase !== "voting" || view.hasSubmittedVote) {
      this.ballotStep = "decode";
      this.ballotAngleGuessId = "";
      this.ballotFavoriteAnswerId = "";
    }
  }

  private updateCountdown() {
    const node = this.root.querySelector<HTMLElement>("[data-deadline]");
    if (!node) return;
    const seconds = Math.ceil(Math.max(0, Number(node.dataset.deadline) - Date.now()) / 1000);
    node.textContent = `${seconds}s`;
    node.classList.toggle("is-urgent", seconds <= 10);
  }
}

function panel(title: string, copy: string, detail = ""): string {
  return `<section class="controller-panel"><p class="eyebrow">Cover Story</p><h1>${html(title)}</h1><p class="deck">${html(copy)}</p>${detail}</section>`;
}

function motiveCard(view: ControllerViewModel): string {
  return `<aside class="motive-card"><span>Your private motive</span><strong>${html(view.assignment?.label ?? "Waiting for assignment")}</strong><small>Hint clearly — you score when someone decodes it.</small></aside>`;
}

function submitted(title: string, copy: string, view: ControllerViewModel): string {
  return `<section class="controller-panel submitted-panel"><div class="check-seal"><span>✓</span></div><p class="eyebrow">Submitted</p><h1>${html(title)}</h1><p class="deck">${html(copy)}</p>${countdown(view.countdownAt)}</section>`;
}

function radio(name: string, value: string, label: string, checked = false): string {
  return `<label class="choice"><input type="radio" name="${html(name)}" value="${html(value)}" required${checked ? " checked" : ""}><span class="choice-marker" aria-hidden="true"></span><span class="choice-copy">${html(label)}</span></label>`;
}

function phaseTrack(view: ControllerViewModel): string {
  const steps: Record<ControllerViewModel["phase"], number> = {
    connecting: 0,
    lobby: 0,
    instructions: 1,
    "round-intro": 2,
    writing: 3,
    voting: 4,
    results: 5,
    "next-round": 5,
    finale: 6
  };
  const step = steps[view.phase];
  return `<div class="phase-track" role="progressbar" aria-label="Game progress" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${step}"><span class="phase-track__fill phase-track__fill--${step}"></span></div>`;
}
