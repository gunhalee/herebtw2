import { supabaseInsert } from "../supabase/rest";

const SENSITIVE_KEYS = /content|email|token|latitude|longitude|coordinate|ip/i;

function sanitizePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload)
      .filter(([key, value]) => !SENSITIVE_KEYS.test(key) && value !== undefined)
      .map(([key, value]) => {
        if (
          value === null ||
          typeof value === "boolean" ||
          typeof value === "number" ||
          typeof value === "string"
        ) {
          return [key, typeof value === "string" ? value.slice(0, 200) : value];
        }

        return [key, String(value).slice(0, 200)];
      }),
  );
}

export async function logAbuseEvent(
  eventType: string,
  payload: Record<string, unknown> = {},
  options?: {
    action?: string;
    decision?: "allow" | "block" | "challenge" | "shadow" | "quarantine";
    deviceId?: string | null;
    reasonCode?: string;
    subjectHash?: string | null;
  },
) {
  try {
    await supabaseInsert("abuse_logs", {
      action: options?.action ?? null,
      decision: options?.decision ?? null,
      device_id: options?.deviceId ?? null,
      event_type: eventType,
      payload: sanitizePayload(payload),
      reason_code: options?.reasonCode ?? null,
      subject_hash: options?.subjectHash ?? null,
    });

    return { persisted: true };
  } catch (error) {
    console.error("[abuse] Failed to persist abuse event:", eventType, error);
    return { persisted: false };
  }
}
