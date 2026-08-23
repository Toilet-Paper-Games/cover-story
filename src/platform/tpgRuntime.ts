import type {
  IframeGameRuntimeApi,
  RuntimeParticipant,
  StateMutationResult,
  SurfaceContext
} from "@tpgames/game-kit";

import type {
  MutationResult,
  RuntimeContextValue,
  RuntimeParticipantValue,
  RuntimePort
} from "../application/ports";
import { decodeCoverStoryState, decodePlayerIntentState } from "../domain/codec";
import type { CoverStoryState, DomainParticipantRole, PlayerIntentState } from "../domain/model";

export function mapRuntimeParticipantRole(
  role: RuntimeParticipant["role"]
): DomainParticipantRole {
  if (role === "host") {
    return "host-display";
  }
  if (role === "controller" || role === "host-display" || role === "spectator" || role === "logic") {
    return role as DomainParticipantRole;
  }
  throw new Error(`Unsupported Cover Story participant role: ${role}`);
}

function mapParticipant(participant: RuntimeParticipant): RuntimeParticipantValue {
  return {
    id: participant.id,
    name: participant.screenName,
    connected: participant.connected,
    role: mapRuntimeParticipantRole(participant.role)
  };
}

function mapContext(context: SurfaceContext): RuntimeContextValue {
  return {
    surfaceKind: mapRuntimeParticipantRole(context.surfaceKind),
    participantId: context.participantId,
    authorityParticipantId: context.authorityParticipantId,
    isAuthority: context.isAuthority,
    roomId: context.roomId || context.gameInstanceId || "local-preview"
  };
}

function mapMutation(result: StateMutationResult): MutationResult {
  return result;
}

export class TpgRuntimeAdapter implements RuntimePort {
  constructor(
    private readonly api: IframeGameRuntimeApi<CoverStoryState, PlayerIntentState>
  ) {}

  context(): RuntimeContextValue {
    return mapContext(this.api.context());
  }

  participants(): RuntimeParticipantValue[] {
    return this.api.participants().map(mapParticipant);
  }

  sharedState() {
    const snapshot = this.api.getSharedStateSnapshot();
    return { value: decodeCoverStoryState(snapshot.value), revision: snapshot.revision };
  }

  ownPlayerState() {
    const snapshot = this.api.getPlayerStateSnapshot();
    return {
      value: decodePlayerIntentState(snapshot?.value),
      revision: snapshot?.revision ?? 0
    };
  }

  async writeSharedState(value: CoverStoryState, expectedRevision: number) {
    return mapMutation(await this.api.setSharedState(value, { expectedRevision }));
  }

  async writeOwnPlayerState(value: PlayerIntentState, expectedRevision: number) {
    const confirmedRevision = this.api.getPlayerStateSnapshot()?.revision ?? expectedRevision;
    const result = await this.api.setPlayerState(value, undefined, {
      expectedRevision: confirmedRevision
    });
    if (result.status === "rejected" && result.reason === "stale-revision") {
      return mapMutation(
        await this.api.setPlayerState(value, undefined, { expectedRevision: result.revision })
      );
    }
    return mapMutation(result);
  }

  subscribeSharedState(listener: Parameters<RuntimePort["subscribeSharedState"]>[0]) {
    return this.api.subscribeSharedState(() => listener(this.sharedState()));
  }

  subscribePlayerState(listener: Parameters<RuntimePort["subscribePlayerState"]>[0]) {
    for (const participant of this.api.participants()) {
      const snapshot = this.api.getPlayerStateSnapshot(participant.id);
      if (snapshot?.value !== undefined) {
        listener(participant.id, {
          value: decodePlayerIntentState(snapshot.value),
          revision: snapshot.revision
        });
      }
    }
    return this.api.subscribePlayerState((participantId) => {
      const snapshot = this.api.getPlayerStateSnapshot(participantId);
      listener(participantId, {
        value: decodePlayerIntentState(snapshot?.value),
        revision: snapshot?.revision ?? 0
      });
    });
  }

  subscribeParticipants(listener: Parameters<RuntimePort["subscribeParticipants"]>[0]) {
    return this.api.subscribeParticipants((participants) => listener(participants.map(mapParticipant)));
  }

  subscribeContext(listener: Parameters<RuntimePort["subscribeContext"]>[0]) {
    return this.api.subscribeShellEvent<SurfaceContext>("runtime:context", (context) => {
      listener(mapContext(context));
    });
  }

  subscribeLifecycle(listener: Parameters<RuntimePort["subscribeLifecycle"]>[0]) {
    return this.api.subscribeLifecycle(listener);
  }

  reportReady() {
    return this.api.reportLoading(true);
  }

  openSettings() {
    return this.api.openSettings();
  }

  returnToLobby() {
    return this.api.returnToLobby();
  }

  reportAnalytics(event: Parameters<RuntimePort["reportAnalytics"]>[0]) {
    return this.api.reportAnalytics(event);
  }
}
