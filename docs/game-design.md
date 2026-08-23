# Cover Story game design

## Hook

A bizarre incident appears. Every player privately receives a different motive and writes a one-sentence cover story without naming that motive. The room then decodes motives and votes for the most entertaining explanation.

Example incident: “The town fountain is now soup.” Motives might include “impress a ghost,” “budget cuts,” and “revenge on pigeons.”

## Player loop

1. Read the incident and private motive on the controller.
2. Write one anonymous cover story.
3. Decode the motive behind an assigned non-self cover.
4. Vote for a favorite eligible non-self cover.
5. Reveal authors, motives, votes, and score changes.
6. Repeat for three rounds, then show the finale podium and superlatives.

The host display presents prompts, progress, anonymous covers, reveals, and scores. It never accepts input. Spectators see the same public view without private motives or controls in the normal game UI. Covers stay anonymous until the reveal.

## Scoring

- Favorite vote received: **100 points** to the cover’s author.
- Correct motive decode: **60 points** to the decoder.
- Motive successfully decoded: **40 points** to the cover’s author.

This rewards both comedy and writing that cleverly signals its constraint.

## Phases

- `lobby`: wait for the game lifecycle and minimum roster.
- `instructions`: one-screen rules; controller acknowledgements can advance early.
- `round-intro`: public incident plus each controller’s private motive.
- `writing`: compose and submit; confirmed submissions enter a waiting view.
- `voting`: one motive decode and one favorite vote on every controller.
- `results`: authorship, motive, vote, decode, and scoring reveal.
- `next-round`: short scoreboard bridge.
- `finale`: podium, Best Cover, and Sharpest Detective.

Deadlines keep disconnected or idle players from stalling the room. Missing writing or voting entries forfeit only that contribution. Reconnectable facts are durable; sounds and confetti are transient.

## Fairness and validation

- A cover must contain 3–140 characters after whitespace normalization.
- A cover may not contain its exact private motive phrase.
- The first valid submission and ballot are canonical; overwrites and duplicate intent IDs are ignored.
- Decode targets and favorite candidates never include the submitting player.
- Ballots are deterministic from the injected random source and remain stable across reconnects.
- Decode targets are balanced so every submitted cover is investigated once when all players submit.
- Intents carry round, phase, and sequence expectations so stale writes fail clearly.
- Authority changes are read from runtime context and never stored as game-owned authority.

## Hidden-information boundary

Motives and ballots are hidden by role-specific presentation but are not confidential from browser inspection under the current public SDK. The SDK ownership boundary protects writes, not reads; shared state and player state fan out to mounted surfaces. The content is intentionally low-stakes casual game information, and the game stores no sensitive data. True private-state filtering is tracked by platform issue [#919](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/919).
