export function getWriteCooldownState(
  elapsedSecondsSinceLastWrite: number,
): {
  cooldownRemainingSeconds: number;
} {
  const limitSeconds = 30;
  const cooldownRemainingSeconds = Math.max(0, limitSeconds - elapsedSecondsSinceLastWrite);

  return {
    cooldownRemainingSeconds:
      elapsedSecondsSinceLastWrite === 0 ? 0 : cooldownRemainingSeconds,
  };
}
