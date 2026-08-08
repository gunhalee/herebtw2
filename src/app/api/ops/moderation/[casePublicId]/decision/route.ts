import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createModerationTextViews, fingerprintContent } from "../../../../../../lib/abuse/content-normalization";
import { evaluateModerationContent } from "../../../../../../lib/moderation/decision-engine";
import { decryptModerationEvidence } from "../../../../../../lib/moderation/evidence-crypto";
import { getOpsSession, verifyOpsMutationRequest } from "../../../../../../lib/moderation/ops-auth";
import { applyModerationDecision, loadModerationCaseDetail, recordModerationAccess } from "../../../../../../lib/moderation/repository";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ casePublicId: string }> }) {
  const session = await getOpsSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const form = await request.formData();
  if (!verifyOpsMutationRequest(request, String(form.get("csrf") ?? ""), session.csrf)) return new NextResponse("Forbidden", { status: 403 });
  const { casePublicId } = await params;
  const actionValue = String(form.get("action") ?? "");
  if (actionValue !== "publish" && actionValue !== "reject" && actionValue !== "restore") return new NextResponse("Invalid action", { status: 400 });
  const detail = await loadModerationCaseDetail(casePublicId);
  if (!detail?.evidence) return new NextResponse("Case or evidence not found", { status: 404 });
  const plaintext = decryptModerationEvidence({
    aadVersion: detail.evidence.aad_version,
    authTagBase64: detail.evidence.auth_tag_base64,
    casePublicId,
    ciphertextBase64: detail.evidence.ciphertext_base64,
    createdAt: detail.evidence.created_at,
    keyVersion: detail.evidence.key_version,
    nonceBase64: detail.evidence.nonce_base64,
    policyVersion: detail.moderationCase.policy_version,
  });
  const views = createModerationTextViews(plaintext);
  const fingerprint = fingerprintContent(plaintext);
  const assessment = evaluateModerationContent({ content: plaintext, profile: detail.moderationCase.source === "candidate_first_message" ? "candidate_first_message" : "citizen_post" });
  await applyModerationDecision({
    action: actionValue,
    casePublicId,
    contentFingerprint: fingerprint.fingerprint,
    contentHmac: assessment.contentDecisionKey,
    loose: views.loose,
    normalizationVersion: views.normalizationVersion,
    note: String(form.get("note") ?? "").slice(0, 1000),
    operatorId: session.operatorId,
    plaintext,
    policyVersion: assessment.policyVersion,
    reasonCode: String(form.get("reasonCode") ?? "operator_review").slice(0, 100),
    strict: views.strict,
  });
  const requestHeaders = await headers();
  await recordModerationAccess({ action: `decision:${actionValue}`, caseId: detail.moderationCase.id, operatorId: session.operatorId, requestId: requestHeaders.get("x-vercel-id") ?? undefined });
  return NextResponse.redirect(new URL(`/ops/moderation/${casePublicId}`, request.url), 303);
}
