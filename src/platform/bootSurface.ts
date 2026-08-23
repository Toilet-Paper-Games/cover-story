import {
  bootIframeGame,
  defineSimpleGame,
  dispatchLocalPreviewLifecycle,
  type IframeGameRuntimeApi,
  type SurfaceKind
} from "@tpgames/game-kit";

import { GameCoordinator, createCoordinatorRandom } from "../application/coordinator";
import { BrowserIdGenerator, SystemClock } from "../application/defaults";
import { coverStoryPrompts } from "../application/content";
import type { CoverStoryState, PlayerIntentState } from "../domain/model";
import { TpgRuntimeAdapter } from "./tpgRuntime";

export interface SurfaceRenderer {
  connect(coordinator: GameCoordinator): void;
  dispose?(): void;
}

export function bootSurface(
  surfaceId: string,
  surfaceKind: SurfaceKind,
  renderer: SurfaceRenderer
): GameCoordinator {
  let coordinator: GameCoordinator | undefined;
  let runtimeApi: IframeGameRuntimeApi<CoverStoryState, PlayerIntentState> | undefined;

  function connect(api: IframeGameRuntimeApi<CoverStoryState, PlayerIntentState>) {
    runtimeApi = api;
    if (coordinator) {
      return;
    }
    const runtime = new TpgRuntimeAdapter(api);
    coordinator = new GameCoordinator({
      runtime,
      clock: new SystemClock(),
      ids: new BrowserIdGenerator(),
      prompts: coverStoryPrompts,
      random: createCoordinatorRandom(runtime.context().roomId)
    });
    renderer.connect(coordinator);
    coordinator.start();
  }

  const game = defineSimpleGame<CoverStoryState, PlayerIntentState>({
    boot: connect,
    ready: connect,
    surfacesLoading: connect,
    surfacesReady: connect,
    started: connect,
    disposed() {
      coordinator?.dispose();
      renderer.dispose?.();
    }
  });

  connect(
    bootIframeGame(game, {
      context: {
        surfaceId,
        surfaceKind,
        participantId: surfaceKind === "controller" ? "local-controller" : undefined,
        isAuthority: surfaceKind === "controller"
      },
      initialSettings: { volume: 0.8 }
    })
  );

  if (window.parent === window) {
    dispatchLocalPreviewLifecycle({ state: "started" });
  }

  return coordinator!;
}
