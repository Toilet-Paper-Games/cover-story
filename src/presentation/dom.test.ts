import { describe, expect, it } from "vitest";
import { surfaceAssetPath } from "./dom";

describe("surfaceAssetPath", () => {
  it("uses the authoring root in Workbench and the colocated bundle path in production", () => {
    expect(surfaceAssetPath("cover-story-logo.png", "/surfaces/host.html")).toBe(
      "/assets/cover-story-logo.png"
    );
    expect(
      surfaceAssetPath(
        "cover-story-logo.png",
        "/published-assets/cover-story/0.2.1/host.html"
      )
    ).toBe("./assets/cover-story-logo.png");
  });
});
