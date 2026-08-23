# Cover Story

Cover Story is a 3–8 player Toilet Paper Games party game staged as a live comic cover-up broadcast. An impossible incident appears, every controller receives a private motive, and each player writes a one-sentence anonymous cover story. Players then decode another player’s motive and crown a favorite cover. Three rounds end with a winner reveal and ridiculous superlatives.

The shared host display and spectator surface are entirely passive. All writing, voting, acknowledgements, settings, and room direction happen on controllers; room controls render only for the shell-designated authority controller.

## Architecture

- `src/domain`: serializable state, intents, validation, scoring, and pure transitions. No DOM, timers, SDK, storage, network, or randomness.
- `src/application`: the authority coordinator plus injected clock, random, ID, content, runtime, analytics, and sound ports.
- `src/platform`: the only `@tpgames/game-kit` adapter and idempotent surface bootstrap.
- `src/presentation`: view models and shared host/controller/spectator visual primitives.
- `src/testing`: phase factories, player fixtures, fake clock, seeded randomness, predictable IDs, runtime recorder, and isolated scenario helpers.
- `surfaces/gallery.html`: development-only fast entry point for every meaningful state.

Accepted game facts are durable shared state. Controllers write only their own durable player intent with compare-and-set revisions. The current shell authority validates those intents through the pure rule engine and commits the next canonical shared snapshot. Renderers wait for subscription echoes rather than assuming writes took effect.

Private motives are role-hidden casual game information, not a security boundary: the current public SDK distributes shared snapshots and player-state reads to mounted surfaces even though writes remain ownership-scoped. Host and spectator renderers never display private prompts, and Cover Story stores no sensitive data. Platform-level read filtering is tracked in [TP Games #919](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/919).

## Local development

```bash
npm install
npm run dev
```

Open the multi-surface Workbench at `http://127.0.0.1:5173/__tpg/workbench`. It mounts one host, four controllers, and a spectator with lifecycle, participant, authority, reconnect, and network controls.

Open a deterministic scenario directly:

```text
http://127.0.0.1:5173/surfaces/gallery.html?scenario=voting&surface=controller&players=8&authority=0
```

Valid scenarios are `lobby`, `instructions`, `roundIntro`, `writing`, `waiting`, `voting`, `results`, `nextRound`, `reconnect`, and `finale`. Surfaces are `host`, `controller`, and `spectator`.

## Verification

```bash
npm run typecheck
npm run test
npm run test:e2e
npm run validate
npm run check
```

The browser suite checks every host and spectator scenario for zero interactive/focusable elements, verifies 320 px controllers and authority-control isolation, and completes a real four-controller Workbench round including submissions, voting, scoring, reconnect, and authority handoff.

`npm run validate` builds the versioned archive in `dist/`, runs boundary and capability checks, and strictly validates the directory and archive. Generated dependencies, builds, reports, archives, credentials, and environment files are ignored and must not be committed.

## Publishing

The production registry is the CLI default. Authenticate with a short-lived browser-approved session, publish, then remove the saved session:

```bash
npm exec -- tpgames login
npm run publish:dry-run
npm run publish:game
npm exec -- tpgames logout
```

Never commit a registry session, API key, token, archive, or environment file. See [docs/developer-experience.md](docs/developer-experience.md) for the exact delivery journal and [docs/game-design.md](docs/game-design.md) for rules and scoring.
