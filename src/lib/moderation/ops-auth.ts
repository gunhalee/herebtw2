import { createHmac, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const MODERATION_OPS_COOKIE = "__Host-moderation_ops";
export const MODERATION_OPERATOR_ID = "lee-geonha";
const SESSION_INFO = "moderation-ops-session-v1";

type OpsSessionPayload = {
  csrf: string;
  exp: number;
  iat: number;
  operatorId: string;
  sessionId: string;
};

function getOpsSecret() {
  const value = process.env.MODERATION_OPS_SECRET?.trim();
  if (!value || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error("MODERATION_OPS_SECRET must be a lowercase 64-character hex key.");
  }
  if (value === process.env.MODERATION_EVIDENCE_KEY_CURRENT?.trim()) {
    throw new Error("Moderation ops and evidence keys must be different.");
  }
  return Buffer.from(value, "hex");
}

function sessionKey() {
  return Buffer.from(hkdfSync("sha256", getOpsSecret(), Buffer.alloc(0), SESSION_INFO, 32));
}

function sign(value: string) {
  return createHmac("sha256", sessionKey()).update(value).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyOpsSecret(candidate: string) {
  const expected = process.env.MODERATION_OPS_SECRET?.trim() ?? "";
  return /^[0-9a-f]{64}$/.test(candidate) && constantTimeEqual(candidate, expected);
}

export function createOpsSessionToken() {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.min(43200, Math.max(900, Number(process.env.MODERATION_OPS_SESSION_TTL_SECONDS || 43200)));
  const payload: OpsSessionPayload = {
    csrf: randomBytes(24).toString("base64url"),
    exp: now + ttl,
    iat: now,
    operatorId: MODERATION_OPERATOR_ID,
    sessionId: randomBytes(16).toString("hex"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { maxAge: ttl, token: `${encoded}.${sign(encoded)}` };
}

export function parseOpsSessionToken(token: string | undefined): OpsSessionPayload | null {
  if (!token) return null;
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra || !constantTimeEqual(sign(encoded), signature)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OpsSessionPayload;
    if (payload.exp <= Math.floor(Date.now() / 1000) || payload.operatorId !== MODERATION_OPERATOR_ID) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getOpsSession() {
  return parseOpsSessionToken((await cookies()).get(MODERATION_OPS_COOKIE)?.value);
}

export function isSafeOpsNextPath(value: string | null) {
  return value?.startsWith("/ops/") && !value.startsWith("//") ? value : "/ops/moderation";
}

export function verifyOpsMutationRequest(request: Request, csrf: string, expectedCsrf: string) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  return Boolean(origin === requestOrigin && constantTimeEqual(csrf, expectedCsrf));
}
