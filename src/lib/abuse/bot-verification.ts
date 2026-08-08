import { checkBotId } from "botid/server";
import { fail } from "../api/response";
import { logAbuseEvent } from "./log-event";

type BotEnforcementMode = "enforce" | "off" | "shadow";

function getBotEnforcementMode(): BotEnforcementMode {
  const configured = process.env.BOTID_ENFORCEMENT_MODE;

  if (configured === "enforce" || configured === "off" || configured === "shadow") {
    return configured;
  }

  return process.env.VERCEL === "1" ? "enforce" : "shadow";
}

export async function getBotRejectionResponse(action: string) {
  const mode = getBotEnforcementMode();

  if (mode === "off") {
    return null;
  }

  try {
    const verification = await checkBotId();

    if (!verification.isBot) {
      return null;
    }

    await logAbuseEvent(
      "bot_detected",
      {},
      {
        action,
        decision: mode === "enforce" ? "block" : "shadow",
        reasonCode: "botid_basic",
      },
    );

    return mode === "enforce"
      ? fail(
          {
            code: "REQUEST_VERIFICATION_FAILED",
            message: "요청을 확인하지 못했습니다. 새로고침 후 다시 시도해 주세요.",
          },
          403,
        )
      : null;
  } catch (error) {
    console.error("[abuse] BotID verification failed:", error);

    return mode === "enforce"
      ? fail(
          {
            code: "PROTECTION_UNAVAILABLE",
            message: "보호 기능을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
          },
          503,
        )
      : null;
  }
}
