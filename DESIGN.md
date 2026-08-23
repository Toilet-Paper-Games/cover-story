---
name: Cover Story
description: A late-1990s yearbook for impossible incidents, shared publicly and annotated privately on phones.
colors:
  cool-paper: "#f5f1e8"
  yearbook-ink: "#15161a"
  cobalt-school-ink: "#2146c7"
  correction-red: "#bd2028"
  deep-correction-red: "#8b1717"
  trophy-yellow: "#f3c623"
  rule-line: "#c9c2b4"
  card-white: "#ffffff"
  error-paper: "#fff1ef"
  muted-ink: "#57554f"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(48px, 7vw, 118px)"
    fontWeight: 700
    lineHeight: 0.93
    letterSpacing: "-0.045em"
  controller-heading:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(38px, 11vw, 68px)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  body:
    fontFamily: "'Trebuchet MS', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 800
    letterSpacing: "0.12em"
rounded:
  square: "0"
  seal: "50%"
components:
  button-primary:
    backgroundColor: "{colors.cobalt-school-ink}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.square}"
    padding: "12px 18px"
    height: "54px"
  button-secondary:
    backgroundColor: "{colors.cool-paper}"
    textColor: "{colors.yearbook-ink}"
    rounded: "{rounded.square}"
    padding: "12px 18px"
    height: "54px"
  answer-card:
    backgroundColor: "{colors.card-white}"
    textColor: "{colors.yearbook-ink}"
    rounded: "{rounded.square}"
    padding: "clamp(10px, 1vw, 14px)"
  motive-card:
    backgroundColor: "{colors.cobalt-school-ink}"
    textColor: "{colors.card-white}"
    rounded: "{rounded.square}"
    padding: "18px"
---

# Design System: Cover Story

## Overview

**Creative North Star: "The Impossible Yearbook"**

Cover Story looks like an unofficial late-1990s school yearbook that has been turned into a live comedy game show documenting events that could not have happened. Cool paper, editorial grids, bold Georgia headlines, cobalt school ink, correction-red annotations, trophy-yellow seals, slightly crooked artifacts, and portrait collage artwork make every phase feel like another spread in the same permanent record. Oversized background verdicts, slap-on callouts, score bursts, staged answer cards, and restrained celebration motion give each phase a distinct broadcast beat without copying another party game’s trade dress.

The public experience is theatrical and readable from across a room; the controller is a narrow personal page for private motives and decisions. Disclosure is staged by role: incidents and progress are public, motives and ballots stay in normal controller UI until the reveal, and the host never becomes an input surface.

**Key Characteristics:**

- Editorial yearbook spreads instead of generic application panels.
- High-contrast paper, ink, and primary-school color blocks with no gradients.
- Square, tactile controls and hard offset shadows rather than soft floating surfaces.
- Georgia-led comedy headlines paired with compact system-sans labels and metadata.
- Deterministic, phase-specific views for host, controller, and spectator roles.
- One authored reveal moment per major phase, with equivalent static hierarchy under reduced motion.

Shipped reference captures:

- [Host lobby](docs/screenshots/host-lobby.png)
- [Host incident reveal](docs/screenshots/host-round-intro.png)
- [Host results](docs/screenshots/host-results.png)
- [Controller writing](docs/screenshots/controller-writing.png)
- [Controller voting](docs/screenshots/controller-voting.png)

## Colors

The palette treats color as yearbook production ink: sparse, flat, semantic, and always supported by text or shape.

- **Cool Paper** (`#f5f1e8`): default canvas on every surface.
- **Yearbook Ink** (`#15161a`): primary text, rules, borders, and structural outlines.
- **Cobalt School Ink** (`#2146c7`): primary actions, scores, private motive cards, progress, and brand marks.
- **Correction Red** (`#bd2028`): eyebrows, motives at reveal, countdowns, ranks, and large editorial annotation.
- **Deep Correction Red** (`#8b1717`): small red text on yellow and error copy where the brighter red would miss normal-text contrast.
- **Trophy Yellow** (`#f3c623`): authority badges, focus halos, seals, and celebratory offset depth.
- **Rule Line** (`#c9c2b4`): quiet dividers and secondary hard shadows.
- **Card White** (`#ffffff`): answer sheets, quotes, text fields, and personal-result inserts.
- **Error Paper** (`#fff1ef`) and **Muted Ink** (`#57554f`): restricted support tones for recoverable errors and secondary controller guidance.

**The Paper-First Rule.** Cool Paper remains the dominant field. Cobalt, red, and yellow are production inks, not decorative washes.

**The Semantic Ink Rule.** Cobalt means action or score, red means annotation or urgency, and yellow means authority, focus, or achievement. Never rely on color alone to communicate state.

## Typography

**Display Font:** Georgia with Times New Roman and serif fallbacks  
**Body Font:** Trebuchet MS when available, then native system sans-serif fallbacks

The serif voice supplies oversized, slightly compressed yearbook drama; the sans-serif voice handles instructions, form labels, status, and small factual metadata.

- **Public display:** `clamp(48px, 7vw, 118px)`, bold, `0.93` line-height, `-0.045em` tracking. Use for incidents, lobby declarations, and winners.
- **Controller heading:** `clamp(38px, 11vw, 68px)`, bold, `0.98` line-height; compact to `34px` on very short narrow phones.
- **Deck:** Georgia, `clamp(20px, 2vw, 34px)`, `1.3` line-height.
- **Answer copy:** Georgia, bold, `clamp(16px, 1.2vw, 20px)`, `1.15` line-height.
- **Labels and eyebrows:** system sans, heavy, uppercase, correction red or ink, with roughly `0.12em–0.13em` tracking.
- **Body and form copy:** system sans at native readable sizes; controls inherit the body face.

**The Headline-and-Record Rule.** Serif type carries the joke or declaration. Sans-serif type records who, when, what to do, and what changed.

## Layout

Public surfaces are full-viewport editorial spreads with a persistent masthead, phase content, and a footer stating that the display is view-only. The lobby uses a balanced two-column hero. Round intro becomes a cobalt full-screen bulletin; writing and voting pin the incident to a large white show card above numeric submission progress; results stage answer cards with an accurate Crowd Favorite stamp; finale adds finite celebratory confetti. More than four answers automatically page in groups of four every eight seconds so the passive display never requires scrolling. Finale content compacts at short desktop heights and may use a two-column scoreboard below `760px` high.

At `780px` and below, public grids collapse to one column, status metadata recedes, answer cards stack, and artwork scales to the available width. Public spacing uses fluid clamps so a television and a tablet preserve the same hierarchy.

Controllers are centered personal pages up to `720px` wide with viewport-safe padding, an initialed player tile, and a semantic game-progress track. Writing keeps the incident, motive, input, character count, deadline, and submit action in one vertical flow. Voting is intentionally split into visibly numbered Decode and Crown steps; boxed radio choices lift and recolor when selected while preserving native input behavior and confirmed-runtime-echo recovery. For viewports at most `380px × 650px`, headings, margins, quote cards, and choices compact without reducing the touch target below `50px`; the current primary writing or voting action pins above the bottom safe area so it is always visible.

## Elevation & Depth

Depth is structural and print-like. Surfaces remain flat; selected artifacts lift with hard, unblurred offset shadows and slight rotation, as if pasted into a yearbook by hand.

- **Lobby artwork:** `13px 16px 0` cobalt beneath a white photo border.
- **Primary actions:** `5px 5px 0` Yearbook Ink; active press moves `3px` and reduces the shadow to `2px 2px 0`.
- **Motive and success cards:** cobalt or white sheets with `5px–7px` trophy-yellow offsets.
- **Answer cards:** `6px 6px 0` Rule Line.
- **Selected choices:** `6px 6px 0` cobalt beneath a trophy-yellow selection field.
- **Rotations:** small `1deg–3deg` rotations distinguish notes, stamps, marks, and badges without compromising readability.

**The Physical Print Rule.** Use hard offsets, borders, and restrained rotation. Do not introduce soft ambient shadows, glass effects, or gradients.

## Shapes

The dominant form is square paper: zero-radius buttons, fields, cards, notices, and labels with two- or three-pixel ink borders. Circles are reserved for progress dots, the submitted check seal, and the finale trophy seal. Borders and underlines create the editorial grid; transforms should feel hand-placed, never randomly noisy.

## Components

### Public primitives

- **Masthead and status strip:** CS school mark, surface label, round/player state, and reconnect status. Lobby avoids duplicating its player count.
- **Yearbook artwork and join note:** the square portrait collage from `assets/card.png`, backed by cobalt, plus the trophy-yellow controller instruction.
- **Incident spread:** centered impossible incident, round stamp, short deck, progress dots, and timer.
- **Incident show card:** writing and voting use a white, ink-bordered statement sheet with a cobalt or red hard offset and a large low-contrast verdict word behind it.
- **Submission meter:** oversized numeric count, one dot per active player, a proportion bar, and explicit waiting/completion copy.
- **Answer stage:** up to four staged white answer cards per automatic page; cover text, correction-red motive, author/vote/decode byline, Crowd Favorite stamp, and page position remain visible together.
- **Scoreboard and superlatives:** ranked rows use red ranks and cobalt scores; the finale handles ties and names Best Cover and Sharpest Detective.

Host and spectator share the public renderer. They may contain semantic text, images, lists, status, and a non-live timer, but no buttons, links, inputs, selects, textareas, content editing, positive tab stops, or keyboard-driven game controls.

### Controller primitives

- **Header:** player identity, game title, room status, and a trophy-yellow `Room director` badge only when the shell context designates that controller as authority.
- **Game progress:** a semantic six-step progressbar beneath the header; phase changes animate through composited scale rather than layout-changing width.
- **Motive card:** cobalt private disclosure with a yellow offset and explicit scoring hint.
- **Choices:** native radio inputs inside boxed full-row labels with explicit circular markers, yellow selected fields, and cobalt offsets; minimum action height remains phone-friendly.
- **Ballot steps:** a two-part Decode/Crown strip makes current and completed work immediately legible.
- **Primary and secondary actions:** square, full-width, ink-bordered controls with hard press depth. Pending writes disable and relabel the action.
- **Countdown:** correction-red outlined timer with `role="timer"` and `aria-live="off"`.
- **Notices and receipts:** reconnect, rejection, submitted, late-joiner, waiting, and personal-result states use explicit text and confirmed runtime state.

The shell owns room lifecycle and authority. The authority badge and finale room actions derive only from shell context; non-authority controllers never render organizer actions. Authority changes must preserve the current draft, textarea selection and focus, decode choice, favorite choice, and confirmed-write behavior. Controllers write only their own durable intent; canonical shared state is displayed only after the authority-confirmed echo.

Native labels and fieldsets remain the accessibility foundation. Interactive targets are at least `44px`, focus uses an ink outline plus trophy-yellow halo, safe-area insets protect phone controls, reduced-motion preferences suppress motion, and errors use `role="alert"`. Reconnecting and late-joiner states replace unavailable choices with clear waiting copy.

## Motion

Motion is a show beat, never game state. The incident card scales from an already visible source, the controller receipt seal pops once, result cards reveal in a short 100 ms stagger, and finale confetti runs for two finite passes. Urgent timers pulse only three times. Every authored animation is inside `prefers-reduced-motion: no-preference`; reduced-motion users receive the same text, color, placement, and score information without motion.

## Do's and Don'ts

### Do

- **Do** preserve the late-1990s impossible-yearbook metaphor across every new phase and state.
- **Do** keep public information large, staged, and readable without host interaction.
- **Do** keep motives, ballots, writing, voting, settings, and room direction in normal controller UI only.
- **Do** render confirmed runtime echoes and preserve in-progress controller form state across updates.
- **Do** reuse the masthead, status strip, incident spread, answer card, scoreboard, motive card, choice row, notice, countdown, and action styles before inventing new patterns.
- **Do** test minimum and maximum player fixtures at large-host, tablet/spectator, normal-phone, and `380px × 650px`-or-smaller viewports.

### Don't

- **Don't** add any interactive or focusable element to host or spectator game surfaces.
- **Don't** expose private motives or ballots through host or spectator presentation; presentation hiding is casual game privacy, not a claim of SDK-level confidentiality.
- **Don't** use modern rounded-card, soft-shadow, glass, gradient, or dashboard conventions that break the print world.
- **Don't** truncate player cover text to make results fit; automatically page or reflow the passive reveal.
- **Don't** use red, blue, or yellow as decoration without their established semantic role.
- **Don't** add motion that is required to understand state or that ignores `prefers-reduced-motion`.
