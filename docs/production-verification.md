# Production verification

## Release under test

- Repository: <https://github.com/Toilet-Paper-Games/cover-story>
- Commit: [`c44fe34`](https://github.com/Toilet-Paper-Games/cover-story/commit/c44fe34)
- Published version: `0.1.6`
- Visibility: public catalog
- Registry upload result: `Uploaded cover-story 0.1.6 and published it.`
- Archive: `cover-story-0.1.6.zip`, 1,169 KB, 12 ZIP entries (11 bundle files plus the manifest), 3 surfaces

## Local release gates

- `npm run check`: passed
  - TypeScript: passed
  - Vitest: 13/13 passed across 5 files
  - TPG boundary check: passed
  - capability check: passed
  - strict archive validation: passed
- `npm run test:e2e`: 3/3 passed for the presentation/runtime version immediately preceding the player-revision adapter patch. The unchanged UI journey covered every major passive host and spectator phase, a 320×568 eight-player controller, four live Workbench controllers, authority transfer, disconnect/reconnect, writing, both voting steps, results, and host focusability.
- `npm run publish:dry-run`: passed against the production registry route for `cover-story`.
- The 0.1.6 adapter change was covered by a failing-first focused test and then by the independent production round below.

## Fresh production room

- Verification command: `npm run verify:production`
- Room code: `SP5G09`
- Independent browser contexts: 1 passive host plus 3 isolated mobile/touch controllers (`Mara`, `Nico`, and `Pip`)
- Shell-designated authority: controller index 0
- Authority-control counts inside controller game iframes: `[1, 0, 0]`
- Controller asset: <https://tpg-registry.tp-games.workers.dev/published-assets/cover-story/0.1.6/controller.html>
- Host asset: <https://tpg-registry.tp-games.workers.dev/published-assets/cover-story/0.1.6/host.html>
- Submitted covers: 3/3
- Submitted ballots: 3/3
- Results reached: yes
- Scores committed: Mara 100, Nico 100, Pip 100
- Personal result feedback reached all three controllers: yes
- Host iframe interactive/focusable element count at results: **0**
- Host copy confirmed: `ALL CHOICES HAPPEN ON CONTROLLERS · THIS DISPLAY IS VIEW-ONLY`
- Screenshot artifact: `output/production-SP5G09-0.1.6.png`

The production result page showed all three cover cards, their real motives, favorite-vote counts, per-answer points, and the class standings. Each controller showed its own decode result and round score. The host never supplied or required an input.

## Playtest review

Independent role-based reviews and the multi-controller browser playtest agreed that the motive-constrained writing creates distinct jokes, the decode step adds strategy beyond a popularity vote, and the personal result card makes the scoring loop understandable. Findings were checked against the final implementation:

- Reconnecting controllers are replaced by the non-interactive `Holding your place` state; the 320×568 browser test asserts zero textarea/button/input controls there.
- Eight-player writing and the first voting action keep their primary control in the initial phone viewport; favorite ballots are limited to three candidates.
- Complete-roster favorite exposure uses cyclic candidate assignment before seeded presentation shuffle, so every submitted cover receives balanced exposure.
- The content source contains ten incidents with ten motive options each, and a match uses three rounds.
- Passive 1280×720 host instructions, results, and finale layouts have explicit no-overflow browser assertions.

## Platform DX follow-up

- [#923 Expose a typed runtime context and authority subscription](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/923)
- [#932 Handle authorization_pending before generic successful device responses](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/932) (deduplicated existing issue for the observed CLI login failure)
- [#937 Reset or namespace runtime state when selecting a different game](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/937)
- [#938 Align Workbench role and iframe sandbox contracts with production](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/938)
- [#939 Make standalone bundling link Vite-extracted CSS automatically](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/939)

The task's temporary CLI login attempt was logged out after the device-flow failure, and `tpgames whoami` confirmed there was no saved session at that point. A later final check saw a CLI session restored by a concurrent TP Games publishing workflow, so this task did not revoke or alter that shared external session. Cover Story publication used the already-authenticated Creator Portal, and no credential or environment file was added to the repository.
