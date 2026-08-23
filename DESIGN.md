---
name: Cover Story
description: A live comic cover-up broadcast where phones become contestant game pads.
colors:
  midnight-stage: "#07122f"
  midnight-console: "#0c1e4c"
  outline-ink: "#030711"
  warm-paper: "#fff6df"
  dim-paper: "#d9d9e9"
  evidence-lime: "#c9f227"
  alarm-coral: "#ff5349"
  trophy-yellow: "#ffd43d"
  signal-purple: "#8c7dff"
  broadcast-blue: "#2353c7"
  error-coral: "#ff7770"
typography:
  display:
    fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"
    fontSize: "clamp(42px, 12vw, 118px)"
    fontWeight: 900
    lineHeight: 0.9
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"
    fontSize: "clamp(36px, 6vw, 84px)"
    fontWeight: 900
    lineHeight: 0.92
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.4
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "10px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  square: "0"
  token: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.evidence-lime}"
    textColor: "{colors.outline-ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.square}"
    padding: "13px 18px"
    height: "58px"
  button-secondary:
    backgroundColor: "{colors.midnight-console}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.square}"
    padding: "13px 18px"
    height: "58px"
  answer-panel:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.outline-ink}"
    rounded: "{rounded.square}"
    padding: "18px"
  secret-ticket:
    backgroundColor: "{colors.evidence-lime}"
    textColor: "{colors.outline-ink}"
    rounded: "{rounded.square}"
    padding: "19px"
---

# Design System: Cover Story

## Overview

**Creative North Star: "The Live Comic Cover-Up"**

Cover Story is a televised comic-book emergency, not a document, dashboard, or conventional website. Impossible incidents crash onto a midnight broadcast stage as oversized evidence. The room sees wheels, bursts, smashed panels, score races, and stamped verdicts; each phone becomes a tactile contestant game pad for secret motives, suspicious alibis, deductions, and votes.

The visual world is loud but disciplined. Warm paper panels and heavy black outlines carry readable game information while acid lime, alarm coral, trophy yellow, and signal purple create unmistakable phase beats. Generated raster artwork supplies the logo, catalog art, and distressed halftone stage material; CSS geometry supplies scalable wheels, bursts, tokens, and panels. Public surfaces remain cinematic and passive at all times.

**Key Characteristics:**

- A midnight comic-broadcast stage with real distressed raster texture.
- Impact-led, all-caps declarations sized for a television across the room.
- One dominant game prop per phase: evidence wheel, incident card, answer wall, score race, or winner burst.
- Hard black outlines, offset color shadows, clipped tickets, circles, and starbursts instead of rounded application cards.
- Controllers styled as personal game pads with strong phase colors and tactile press states.
- Private motives and every action stay on controllers; host and spectator are view-only broadcasts.

## Colors

The palette is four-color comic printing under stage light: a dark field, warm readable paper, and rare saturated inks assigned to game meaning.

- **Midnight Stage:** the full-viewport broadcast field and dominant negative space.
- **Midnight Console:** secondary controller actions and recessed control surfaces.
- **Outline Ink:** borders, hard shadows, text on bright panels, and the outer television frame.
- **Warm Paper:** answer panels, incident evidence, input fields, and high-contrast public copy.
- **Dim Paper:** secondary instructions and passive footer copy on the dark stage.
- **Evidence Lime:** writing, evidence, accepted state, leading answers, and the primary controller action during cover creation.
- **Alarm Coral:** urgency, voting, annotations, ranks, phase shocks, and offset depth.
- **Trophy Yellow:** authority, awards, finale emphasis, and focus halos.
- **Signal Purple:** supporting answer depth and secondary panel offsets.
- **Broadcast Blue:** wheel structure, scoreboard depth, and supporting broadcast accents.
- **Error Coral:** recoverable controller errors only.

**The Stage-Dominance Rule.** Midnight remains the largest color field. Bright inks arrive as props and state signals, never as soft background decoration.

**The Four-Ink Rule.** Lime means evidence or progress, coral means urgency or voting, yellow means authority or victory, and purple means supporting depth. State must also remain legible through text, shape, or position.

## Typography

**Display Font:** Impact with Haettenschweiler and condensed Arial fallbacks
**Body Font:** Arial with Helvetica and system sans-serif fallbacks

The display voice behaves like a comic cover and a live-game scoreboard: compressed, blunt, uppercase, and extremely large. The body voice stays familiar and durable so prompts, choices, scores, and status remain readable during fast phone play.

- **Display:** heavyweight condensed all-caps for incident reveals, lobby declarations, results, and winners.
- **Headline:** condensed all-caps for controller phase titles, motives, labels, and scores.
- **Body:** bold sans-serif for instructions, answers, choice copy, and receipts.
- **Label:** extra-bold uppercase sans-serif with wide tracking for ribbons, metadata, status, and authority.

**The Broadcast-Scale Rule.** Public jokes and verdicts must read from across a room. If a heading could pass for normal webpage type, it is too small.

**The One-Shout Rule.** Each state gets one dominant declaration. Supporting labels stay compact so the hierarchy does not become a wall of shouting.

## Layout

Public surfaces are fixed theatrical canvases with a top broadcast header, one phase-specific center stage, and a small view-only footer. Lobby and instructions pair a copy block with an oversized evidence wheel. Round phases center a giant tilted incident panel over progress hardware. Results use an asymmetrical wall: the crowd favorite owns the lead panel while supporting answers form smaller smashed panels beside it. Finale places a winner burst opposite a complete score race with superlatives below.

The large-display composition is intentionally asymmetric and uses controlled overlap. It must still fit at 1280×720 without page scrolling. Below 920px, public grids collapse to a single-column tablet/spectator composition and regain natural document height. Short landscape displays compact the incident stage and arrange the finale scoreboard in two columns.

Controllers are single-column game pads up to 720px wide with safe-area padding. Identity, authority, and a six-step phase track remain at the top; the current play task owns the rest of the viewport. At 380×680 and below, typography and vertical gaps compress, and the active writing or voting action docks above the bottom safe area. No controller target falls below 52px in the compact flow.

**The One-Prop Rule.** Every public phase needs one unmistakable silhouette that communicates the current game beat before its copy is read.

## Elevation & Depth

Depth is physical and theatrical: thick outlines separate paper from stage, colored offset shadows make panels feel slammed into place, and limited dark drop shadows suggest studio lights. The system does not use blurred glass, translucent cards, or ambient SaaS elevation.

- **Broadcast hardware:** bright panels use four- to nine-pixel ink borders with five- to seventeen-pixel coral, purple, or blue offsets.
- **Hero props:** the evidence wheel, incident panel, lead answer, and winner burst may add one larger dark drop shadow behind the colored offset.
- **Controller press:** controls move down and right while their hard shadow contracts, creating a physical button response.
- **Focus:** interactive controls receive a warm-paper outline plus trophy-yellow outer halo.
- **Motion:** props arrive with a short slam, crash, stamp, or scale beat. Large raster backgrounds remain static so multi-surface rooms do not waste continuous compositing work. All authored motion disappears under reduced-motion preference without losing information.

**The Hard-Shadow Rule.** Color offsets provide structure. Blur is reserved for the single deep shadow beneath a hero prop, never for ordinary cards.

## Shapes

The system mixes square comic panels with circular game-show hardware. Answer cards, inputs, choices, buttons, status blocks, and score rows are square with heavy outlines. Player avatars, wheel rings, timer badges, and voting markers are circles. Motive tickets use clipped quadrilateral edges; submitted receipts and the finale use controlled starbursts. Small rotations imply physical placement without reducing legibility.

**The Silhouette Rule.** Geometry must communicate purpose: panels contain evidence, circles track players or progress, and starbursts celebrate locked or winning states.

## Components

### Broadcast header

The generated Cover Story logo anchors the left edge, followed by a clipped coral surface tag. Room and round status sit in outlined black chips on the right. The header is information only on public surfaces.

### Evidence wheel and player tokens

The wheel teaches the complete loop—Cover, Decode, Crown—before play begins. Connected players appear as named circular tokens locked around the wheel, making room readiness feel like a game board rather than a roster list.

### Incident panel

The current impossible incident lives on a large warm-paper panel with a heavy outline, coral offset, stamped metadata, and supporting direction. Writing and voting place a separate progress console below it rather than mixing interaction into the public display.

### Answer panels and score race

The highest-voted answer receives the lead lime or yellow panel. Supporting answers use smaller warm-paper panels with purple depth. Favorite stickers, vote counts, motives, authors, and points are explicit. Score rows pair rank, avatar token, player name, progress bar, and score; the finale keeps every player visible.

### Controller actions

Primary actions use the current phase color, a four-pixel ink border, a hard ink shadow, and condensed uppercase copy. Secondary actions use the recessed midnight console. Hover lifts a choice; active press scales and translates the button. Pending writes disable and relabel the action until a confirmed runtime echo arrives.

### Secret ticket, choices, and receipts

The private motive is a clipped lime ticket with a coral SECRET stamp. Voting choices are full-row paper panels containing native radio inputs and circular markers; selection changes the whole field to the phase color. Submitted state uses a stamped check burst, while personal results use a paper receipt with explicit decode and round-score copy.

Host and spectator may render semantic text, images, lists, status, and passive timers only. They must contain no button, link, form control, content editing, positive tab stop, or keyboard-driven game behavior. Authority-only room actions derive from shell context and render only on the designated authority controller.

## Do's and Don'ts

### Do

- **Do** make every phase look like a new shot in the same live comic broadcast.
- **Do** preserve one dominant public game prop and one dominant declaration per state.
- **Do** use the generated logo, catalog art, and distressed stage texture as production assets rather than recreating them with placeholder gradients.
- **Do** keep all writing, voting, settings, and room direction on controllers.
- **Do** render confirmed runtime echoes and preserve controller drafts, focus, selection, and checked choices across subscriptions.
- **Do** verify 1280×720 hosts, tablet spectators, 360×640 phones, and 320×568 compact controllers.
- **Do** keep public surfaces at zero interactive or focusable elements in every phase.

### Don't

- **Don't** fall back to a centered website hero, generic dashboard grid, pill-heavy UI, soft cards, glass, or decorative gradients.
- **Don't** use bright palette colors interchangeably; preserve their game-state roles.
- **Don't** shrink public reveals into ordinary headings or flatten the lead answer into an equal card grid.
- **Don't** expose private motives or ballots through host or spectator presentation.
- **Don't** require motion to understand state or ignore `prefers-reduced-motion`.
- **Don't** add organizer actions to a non-authority controller or any action to the host display.
