import { describe, expect, it } from "vitest";

import { mapRuntimeParticipantRole } from "./tpgRuntime";

describe("mapRuntimeParticipantRole", () => {
  it("normalizes the production host participant to the passive display role", () => {
    expect(mapRuntimeParticipantRole("host")).toBe("host-display");
  });
});
