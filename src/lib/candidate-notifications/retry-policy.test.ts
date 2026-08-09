import { describe, expect, it } from "vitest";
import { getReplyNotificationRetry } from "./retry-policy";

describe("getReplyNotificationRetry", () => {
  const now = new Date("2026-08-09T00:00:00.000Z");

  it.each([
    [1, 60],
    [2, 300],
    [3, 1800],
    [4, 7200],
    [5, 43200],
  ])("schedules attempt %i after %i seconds", (attempts, seconds) => {
    const result = getReplyNotificationRetry({ attempts, now, jitter: 0 });
    expect(result.status).toBe("retry");
    expect(result.nextAttemptAt?.toISOString()).toBe(
      new Date(now.getTime() + seconds * 1000).toISOString(),
    );
  });

  it("moves the sixth failure to dead", () => {
    expect(getReplyNotificationRetry({ attempts: 6, now, jitter: 0 })).toEqual({
      status: "dead",
      nextAttemptAt: null,
    });
  });
});
