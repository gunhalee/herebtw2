const CARD_REPLY_CONTENT_MAX_LENGTH = 200;

export function formatReplyContentForCard(content: string) {
  const normalized = content.trim();

  if (normalized.length <= CARD_REPLY_CONTENT_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, CARD_REPLY_CONTENT_MAX_LENGTH - 1).trimEnd()}…`;
}
