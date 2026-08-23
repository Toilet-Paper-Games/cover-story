import type { GameCoordinator } from "../application/coordinator";
import type { CoverStoryState, PlayerIntentEnvelope } from "../domain/model";
import { applyPlayerIntent } from "../domain/transition";
import type { CoordinatorSnapshot } from "../application/coordinator";

export function executeTransition(
  state: CoverStoryState,
  actorId: string,
  intent: PlayerIntentEnvelope,
  now = 9_000
) {
  return applyPlayerIntent(state, { actorId, actorRole: "controller", now }, intent);
}

export function staticCoordinator(snapshot: CoordinatorSnapshot): GameCoordinator {
  return {
    subscribe(listener: (value: CoordinatorSnapshot) => void) {
      listener(snapshot);
      return () => {};
    },
    acknowledgeInstructions: async () => ({ status: "accepted" }),
    submitCover: async () => ({ status: "accepted" }),
    submitBallot: async () => ({ status: "accepted" }),
    openSettings: async () => {},
    returnToLobby: async () => {}
  } as unknown as GameCoordinator;
}
