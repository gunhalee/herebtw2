import { supabaseRpc } from "../supabase/rest";

export type ReplyNotificationJob = {
  outbox_id: string;
  reply_id: string;
  attempts: number;
  recipient_email: string | null;
  post_content: string;
  post_public_uuid: string;
  candidate_name: string;
};

export async function claimReplyNotifications(workerId: string, limit = 20) {
  return (
    await supabaseRpc<ReplyNotificationJob[]>("claim_reply_notifications", {
      p_worker_id: workerId,
      p_limit: limit,
    })
  ) ?? [];
}

export async function completeReplyNotification(input: {
  outboxId: string;
  workerId: string;
  status: "dead" | "retry" | "sent" | "skipped";
  providerMessageId?: string;
  errorCode?: string;
  nextAttemptAt?: Date | null;
}) {
  return supabaseRpc<boolean>("complete_reply_notification", {
    p_outbox_id: input.outboxId,
    p_worker_id: input.workerId,
    p_status: input.status,
    p_provider_message_id: input.providerMessageId ?? null,
    p_error_code: input.errorCode?.slice(0, 120) ?? null,
    p_next_attempt_at: input.nextAttemptAt?.toISOString() ?? null,
  });
}
