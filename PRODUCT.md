# Cover Story

## Players

Groups of 3–8 people sharing a large passive display while each person plays on a phone controller. Spectators can follow the public reveals without being shown private prompts or controls in the normal game UI.

## Purpose

Cover Story turns absurd incidents into short comedy and light deduction. Every player receives a private motive, writes an anonymous explanation, decodes somebody else’s motive, and votes for a favorite cover.

## Product truths

- The shell owns room lifecycle and authority.
- The host display and spectator are always passive.
- All writing, voting, settings, and room direction happen on controllers.
- Canonical state is committed only by the current shell authority.
- A controller mutates only its own durable player-state intent.
- Reconnects restore accepted submissions, ballots, scores, and the current phase.

The current public SDK ownership boundary prevents another controller from writing a player’s intent, but it does not make player-state or shared-state payloads confidential from technical inspection. Cover Story therefore treats motives and ballots as casual hidden information: host and spectator renderers never display them, and the game stores no sensitive real-world data. True private-state filtering is tracked in platform issue [#919](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/919).

## Experience

The game should be explainable from the first screen, finish three rounds in roughly 8–10 minutes, and create two laughs per answer: first from the anonymous cover, then from the motive reveal.

## Accessibility

Controller tasks use native labeled controls, visible focus, 44 px minimum targets, status announcements, 16 px inputs, reduced motion, and no color-only status. The host uses semantic passive content with no focusable elements.
