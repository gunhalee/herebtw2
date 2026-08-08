import { decryptModerationEvidence } from "./evidence-crypto";
import { moderateTextWithGoogle, shouldUseGoogleModeration } from "./providers/google-moderate-text";
import {
  completeModerationJob,
  claimModerationJobs,
  cleanupExpiredModerationData,
  enqueueOverdueModerationAlerts,
  enqueueModerationWorkerFailureAlert,
  loadModerationCaseEvidence,
  loadModerationDecisionCache,
  loadPendingModerationNotifications,
  markModerationNotificationFailed,
  markModerationNotificationSent,
  recordModerationProviderResult,
  reserveGoogleModerationUnits,
  storeModerationDecisionCache,
} from "./repository";
import { sendModerationTelegramNotification } from "./telegram";

async function processCase(casePublicId: string) {
  const moderationCase = await loadModerationCaseEvidence(casePublicId);
  if (!moderationCase || moderationCase.state !== "open") return;
  if (!shouldUseGoogleModeration(casePublicId)) {
    await recordModerationProviderResult({
      casePublicId, categories: {}, providerVersion: "google-language-moderateText-v2", status: "skipped_sampling",
    });
    return;
  }
  const cached = await loadModerationDecisionCache(moderationCase.content_decision_key);
  if (cached) {
    await recordModerationProviderResult({
      casePublicId,
      categories: cached.categories,
      providerVersion: cached.provider_version,
      status: "completed",
    });
    return;
  }
  const evidence = moderationCase.moderation_evidence[0];
  if (!evidence) throw new Error("Moderation evidence is missing.");
  const content = decryptModerationEvidence({
    aadVersion: evidence.aad_version,
    authTagBase64: evidence.auth_tag_base64,
    casePublicId,
    ciphertextBase64: evidence.ciphertext_base64,
    createdAt: evidence.created_at,
    keyVersion: evidence.key_version,
    nonceBase64: evidence.nonce_base64,
    policyVersion: moderationCase.policy_version,
  });
  const budget = await reserveGoogleModerationUnits(Math.max(1, Math.ceil(Buffer.byteLength(content, "utf8") / 1000)));
  if (!budget.allowed) {
    await recordModerationProviderResult({ casePublicId, categories: {}, providerVersion: "google-language-moderateText-v2", status: "skipped_budget" });
    return;
  }
  try {
    const result = await moderateTextWithGoogle(content);
    await recordModerationProviderResult({
      casePublicId,
      categories: result.categories,
      providerVersion: result.providerVersion,
      status: "completed",
    });
    await storeModerationDecisionCache({
      categories: result.categories,
      contentDecisionKey: moderationCase.content_decision_key,
      policyVersion: moderationCase.policy_version,
      providerVersion: result.providerVersion,
    });
  } catch (error) {
    await recordModerationProviderResult({
      casePublicId,
      categories: {},
      providerVersion: "google-language-moderateText-v2",
      status: "failed",
    });
    throw error;
  }
}

async function drainNotifications() {
  const notifications = await loadPendingModerationNotifications(10);
  for (const item of notifications) {
    try {
      await sendModerationTelegramNotification(item.event_type, item.payload);
      await markModerationNotificationSent(item.id);
    } catch (error) {
      await markModerationNotificationFailed(
        item.id,
        item.attempts,
        error instanceof Error ? error.message : "Unknown Telegram error",
      );
    }
  }
  return notifications.length;
}

export async function runModerationWorker() {
  const jobs = await claimModerationJobs(10);
  let completed = 0;
  let failed = 0;
  for (const job of jobs) {
    const casePublicId = job.message.casePublicId;
    if (!casePublicId) {
      await completeModerationJob(job.msg_id);
      continue;
    }
    try {
      await processCase(casePublicId);
      await completeModerationJob(job.msg_id);
      completed += 1;
    } catch (error) {
      failed += 1;
      console.error("[moderation-worker] case failed", { casePublicId, error });
      if (job.read_count >= 5) {
        await enqueueModerationWorkerFailureAlert({
          casePublicId,
          error: error instanceof Error ? error.name : "unknown_error",
        });
        await completeModerationJob(job.msg_id);
      }
    }
  }
  const overdueAlerts = await enqueueOverdueModerationAlerts();
  const notifications = await drainNotifications();
  const cleanup = await cleanupExpiredModerationData();
  return { claimed: jobs.length, completed, failed, overdueAlerts, notifications, cleanup };
}
