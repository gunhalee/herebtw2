import { ensureReportedPostModerationCase } from "../moderation/reported-post-case";
import { reportPostRepository } from "./repository";

const MAX_REPORT_REASON_CODE_LENGTH = 64;
const REPORT_REASON_CODES = new Set([
  "hate_or_abuse",
  "misinformation",
  "spam_or_ad",
  "other_policy",
]);

type ReportPostInput = {
  deviceId?: string;
  postId: string;
  reasonCode?: string;
};

type ReportPostResult =
  | { ok: true; postId: string }
  | {
      code: "INVALID_DEVICE_ID" | "INVALID_REASON_CODE";
      message: string;
      ok: false;
    };

function normalizeReportReasonCode(reasonCode: string | null | undefined) {
  const normalized = reasonCode?.trim() ?? "";
  return normalized
    && normalized.length <= MAX_REPORT_REASON_CODE_LENGTH
    && REPORT_REASON_CODES.has(normalized)
    ? normalized
    : null;
}

export async function reportPost(input: ReportPostInput): Promise<ReportPostResult> {
  const deviceId = input.deviceId?.trim();
  if (!deviceId) {
    return { code: "INVALID_DEVICE_ID", message: "기기 정보를 확인할 수 없습니다.", ok: false };
  }
  const reasonCode = normalizeReportReasonCode(input.reasonCode);
  if (!reasonCode) {
    return { code: "INVALID_REASON_CODE", message: "신고 사유를 다시 선택해 주세요.", ok: false };
  }
  const result = await reportPostRepository(input.postId, reasonCode, deviceId);
  try {
    await ensureReportedPostModerationCase({ postId: input.postId, reasonCode });
  } catch (error) {
    console.error("[moderation] Failed to create report review case:", error);
  }
  return { ok: true, postId: result.postId };
}
