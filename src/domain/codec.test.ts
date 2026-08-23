import { describe, expect, it } from "vitest";

import { decodeCoverStoryState } from "./codec";

describe("decodeCoverStoryState", () => {
  it("treats a previous game's shared snapshot as uninitialized", () => {
    expect(decodeCoverStoryState({ messages: [], stage: "lobby" })).toBeUndefined();
  });

  it("rejects a malformed snapshot that claims the Cover Story schema", () => {
    expect(() => decodeCoverStoryState({ schemaVersion: 1, sessionId: "session" })).toThrow(
      "invalid Cover Story shared-state snapshot"
    );
  });
});
