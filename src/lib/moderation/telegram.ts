const TELEGRAM_API_ROOT = "https://api.telegram.org";

function isEnabled() {
  return process.env.TELEGRAM_MODERATION_ALERTS_ENABLED?.trim() !== "false";
}

function formatNotification(eventType: string, payload: Record<string, unknown>) {
  const caseId = typeof payload.casePublicId === "string" ? payload.casePublicId : null;
  const baseUrl = process.env.MODERATION_OPS_BASE_URL?.replace(/\/$/, "");
  const link = caseId && baseUrl ? `\n${baseUrl}/ops/moderation/${encodeURIComponent(caseId)}` : "";
  if (eventType === "case_opened") {
    return `새 검수 건이 격리되었습니다.\n우선순위: ${String(payload.priority ?? "normal")}\n위험도: ${String(payload.riskBand ?? "unknown")}${link}`;
  }
  if (eventType === "case_decided") {
    return `검수 건이 처리되었습니다.\n결정: ${String(payload.action ?? "unknown")}${link}`;
  }
  if (eventType === "case_overdue_12h") {
    return `검수 대기 시간이 12시간을 넘었습니다. 자동 공개되지 않으며 계속 격리됩니다.${link}`;
  }
  if (eventType === "moderation_worker_failed") {
    return `보조 판정 worker가 반복 실패했습니다. 글은 계속 격리되며 수동 검수가 필요합니다.${link}`;
  }
  if (eventType === "google_budget_warning") {
    return `Google moderation 예상 비용이 $50 경고선에 도달했습니다.\n기간: ${String(payload.billingPeriod ?? "")}`;
  }
  if (eventType === "google_budget_hard_stop") {
    return `Google moderation 월 $100 상한으로 외부 호출을 중단했습니다.\n기간: ${String(payload.billingPeriod ?? "")}`;
  }
  return `moderation 알림: ${eventType}`;
}

export async function sendModerationTelegramNotification(
  eventType: string,
  payload: Record<string, unknown>,
) {
  if (!isEnabled()) return;
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_MONITOR_CHANNEL_ID?.trim();
  if (!token || !chatId) throw new Error("Telegram moderation configuration is incomplete.");
  const response = await fetch(`${TELEGRAM_API_ROOT}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      disable_web_page_preview: true,
      text: formatNotification(eventType, payload),
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body.slice(0, 300)}`);
  }
}

export async function sendTelegramText(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) throw new Error("Missing TELEGRAM_BOT_TOKEN.");
  const response = await fetch(`${TELEGRAM_API_ROOT}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, disable_web_page_preview: true, text }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Telegram command reply failed: ${response.status}`);
}
