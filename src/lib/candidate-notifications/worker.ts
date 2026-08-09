import { randomUUID } from "node:crypto";
import { generateReplyNotificationCard } from "../card/reply-card";
import { sendReplyNotification } from "../email/send-reply-notification";
import { sendTelegramText } from "../moderation/telegram";
import {
  claimReplyNotifications,
  completeReplyNotification,
  type ReplyNotificationJob,
} from "./repository";
import { getReplyNotificationRetry } from "./retry-policy";

const BATCH_SIZE = 20;
const RENDER_CONCURRENCY = 4;

async function notifyDeadJob(job: ReplyNotificationJob, errorCode: string) {
  const chatId = process.env.TELEGRAM_MONITOR_CHANNEL_ID?.trim();
  if (!chatId) return;
  try {
    await sendTelegramText(
      chatId,
      `후보자 답변 알림이 최종 실패했습니다.\nreply: ${job.reply_id}\nerror: ${errorCode}`,
    );
  } catch (error) {
    console.error("[candidate-notification-worker] Telegram alert failed", error);
  }
}

async function processJob(job: ReplyNotificationJob, workerId: string) {
  if (!job.recipient_email) {
    await completeReplyNotification({
      outboxId: job.outbox_id,
      workerId,
      status: "skipped",
      errorCode: "recipient_unverified_or_missing",
    });
    return "skipped" as const;
  }

  let cardAttachment: Buffer | null = null;
  try {
    cardAttachment = await generateReplyNotificationCard(job.post_public_uuid);
  } catch (error) {
    console.error("[candidate-notification-worker] card degradation", {
      replyId: job.reply_id,
      error,
    });
  }

  const delivery = await sendReplyNotification({
    toEmail: job.recipient_email,
    postContent: job.post_content,
    publicUuid: job.post_public_uuid,
    candidateName: job.candidate_name,
    cardAttachment,
    idempotencyKey: `candidate-reply/${job.reply_id}`,
  });

  if (delivery.sent) {
    await completeReplyNotification({
      outboxId: job.outbox_id,
      workerId,
      status: "sent",
      providerMessageId: delivery.providerMessageId,
    });
    return "sent" as const;
  }

  if (delivery.reason === "invalid_recipient") {
    await completeReplyNotification({
      outboxId: job.outbox_id,
      workerId,
      status: "skipped",
      errorCode: delivery.reason,
    });
    return "skipped" as const;
  }

  const retry = getReplyNotificationRetry({ attempts: job.attempts });
  await completeReplyNotification({
    outboxId: job.outbox_id,
    workerId,
    status: retry.status,
    errorCode: delivery.reason ?? "send_failed",
    nextAttemptAt: retry.nextAttemptAt,
  });
  if (retry.status === "dead") {
    await notifyDeadJob(job, delivery.reason ?? "send_failed");
  }
  return retry.status;
}

export async function runReplyNotificationWorker() {
  const workerId = randomUUID();
  const jobs = await claimReplyNotifications(workerId, BATCH_SIZE);
  const results: string[] = [];

  for (let offset = 0; offset < jobs.length; offset += RENDER_CONCURRENCY) {
    const chunk = jobs.slice(offset, offset + RENDER_CONCURRENCY);
    results.push(...(await Promise.all(chunk.map((job) => processJob(job, workerId)))));
  }

  return {
    claimed: jobs.length,
    sent: results.filter((result) => result === "sent").length,
    skipped: results.filter((result) => result === "skipped").length,
    retry: results.filter((result) => result === "retry").length,
    dead: results.filter((result) => result === "dead").length,
  };
}
