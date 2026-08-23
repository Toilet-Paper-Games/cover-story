# Production verification

## Release under test

- Repository: <https://github.com/Toilet-Paper-Games/cover-story>
- Release commit: [`fe71d83`](https://github.com/Toilet-Paper-Games/cover-story/commit/fe71d83a051dec44d5bff0886068cd8efcfd9e6b)
- Published version: `0.2.1`
- Visibility: public production catalog
- Registry upload result: `ok: true`, with `entryBaseUrl` `https://tpg-registry.tp-games.workers.dev/published-assets/cover-story/0.2.1`
- Archive: `cover-story-0.2.1.zip`, 6,314,818 bytes, 14 runtime-only ZIP entries, 3 surfaces

## Local release gates

- `npm run check`: passed
  - TypeScript: passed
  - Vitest: 14/14 passed across 6 files
  - TPG iframe boundary check: passed
  - capability check: passed
  - build, bundle, and strict directory/archive validation: passed
- `npm run test:e2e`: 3/3 passed in 48.9 seconds
  - every major host and spectator state stayed passive and fit the viewport
  - 320×568 controllers preserved authority isolation and compact actions
  - four Workbench controllers completed writing, both voting steps, results, reconnect, and authority handoff
- Production registration dry-run: passed for `cover-story@0.2.1` against `https://tpg-registry.tp-games.workers.dev`
- Archive review: 14 expected runtime files; no dependencies, VCS metadata, environment files, tests, output, Playwright artifacts, logs, certificates, keys, or token-shaped content; stored entries use non-executable file permissions.

## Fresh production room

- Verification command: `npm run verify:production`
- Room code: `05M6FQ`
- Independent browser contexts: 1 passive 1440×900 host plus 3 isolated mobile/touch controllers (`Mara`, `Nico`, and `Pip`)
- Catalog discovery: the shell-designated controller opened `Cover Story` details and launched the public catalog entry
- Controller asset: <https://tpg-registry.tp-games.workers.dev/published-assets/cover-story/0.2.1/controller.html>
- Host asset: <https://tpg-registry.tp-games.workers.dev/published-assets/cover-story/0.2.1/host.html>
- Shell-designated authority: controller index 0
- Authority-control counts inside controller game iframes: `[1, 0, 0]`
- Submitted covers: 3/3
- Submitted ballots: 3/3
- Results reached: yes
- Scores committed: Mara 100, Nico 100, Pip 100
- Personal result feedback reached all three controllers: yes
- Host iframe interactive/focusable element count at results: **0**
- Host copy confirmed: `EVERY CHOICE HAPPENS ON A CONTROLLER`
- Visual production evidence: [production results screenshot](./screenshots/production-results-0.2.1.png)

The production host showed the generated Cover Story logo, distressed midnight comic stage, asymmetrical Crowd Favorite wall, exposed motives, score race, countdown, and view-only footer. All controller input remained inside controller iframes; the host supplied and required no input.

## Production-only defect found and resolved

Version `0.2.0` completed a functional round in room `UQDQAP`, including 3/3 covers, 3/3 ballots, results, `[1, 0, 0]` authority isolation, and zero host focusables. Its screenshot exposed missing logo and stage texture assets because root-absolute runtime artwork URLs escaped the registry's versioned asset base. Local root-hosted Workbench pages did not reproduce that path layout.

Version `0.2.1` introduced a tested surface-asset resolver: Workbench uses the authoring root while versioned registry surfaces use colocated `./assets/` paths. Room `05M6FQ` and the checked-in production screenshot confirm the newest version renders the intended game presentation from the registry. This evidence extends the published-subpath concern already tracked in [TP Games #939](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/939); no duplicate issue was created.

## Playtest and design result

The motive-constrained cover phase, decode step, favorite crown, scoring loop, reconnect state, and authority handoff remain unchanged from the previously completed independent role-based playtest. The redesign resolves the primary finish concern from that playtest and later user review: the game no longer presents as a themed website. Each phase now has a game-specific silhouette and broadcast beat, while phones read as tactile contestant game pads.

## Platform DX follow-up

- [#923 Expose a typed runtime context and authority subscription](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/923)
- [#932 Handle authorization_pending before generic successful device responses](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/932)
- [#937 Reset or namespace runtime state when selecting a different game](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/937)
- [#938 Align Workbench role and iframe sandbox contracts with production](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/938)
- [#939 Make standalone bundling link Vite-extracted CSS automatically](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/939)

The existing authenticated CLI session was used for publication after `tpgames whoami` confirmed `games:read`, `games:write`, `games:submit`, and `games:publish`. It appears shared with another TP Games workflow, so this task did not revoke or alter it. No credential, session, environment file, generated archive, dependency tree, or test-output directory is committed.
