import {
  supabaseInsert,
  supabasePatchMinimal,
  supabaseRpc,
  supabaseSelect,
  supabaseUpsert,
} from "../supabase/rest";
import {
  normalizeModerationEvidenceRelation,
  type ModerationCaseEvidenceApiRow,
} from "./evidence-relation";

export type ModerationQueueJob = {
  enqueued_at: string;
  message: { casePublicId?: string };
  msg_id: number;
  read_count: number;
  vt: string;
};

export async function claimModerationJobs(limit = 10) {
  return (
    await supabaseRpc<ModerationQueueJob[]>("claim_content_moderation_jobs", {
      p_limit: limit,
      p_visibility_timeout: 90,
    })
  ) ?? [];
}

export async function completeModerationJob(messageId: number) {
  return supabaseRpc<boolean>("complete_content_moderation_job", {
    p_msg_id: messageId,
  });
}

export async function loadModerationCaseEvidence(casePublicId: string) {
  const rows = await supabaseSelect<ModerationCaseEvidenceApiRow[]>(
    `moderation_cases?select=id,public_id,policy_version,provider_status,state,content_decision_key,moderation_evidence(aad_version,auth_tag_base64,ciphertext_base64,created_at,key_version,nonce_base64)&public_id=eq.${encodeURIComponent(casePublicId)}&limit=1`,
  );
  const row = rows?.[0];
  return row
    ? {
        ...row,
        moderation_evidence: normalizeModerationEvidenceRelation(row.moderation_evidence),
      }
    : null;
}

export async function recordModerationProviderResult(input: {
  casePublicId: string;
  categories: Record<string, number>;
  providerVersion: string;
  status: "completed" | "failed" | "skipped_budget" | "skipped_sampling";
}) {
  await supabaseRpc("record_moderation_provider_result", {
    p_case_public_id: input.casePublicId,
    p_categories: input.categories,
    p_provider_version: input.providerVersion,
    p_status: input.status,
  });
}

export async function reserveGoogleModerationUnits(units: number) {
  const rows = await supabaseRpc<Array<{
    allowed: boolean;
    estimated_cost_usd: number;
    hard_stop_due: boolean;
    warning_due: boolean;
  }>>("reserve_moderation_provider_units", {
    p_hard_stop_usd: Number(process.env.MODERATION_GOOGLE_MONTHLY_BUDGET_USD || 100),
    p_units: units,
    p_warning_usd: Number(process.env.MODERATION_GOOGLE_WARNING_USD || 50),
  });
  return rows?.[0] ?? { allowed: false, estimated_cost_usd: 0, hard_stop_due: false, warning_due: false };
}

export async function loadModerationDecisionCache(contentDecisionKey: string) {
  const rows = await supabaseSelect<Array<{
    categories: Record<string, number>;
    provider_version: string;
  }>>(
    `moderation_decision_cache?select=categories,provider_version&content_decision_key=eq.${contentDecisionKey}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function storeModerationDecisionCache(input: {
  categories: Record<string, number>;
  contentDecisionKey: string;
  policyVersion: string;
  providerVersion: string;
}) {
  await supabaseUpsert("moderation_decision_cache?on_conflict=content_decision_key&select=content_decision_key", {
    categories: input.categories,
    content_decision_key: input.contentDecisionKey,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    policy_version: input.policyVersion,
    provider_version: input.providerVersion,
  });
}

export async function loadPendingModerationNotifications(limit = 10) {
  return (
    await supabaseRpc<Array<{
      attempts: number;
      event_type: string;
      id: string;
      payload: Record<string, unknown>;
    }>>("claim_moderation_notifications", { p_limit: limit })
  ) ?? [];
}

export async function markModerationNotificationSent(id: string) {
  await supabasePatchMinimal(`moderation_notification_outbox?id=eq.${id}`, {
    locked_until: null,
    sent_at: new Date().toISOString(),
  });
}

export async function markModerationNotificationFailed(id: string, attempts: number, error: string) {
  const delaySeconds = Math.min(3600, 30 * 2 ** Math.min(attempts, 7));
  await supabasePatchMinimal(`moderation_notification_outbox?id=eq.${id}`, {
    attempts: attempts + 1,
    available_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
    last_error: error.slice(0, 500),
    locked_until: null,
  });
}

export async function cleanupExpiredModerationData() {
  return supabaseRpc<Record<string, number>>("cleanup_expired_moderation_data", {});
}

export type ModerationCaseListRow = {
  id: string;
  opened_at: string;
  operation: string;
  policy_version: string;
  priority: "high" | "normal" | "urgent";
  provider_status: string;
  public_id: string;
  reason_codes: string[];
  risk_band: string;
  source: string;
  state: "open" | "published" | "rejected";
};

export async function listModerationCases(state = "open", limit = 50) {
  return (
    await supabaseSelect<ModerationCaseListRow[]>(
      `moderation_cases?select=id,public_id,source,operation,state,priority,risk_band,reason_codes,policy_version,provider_status,opened_at&state=eq.${encodeURIComponent(state)}&order=opened_at.asc&limit=${Math.max(1, Math.min(limit, 100))}`,
    )
  ) ?? [];
}

export type ModerationCaseDetail = ModerationCaseListRow & {
  decided_at: string | null;
  operator_id: string | null;
  post_id: string;
  provider_categories: Record<string, number>;
  provider_version: string | null;
};

export async function loadModerationCaseDetail(casePublicId: string) {
  const cases = await supabaseSelect<ModerationCaseDetail[]>(
    `moderation_cases?select=id,public_id,post_id,source,operation,state,priority,risk_band,reason_codes,policy_version,provider_status,provider_categories,provider_version,operator_id,opened_at,decided_at&public_id=eq.${encodeURIComponent(casePublicId)}&limit=1`,
  );
  const moderationCase = cases?.[0];
  if (!moderationCase) return null;
  const evidenceRows = await supabaseSelect<Array<{
    aad_version: 1;
    auth_tag_base64: string;
    ciphertext_base64: string;
    created_at: string;
    key_version: string;
    nonce_base64: string;
  }>>(
    `moderation_evidence?select=aad_version,auth_tag_base64,ciphertext_base64,created_at,key_version,nonce_base64&case_id=eq.${moderationCase.id}&limit=1`,
  );
  const decisions = await supabaseSelect<Array<{
    action: string;
    created_at: string;
    note: string | null;
    operator_id: string;
    reason_code: string;
  }>>(
    `moderation_decisions?select=action,operator_id,reason_code,note,created_at&case_id=eq.${moderationCase.id}&order=created_at.desc`,
  );
  return { moderationCase, evidence: evidenceRows?.[0] ?? null, decisions: decisions ?? [] };
}

export async function recordModerationAccess(input: {
  action: string;
  caseId?: string;
  operatorId: string;
  requestId?: string;
}) {
  await supabaseInsert("moderation_access_audit?select=id", {
    action: input.action,
    case_id: input.caseId ?? null,
    operator_id: input.operatorId,
    request_id: input.requestId ?? null,
  });
}

export async function applyModerationDecision(input: {
  action: "publish" | "reject" | "restore";
  casePublicId: string;
  contentFingerprint?: string;
  contentHmac?: string;
  loose?: string;
  normalizationVersion: number;
  note?: string;
  operatorId: string;
  plaintext?: string;
  policyVersion: string;
  reasonCode: string;
  strict?: string;
}) {
  await supabaseRpc("apply_moderation_decision", {
    p_action: input.action,
    p_case_public_id: input.casePublicId,
    p_content_fingerprint: input.contentFingerprint ?? null,
    p_content_hmac: input.contentHmac ?? null,
    p_normalization_version: input.normalizationVersion,
    p_normalized_content_loose: input.loose ?? null,
    p_normalized_content_strict: input.strict ?? null,
    p_note: input.note ?? "",
    p_operator_id: input.operatorId,
    p_plaintext_content: input.plaintext ?? null,
    p_policy_version: input.policyVersion,
    p_reason_code: input.reasonCode,
  });
}

export async function loadModerationMonitorStatus() {
  const [openCases, usage] = await Promise.all([
    supabaseSelect<Array<{ opened_at: string }>>(
      "moderation_cases?select=opened_at&state=eq.open&order=opened_at.asc&limit=1000",
    ),
    supabaseSelect<Array<{
      billable_units: number;
      estimated_cost_usd: number;
      request_count: number;
    }>>(
      `moderation_provider_usage?select=request_count,billable_units,estimated_cost_usd&billing_period=eq.${new Date().toISOString().slice(0, 7)}-01&limit=1`,
    ),
  ]);
  const oldest = openCases?.[0]?.opened_at ?? null;
  return {
    estimatedGoogleCostUsd: Number(usage?.[0]?.estimated_cost_usd ?? 0),
    googleRequests: Number(usage?.[0]?.request_count ?? 0),
    oldestAgeMinutes: oldest ? Math.floor((Date.now() - new Date(oldest).getTime()) / 60000) : 0,
    openCases: openCases?.length ?? 0,
  };
}

export async function enqueueOverdueModerationAlerts() {
  const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const rows = await supabaseSelect<Array<{ opened_at: string; public_id: string }>>(
    `moderation_cases?select=public_id,opened_at&state=eq.open&opened_at=lte.${encodeURIComponent(cutoff)}&limit=100`,
  );
  for (const item of rows ?? []) {
    await supabaseUpsert(
      "moderation_notification_outbox?on_conflict=event_key&select=id",
      {
        event_key: `case-overdue-12h:${item.public_id}`,
        event_type: "case_overdue_12h",
        payload: { casePublicId: item.public_id, openedAt: item.opened_at },
      },
    );
  }
  return rows?.length ?? 0;
}

export async function enqueueModerationWorkerFailureAlert(input: {
  casePublicId: string;
  error: string;
}) {
  await supabaseUpsert(
    "moderation_notification_outbox?on_conflict=event_key&select=id",
    {
      event_key: `worker-failed:${input.casePublicId}`,
      event_type: "moderation_worker_failed",
      payload: { casePublicId: input.casePublicId, errorCode: input.error.slice(0, 120) },
    },
  );
}
