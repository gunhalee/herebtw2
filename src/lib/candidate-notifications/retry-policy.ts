const RETRY_DELAYS_SECONDS = [60, 5 * 60, 30 * 60, 2 * 60 * 60, 12 * 60 * 60] as const;

export function getReplyNotificationRetry(input: {
  attempts: number;
  now?: Date;
  jitter?: number;
}) {
  const retryIndex = input.attempts - 1;
  if (retryIndex < 0 || retryIndex >= RETRY_DELAYS_SECONDS.length) {
    return { status: "dead" as const, nextAttemptAt: null };
  }

  const baseDelay = RETRY_DELAYS_SECONDS[retryIndex];
  const boundedJitter = Math.max(0, Math.min(input.jitter ?? Math.random(), 1));
  const jitterSeconds = Math.floor(baseDelay * 0.1 * boundedJitter);
  const now = input.now ?? new Date();

  return {
    status: "retry" as const,
    nextAttemptAt: new Date(now.getTime() + (baseDelay + jitterSeconds) * 1000),
  };
}
