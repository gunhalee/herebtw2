import { describe, expect, it } from "vitest";
import {
  decodeCandidateDashboardCursor,
  encodeCandidateDashboardCursor,
} from "./cursor";

const parts = {
  agreeCount: 12,
  createdAt: "2026-08-09T00:00:00.000Z",
  postId: "11111111-1111-4111-8111-111111111111",
};

describe("candidate dashboard cursor", () => {
  it("round trips valid cursor parts", () => {
    const encoded = encodeCandidateDashboardCursor("open", parts);
    expect(encoded).not.toBeNull();
    expect(decodeCandidateDashboardCursor(encoded!, "open")).toEqual(parts);
  });

  it("rejects cursors from another filter", () => {
    const encoded = encodeCandidateDashboardCursor("open", parts);
    expect(decodeCandidateDashboardCursor(encoded!, "mine")).toBeNull();
  });

  it("rejects malformed input", () => {
    expect(decodeCandidateDashboardCursor("not-json", "open")).toBeNull();
  });
});
