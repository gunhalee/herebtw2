export async function logAbuseEvent(
  eventType: string,
  payload: Record<string, unknown>,
) {
  return {
    eventType,
    payload,
    createdAt: new Date().toISOString(),
  };
}
