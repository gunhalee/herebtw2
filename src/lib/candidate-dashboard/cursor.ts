import type {
  CandidateDashboardCursorParts,
  CandidateDashboardFilter,
} from "./types";

type CandidateDashboardCursorV1 = CandidateDashboardCursorParts & {
  v: 1;
  filter: CandidateDashboardFilter;
};

const MAX_ENCODED_CURSOR_LENGTH = 512;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function encodeCandidateDashboardCursor(
  filter: CandidateDashboardFilter,
  parts: CandidateDashboardCursorParts | null | undefined,
) {
  if (!parts) return null;
  return Buffer.from(JSON.stringify({ v: 1, filter, ...parts }), "utf8").toString("base64url");
}

export function decodeCandidateDashboardCursor(
  encoded: string,
  expectedFilter: CandidateDashboardFilter,
): CandidateDashboardCursorParts | null {
  if (!encoded || encoded.length > MAX_ENCODED_CURSOR_LENGTH) return null;
  try {
    const decoded = Buffer.from(encoded, "base64url").toString("utf8");
    if (Buffer.byteLength(decoded, "utf8") > 384) return null;
    const value = JSON.parse(decoded) as Partial<CandidateDashboardCursorV1>;
    if (
      value.v !== 1 ||
      value.filter !== expectedFilter ||
      !Number.isInteger(value.agreeCount) ||
      (value.agreeCount ?? -1) < 0 ||
      (value.agreeCount ?? 0) > 2_147_483_647 ||
      typeof value.createdAt !== "string" ||
      !Number.isFinite(Date.parse(value.createdAt)) ||
      typeof value.postId !== "string" ||
      !UUID_PATTERN.test(value.postId)
    ) {
      return null;
    }
    return {
      agreeCount: value.agreeCount,
      createdAt: value.createdAt,
      postId: value.postId,
    } as CandidateDashboardCursorParts;
  } catch {
    return null;
  }
}
