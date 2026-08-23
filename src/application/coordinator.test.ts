import { describe, expect, it } from "vitest";

import { coverStoryPrompts } from "./content";
import { GameCoordinator } from "./coordinator";
import { FakeClock, PredictableIdGenerator, seededRandom } from "../testing/fakes";
import { playerFixtures, stateFactories } from "../testing/fixtures";
import { RecordingRuntimeMock } from "../testing/runtimeMock";

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function participants(count = 3) {
  return playerFixtures(count).map((player) => ({ ...player, role: "controller" as const }));
}

function coordinator(runtime: RecordingRuntimeMock, clock = new FakeClock()) {
  return new GameCoordinator({
    runtime,
    clock,
    ids: new PredictableIdGenerator(),
    prompts: coverStoryPrompts,
    random: seededRandom(7)
  });
}

describe("GameCoordinator runtime integration", () => {
  it("initializes only after authority is assigned and retries a stale canonical write", async () => {
    const runtime = new RecordingRuntimeMock({
      participants: participants(),
      context: { surfaceKind: "controller", participantId: "p2", isAuthority: false }
    });
    const game = coordinator(runtime);
    game.start();
    await flush();
    expect(runtime.sharedWrites).toHaveLength(0);
    expect(runtime.readyCount).toBe(1);

    runtime.rejectNextShared = {
      status: "rejected",
      reason: "stale-revision",
      revision: 0,
      message: "Another authority committed first."
    };
    runtime.emitContext({
      surfaceKind: "controller",
      participantId: "p2",
      authorityParticipantId: "p2",
      isAuthority: true,
      roomId: "mock-room"
    });
    await flush();
    await flush();

    expect(runtime.sharedWrites.length).toBeGreaterThanOrEqual(2);
    expect(runtime.sharedState().value?.phase).toBe("lobby");
    expect(runtime.readyCount).toBe(1);
    game.dispose();
    expect(runtime.teardownCount).toBeGreaterThanOrEqual(5);
  });

  it("keeps controller UI pending until the owned player-state echo arrives", async () => {
    const state = stateFactories.writing(3);
    const runtime = new RecordingRuntimeMock({
      state,
      participants: participants(),
      context: {
        surfaceKind: "controller",
        participantId: "p1",
        authorityParticipantId: "p2",
        isAuthority: false
      }
    });
    runtime.autoEcho = false;
    const game = coordinator(runtime);
    game.start();

    const write = await game.submitCover("It was a completely ordinary municipal lunch decision.");
    expect(write.status).toBe("applied");
    expect(game.snapshot().playerWritePending).toBe(true);
    expect(game.snapshot().ownPlayerState).toBeUndefined();

    const confirmed = runtime.playerWrites[0]!.value;
    runtime.emitPlayer("p1", confirmed, 1);
    expect(game.snapshot().playerWritePending).toBe(false);
    expect(game.snapshot().ownPlayerState).toEqual(confirmed);
  });

  it("syncs disconnects and reconnects canonically after an authority change", async () => {
    const state = stateFactories.writing(3);
    const runtime = new RecordingRuntimeMock({
      state,
      participants: participants(),
      context: {
        surfaceKind: "controller",
        participantId: "p1",
        authorityParticipantId: "p2",
        isAuthority: false
      }
    });
    const game = coordinator(runtime);
    game.start();
    runtime.emitParticipants(
      participants().map((player) => ({ ...player, connected: player.id !== "p3" }))
    );
    await flush();
    expect(runtime.sharedWrites).toHaveLength(0);

    runtime.emitContext({
      surfaceKind: "controller",
      participantId: "p1",
      authorityParticipantId: "p1",
      isAuthority: true,
      roomId: "mock-room"
    });
    await flush();
    expect(runtime.sharedState().value?.roster.find((player) => player.id === "p3")?.connected).toBe(false);

    runtime.emitParticipants(participants());
    await flush();
    expect(runtime.sharedState().value?.roster.find((player) => player.id === "p3")?.connected).toBe(true);
  });

  it("never exposes room controls through a non-authority coordinator", async () => {
    const runtime = new RecordingRuntimeMock({
      state: stateFactories.finale(3),
      participants: participants(),
      context: { surfaceKind: "controller", participantId: "p2", isAuthority: false }
    });
    const game = coordinator(runtime);
    await game.openSettings();
    await game.returnToLobby();
    expect(runtime.settingsCount).toBe(0);
    expect(runtime.lobbyCount).toBe(0);
  });
});
