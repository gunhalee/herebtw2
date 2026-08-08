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

export function shouldUseGoogleModeration(casePublicId: string) {
  const mode = process.env.MODERATION_GOOGLE_MODE?.trim()
    || (process.env.VERCEL_ENV === "preview" ? "off" : "shadow");
  if (mode === "off") return false;
  const defaultRate = mode === "uncertain" ? 0.1 : process.env.VERCEL_ENV === "production" ? 0.01 : 0.1;
  const configuredRate = Number(process.env.MODERATION_GOOGLE_SAMPLE_RATE ?? defaultRate);
  const sampleRate = Math.max(0, Math.min(0.1, Number.isFinite(configuredRate) ? configuredRate : defaultRate));
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
