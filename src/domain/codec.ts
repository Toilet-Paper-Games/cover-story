import { GAME_SCHEMA_VERSION, type CoverStoryState, type PlayerIntentState } from "./model";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function decodeCoverStoryState(value: unknown): CoverStoryState | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (
    !isRecord(value) ||
    value.schemaVersion !== GAME_SCHEMA_VERSION ||
    typeof value.sessionId !== "string" ||
    typeof value.sequence !== "number" ||
    typeof value.phase !== "string" ||
    !Array.isArray(value.roster) ||
    !isRecord(value.scores)
  ) {
    throw new Error("The room returned an invalid Cover Story shared-state snapshot.");
  }
  return value as unknown as CoverStoryState;
}

export function decodePlayerIntentState(value: unknown): PlayerIntentState | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new Error("The room returned an invalid Cover Story player-state snapshot.");
  }
  const pendingIntent = value.pendingIntent;
  if (pendingIntent === undefined) {
    return {};
  }
  if (
    !isRecord(pendingIntent) ||
    typeof pendingIntent.id !== "string" ||
    typeof pendingIntent.expectedSequence !== "number" ||
    !isRecord(pendingIntent.payload) ||
    typeof pendingIntent.payload.kind !== "string"
  ) {
    throw new Error("The room returned an invalid Cover Story player intent.");
  }
  return value as unknown as PlayerIntentState;
}
