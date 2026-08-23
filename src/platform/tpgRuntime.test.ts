import type { IframeGameRuntimeApi } from "@tpgames/game-kit";
import { describe, expect, it, vi } from "vitest";

import type { CoverStoryState, PlayerIntentState } from "../domain/model";
import { mapRuntimeParticipantRole, TpgRuntimeAdapter } from "./tpgRuntime";

describe("mapRuntimeParticipantRole", () => {
  it("normalizes the production host participant to the passive display role", () => {
    expect(mapRuntimeParticipantRole("host")).toBe("host-display");
  });

  it("retries an own-player write once at the confirmed production revision", async () => {
    const setPlayerState = vi
      .fn()
      .mockResolvedValueOnce({
        status: "rejected",
        reason: "stale-revision",
        revision: 41,
        message: "Player state is at revision 41; refresh before retrying."
      })
      .mockResolvedValueOnce({ status: "applied", revision: 42 });
    const api = {
      getPlayerStateSnapshot: vi.fn(() => ({ participantId: "controller-1", revision: 40 })),
      setPlayerState
    } as unknown as IframeGameRuntimeApi<
      CoverStoryState,
      PlayerIntentState
    >;
    const adapter = new TpgRuntimeAdapter(api);
    const value: PlayerIntentState = {};

    await expect(adapter.writeOwnPlayerState(value, 0)).resolves.toEqual({
      status: "applied",
      revision: 42
    });
    expect(setPlayerState).toHaveBeenNthCalledWith(1, value, undefined, {
      expectedRevision: 40
    });
    expect(setPlayerState).toHaveBeenNthCalledWith(2, value, undefined, {
      expectedRevision: 41
    });
  });
});
