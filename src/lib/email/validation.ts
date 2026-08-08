const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function normalizeNotificationEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLocaleLowerCase("en-US") ?? "";

  if (!normalized) {
    return { ok: true as const, value: undefined };
  }

  if (normalized.length > 255 || !EMAIL_PATTERN.test(normalized)) {
    return {
      ok: false as const,
      message: "이메일 주소를 다시 확인해 주세요.",
    };
  }

  return { ok: true as const, value: normalized };
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
