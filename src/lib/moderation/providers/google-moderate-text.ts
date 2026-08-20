import { getVercelOidcToken } from "@vercel/oidc";
import { IdentityPoolClient } from "google-auth-library";
import { createHash } from "node:crypto";

export type GoogleModerationAssessment = {
  categories: Record<string, number>;
  latencyMs: number;
  providerVersion: "google-language-moderateText-v2";
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

async function getGoogleAccessToken() {
  const projectNumber = required("GCP_PROJECT_NUMBER");
  const poolId = required("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const providerId = required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
  const serviceAccount = required("GCP_SERVICE_ACCOUNT_EMAIL");
  const client = new IdentityPoolClient({
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_supplier: {
      getSubjectToken: async () => getVercelOidcToken(),
    },
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    type: "external_account",
    service_account_impersonation_url:
      `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccount)}:generateAccessToken`,
  });
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("Google access token was empty.");
  return token.token;
}

export function isGoogleModerationEnabled() {
  const explicit = process.env.MODERATION_GOOGLE_MODE?.trim();
  if (explicit) return explicit !== "off";
  return process.env.VERCEL_ENV !== "preview";
}

/* 기본값과 상한이 모두 1이다. 예전에는 상한이 0.1 이라 MODERATION_GOOGLE_SAMPLE_RATE
   에 1을 넣어도 10%만 나갔고, 운영 기본값은 0.01(1%)이었다. 그래서 검토 건이 생겨도
   provider_status 가 대부분 skipped_sampling 으로 끝나 실제 사용량이 잡히지 않았다.
   비용은 여기서 막지 않는다 — reserve_moderation_provider_units 가 월 단위로 막는다
   (무료 5만 유닛, $50 경고, $100 하드스톱). 줄이려면 MODERATION_GOOGLE_SAMPLE_RATE 에
   0~1 사이 값을 주거나 MODERATION_GOOGLE_MODE=off 로 끈다. */
export function shouldUseGoogleModeration(casePublicId: string) {
  const mode = process.env.MODERATION_GOOGLE_MODE?.trim()
    || (process.env.VERCEL_ENV === "preview" ? "off" : "shadow");
  if (mode === "off") return false;
  const configuredRate = Number(process.env.MODERATION_GOOGLE_SAMPLE_RATE ?? 1);
  const sampleRate = Math.max(0, Math.min(1, Number.isFinite(configuredRate) ? configuredRate : 1));
  if (sampleRate >= 1) return true;
  const bucket = createHash("sha256").update(casePublicId).digest().readUInt32BE(0) / 0x1_0000_0000;
  return bucket < sampleRate;
}

export async function moderateTextWithGoogle(content: string): Promise<GoogleModerationAssessment> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.MODERATION_GOOGLE_TIMEOUT_MS || 5000),
  );
  try {
    const accessToken = await getGoogleAccessToken();
    const response = await fetch("https://language.googleapis.com/v2/documents:moderateText", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-goog-user-project": required("GCP_PROJECT_ID"),
      },
      body: JSON.stringify({ document: { content, type: "PLAIN_TEXT" } }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Google moderateText failed: ${response.status} ${(await response.text()).slice(0, 300)}`);
    }
    const body = await response.json() as {
      moderationCategories?: Array<{ confidence?: number; name?: string }>;
    };
    return {
      categories: Object.fromEntries(
        (body.moderationCategories ?? [])
          .filter((item): item is { confidence: number; name: string } =>
            typeof item.name === "string" && typeof item.confidence === "number",
          )
          .map((item) => [item.name, item.confidence]),
      ),
      latencyMs: Date.now() - startedAt,
      providerVersion: "google-language-moderateText-v2",
    };
  } finally {
    clearTimeout(timeout);
  }
}
