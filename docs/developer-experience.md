# Developer experience journal

This journal separates game-specific work from reusable TP Games platform or author-tool findings. Reusable findings become deduplicated issues in `Toilet-Paper-Games/Toilet-Paper-Games` only after they are reproduced.

## 2026-08-22 — contract recovery and scaffold

### Attempt

Read the current author guide, SDK lifecycle contract, capability matrix, React tutorial/example, canonical starter, and public package metadata. Queried npm instead of relying on remembered versions, then ran:

```text
npm create @tpgames/game@latest -- /Users/justin/Projects/cover-story --game-id cover-story --title "Cover Story"
npm install
npm run check
```

### What worked well

- The public scaffold completed without monorepo dependencies or npm credentials.
- Current packages were pinned automatically: `@tpgames/game-kit@0.5.1`, `@tpgames/sdk-dev-kit@0.3.0`, and `@tpgames/core-manifest@0.3.0`.
- The generated full check passed before any game code changed, giving the repository a useful baseline.
- The GitHub CLI was already authorized for the `Toilet-Paper-Games` organization, so the standalone public repository could be created and pushed immediately.

### Problems and workarounds

| Scope | Problem | Workaround | Suggested fix and acceptance criteria |
| --- | --- | --- | --- |
| Platform DX | The canonical starter and React example put lifecycle/game controls on the host surface, even though passive host displays are a core product direction. | Use the starter only for tooling and replace its runtime and host markup. | Add a passive-host author example where host markup contains zero controls and all optional organizer controls are authority-controller-only. The example’s browser test must assert the host iframe has no focusable elements. |
| Platform DX | Starter and React initialization is host-specific and does not guard current authority before writing. It can fail after authority transfers to a controller. | Install the application/authority adapter on every surface and check live runtime context at handling time. | Update starter/example so any current authority can initialize idempotently; add an authority-transfer workbench test that initializes and advances after transfer. |
| Platform DX | There is no typed `subscribeContext`/authority-change API. The available workaround is `subscribeShellEvent("runtime:context")`. | Wrap the shell event inside the game’s runtime port. | Expose a typed context subscription that fires after `api.context()` updates, with workbench coverage for host-to-controller and controller-to-host transfer. |
| Platform DX | Public player state is ownership-scoped for writes but fans out to mounted surfaces, so it is not a confidentiality boundary for secret hands or motives. | Treat motives as casual hidden information, keep renderers role-scoped, and never store sensitive data. | Document this explicitly in the state decision guide and provide a supported reconnectable private-state contract or an explicit “inspectable hidden information” capability note. |
| Local design tooling | The prescribed Penpot MCP server started successfully on ports 4400–4403, but no Penpot MCP tools were connected in this Codex session and local Chrome automation timed out before the plugin could be loaded. | Continue with the locked design direction in code and retain the exact connection failure here; do not fabricate a `.penpot` snapshot or substitute a different design service. | Make Penpot MCP availability detectable after a local server starts, or provide a documented headless/export path. Acceptance: an agent can open/import, inspect, export `.penpot`, PNG preview, and sidecar without restarting the task. |

### Ownership

The first four findings are candidates for the main TP Games repository after deduplication. The Penpot connection issue is local tooling evidence, not yet a TP Games product issue. No game-specific issue was created during scaffolding.

Deduplication later found existing platform issues [#919](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/919) for player-state read filtering, [#918](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/918) for Workbench reset snapshots, and [#922](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/922) for passive-host declaration/validation. The missing typed context subscription remained distinct and was filed as [#923](https://github.com/Toilet-Paper-Games/Toilet-Paper-Games/issues/923).

### Production-only findings

None yet. Production registry publication and room play have not been attempted at this point in the journal.

## 2026-08-23 — implementation and local room verification

### Attempts

```text
npm run typecheck
npm run test
npm run validate
npm run dev
npm run test:e2e
```

The development server was exercised through the scenario gallery, the six-surface Workbench (host, four controllers, spectator), the Expect accessibility/performance browser, and Playwright CLI. The Workbench authority moved from the host to Player 1 before play; four controllers submitted covers and ballots, results scored, Player 3 disconnected/reconnected, and authority moved to Player 2.

### What worked well

- Shared and owned-state revisions were observable and deterministic in the Workbench inspector.
- The Workbench exposed authority transfer, readiness, reconnect, and synchronized surfaces without a registry upload.
- A fresh-page Workbench session supported a complete round in 16.5 seconds once browser actions were dispatched concurrently.
- Playwright verified all ten major states on both passive surfaces, maximum-player voting, 320 px controllers, authority-control isolation, scoring, reconnect, and authority handoff.
- Strict validation accepted the host, controller, spectator, artwork, scripts, capabilities, and manifest metadata.

### Problems and workarounds

| Scope | Problem | Workaround | Suggested fix and acceptance criteria |
| --- | --- | --- | --- |
| Game repository | Favorite ballot labels initially looked up answer IDs as record keys, producing “Cover unavailable.” | Resolve favorite IDs against submission values and add a browser assertion for all rendered ballot labels. | Fixed in this repository; acceptance is the passing maximum-player voting scenario with zero unavailable labels. |
| Game repository | The original correction red measured 4.43:1 against paper at small text. | Darken correction red and rerun accessibility review. | Fixed in this repository; all small red labels must meet WCAG AA against the paper background. |
| Platform DX | Workbench “Reset session” reset participant readiness but left the game’s finale shared snapshot mounted; only a full Workbench reload created a clean room. | Reload `/__tpg/workbench` before the next browser journey. | Reset must clear shared state, player state, lifecycle, messages, revisions, and mounted surface application state. A browser test should start in finale, press Reset session, and observe a revision-zero lobby initialization without page reload. |
| Local browser tooling | Concurrent Expect actions could wait on controls that legitimately disappeared after the phase advanced, and one long session crashed its target. | Use Playwright CLI for the full synchronized journey and use Expect for fresh-page visual, accessibility, console, network, and performance checks. | Tooling-local; no TP Games issue unless reproduced in platform-owned browser tooling. |

### Production-only findings

None at this stage. The production registry, catalog, and fresh room are intentionally recorded in a later entry after authenticated publication.

## 2026-08-23 — independent playtest and finish pass

### Attempts

Four independent reviewers exercised the game as room authority, ordinary players, spectators, and a visual-finish reviewer. Their briefs explicitly asked for confusion, exploits, pacing, authority leaks, reconnect behavior, narrow-screen defects, and fun-factor concerns. The affected flows were then repeated with focused unit tests and Playwright:

```text
npm run typecheck
npm test
npx playwright test tests/e2e/scenarios.spec.ts --grep "passive"
npm run test:e2e
```

### Findings addressed

| Scope | Evidence | Resolution and acceptance criteria |
| --- | --- | --- |
| Game repository | An accepted durable intent could be processed again after its receipt was cleared at a later phase. | Receipts now remain durable for the game session. A coordinator regression test replays an accepted cover after phase advancement and proves it is ignored. |
| Game repository | Greedy ballot allocation could give uneven favorite exposure or leave some submitted covers without a decoder. | Complete rooms now use a shuffled cyclic schedule for exactly balanced favorite exposure and a matching algorithm for unique decode targets. Unit tests cover four- and eight-player allocations. |
| Game repository | A controller re-render caused by another player’s state echo could erase a draft or radio choice. | The controller renderer preserves focus, selection, textarea content, and checked ballot values across confirmed subscription echoes. The four-controller Workbench journey types a draft and checks a favorite before another player writes, then asserts both survive. |
| Game repository | A reconnect fixture still presented an active form; late joiners and reconnecting players were described as the same state. | Reconnecting players now get a control-free holding state, while late joiners get a distinct round-in-progress state. The narrow-controller test asserts that reconnect contains no inputs or buttons. |
| Game repository | An eight-player one-screen ballot was too tall on 320×568 controllers. | Voting is now a two-step Decode → Crown flow with compact short-height styling. The browser suite completes both steps at 320 px and a full four-controller round. |
| Game repository | Eight long covers and the finale could clip on 1280×720 host displays. | Results automatically paginate four answers at a time; the short-height finale uses a two-column scoreboard and condensed tie labels. Browser tests exercise 140-character covers, both result pages, and the eight-player finale without viewport overflow. |
| Game repository | Result points implied that decode points belonged to the cover author, and tied finale labels became unwieldy. | Answer cards now show only points earned by that author; controller feedback separately reports decoder points. Finale winners remain explicit while ties of four or more use an accurate `N-way tie` label. |
| Game repository | Five incident prompts could repeat too quickly in a three-round session. | The content source now has ten incidents and selects rounds sequentially from a seeded starting order so a session cannot repeat an incident. |
| Game repository | Lobby copy duplicated the player count and could imply the room was both waiting and ready. | Lobby headline and join note now branch on roster readiness and present the count once. |

### Visual, accessibility, and operability finish

- Host and spectator retained zero focusable elements in every deterministic phase.
- Focus styling uses an ink outline plus yellow halo and controller safe-area insets.
- Live regions were removed from the continuously replaced app root; countdown updates no longer create repeated announcements.
- Fresh-page browser inspection found no console errors or failed network requests.
- The measured gallery load was 1.58 s FCP/LCP, 0 CLS, and 20 ms TTFB in the local browser environment.
- Final screenshots were recaptured through Playwright without inspection overlays at 1440×900, 390×844, 320×568, and 1280×720.

### Final local evidence at this stage

- Unit tests: 9 passed across pure transitions, ballot construction, and coordinator integration.
- Browser tests: 3 passed, covering twenty passive-surface phase renders, 320 px controller states, and a synchronized four-controller Workbench round with authority transfer and reconnect.
- Strict boundary, capability, directory, and archive validation passed. The production registry dry-run resolved `cover-story@0.1.0` against `https://tpg-registry.tp-games.workers.dev`.
- The final archive is 1,185,024 bytes with 12 runtime-only entries. Inspection confirmed no dependencies, VCS metadata, environment files, test artifacts, or credential-shaped files. A preflight inspection caught duplicate inlined card artwork; using the already-copied `/assets/card.png` path reduced the archive from 2,496,274 bytes without changing its contents or behavior.
- Remaining steps: authenticate immediately before publication, then record production-only evidence in a new journal entry.

## 2026-08-23 — party-show design amplification

### Attempt

The user asked for a more game-like, TV party-game presentation before publication. The redesign preserved the impossible-yearbook identity and all game/runtime contracts while amplifying phase identity, feedback, motion, and controller urgency. The full repo design stack was applied, followed by the Impeccable `bolder` playbook, its one-time detector, a full six-domain interface review, two bounded screenshot rounds, and focused then full browser verification.

### What changed

- Round intro is now a cobalt full-screen bulletin with an oversized incident verdict and slap-on controller callout.
- Writing and voting use large white incident show cards, oversized submission counts, per-player dots, and a proportion meter.
- Results stage cards in a short reveal sequence and accurately stamp the page’s highest-voted covers as Crowd Favorite.
- Finale uses two finite confetti passes; urgent timers pulse only three times. Every authored animation is disabled by `prefers-reduced-motion`.
- Controllers now have initialed player tiles, a semantic game-progress track, visible Decode/Crown steps, tactile boxed radio choices, and a safe-area-aware short-phone action dock.
- The body face changed from generic Inter fallback to Trebuchet MS, preserving system fallbacks and the established Georgia display voice.

### Findings and fixes

| Scope | Evidence | Resolution and acceptance criteria |
| --- | --- | --- |
| Game repository | The first amplified writing layout exceeded the passive 1440×900 viewport. | Reduced incident-phase display sizing and padding, then fixed public surfaces to the intended viewport canvas. All host/spectator phases now pass vertical and horizontal fit checks. |
| Game repository | Visually hidden radio inputs initially lost their direct pointer hit target. | Positioned the real native radio over the custom marker and kept the full label clickable. Playwright selects the real input and completes both ballot steps. |
| Game repository | The new boxed ballot increased short-phone scroll and could put the primary action below the fold. | Added a bordered action dock fixed above the bottom safe area only at `380×650` and below, with content padding behind it. Tests assert both writing and voting primary actions are in the 320×568 viewport. |
| Game repository | Bright correction red on trophy yellow measured 3.80:1 for small text. | Added the documented deep correction red `#8b1717`; the pair now measures 5.78:1. Other measured core pairs range from 5.48:1 to 16.04:1. |
| Local design tooling | The Penpot MCP tool became discoverable, but its required read-only overview did not return after 90 seconds because no live plugin/page connection was available. | Terminated the bounded read-only attempt and continued from checked-in design truth and browser renders, as the Penpot skill requires. No `.penpot` artifact was fabricated and no alternate canvas was substituted. Acceptance for tooling remains: the plugin connects and the overview returns before a design write. |

### Verification at this stage

```text
npm run typecheck
npm test
npm run test:e2e
```

- 9 focused domain/application tests passed.
- 3 browser journeys passed: every deterministic passive phase, narrow/authority controller states, and a complete four-controller Workbench round.
- The host and spectator still contain zero focusable or interactive elements.
- Final reference captures were refreshed at 1440×900, 1280×720, 390×844, and 320×568.
- Strict directory/archive validation and the production registry dry-run passed again. The redesigned 0.1.0 archive contains the same 12 audited runtime entries and is 1,196,412 bytes.
