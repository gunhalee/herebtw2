import { timingSafeEqual } from "node:crypto";
import { loadModerationMonitorStatus } from "../../../../lib/moderation/repository";
import { sendTelegramText } from "../../../../lib/moderation/telegram";

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    from?: { id?: number };
    text?: string;
  };
};

export const runtime = "nodejs";

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "";
  const actualSecret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!expectedSecret || !equal(expectedSecret, actualSecret)) return new Response(null, { status: 401 });
  const update = await request.json() as TelegramUpdate;
  const chatId = String(update.message?.chat?.id ?? "");
  const userId = String(update.message?.from?.id ?? "");
  const allowedChat = process.env.TELEGRAM_MONITOR_CHANNEL_ID?.trim() ?? "";
  const allowedUsers = new Set((process.env.TELEGRAM_OPERATOR_USER_IDS ?? "").split(",").map((item) => item.trim()).filter(Boolean));
  if (!equal(chatId, allowedChat) || !allowedUsers.has(userId)) return new Response(null, { status: 204 });
  const command = update.message?.text?.trim().split(/\s+/u)[0]?.split("@")[0];
  if (!command || !["/status", "/queue", "/help"].includes(command)) return new Response(null, { status: 204 });
  if (command === "/help") {
    await sendTelegramText(chatId, "읽기 전용 명령\n/status 전체 상태\n/queue 검수 대기 상태\n결정과 원문 열람은 웹 운영 도구에서만 가능합니다.");
    return new Response(null, { status: 204 });
  }
  const status = await loadModerationMonitorStatus();
  const baseUrl = process.env.MODERATION_OPS_BASE_URL?.replace(/\/$/, "") ?? "";
  const text = command === "/queue"
    ? `검수 대기: ${status.openCases}건\n가장 오래된 건: ${status.oldestAgeMinutes}분\n${baseUrl}/ops/moderation`
    : `moderation 상태\n대기: ${status.openCases}건\n가장 오래된 건: ${status.oldestAgeMinutes}분\nGoogle 호출: ${status.googleRequests}건\n예상 비용: $${status.estimatedGoogleCostUsd.toFixed(2)}`;
  await sendTelegramText(chatId, text);
  return new Response(null, { status: 204 });
}
