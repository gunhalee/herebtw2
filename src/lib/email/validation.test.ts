import { describe, expect, it } from "vitest";
import { hashNotificationVerificationToken } from "./notification-verification";
import { escapeHtml, normalizeNotificationEmail } from "./validation";

describe("notification email safety", () => {
  it("normalizes valid addresses and rejects malformed input", () => {
    expect(normalizeNotificationEmail(" USER@Example.COM ")).toEqual({
      ok: true,
      value: "user@example.com",
    });
    expect(normalizeNotificationEmail("not-an-email").ok).toBe(false);
  });

  it("escapes user-controlled HTML and hashes verification tokens", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(hashNotificationVerificationToken("secret-token")).toMatch(
      /^[0-9a-f]{64}$/u,
    );
  });
});
