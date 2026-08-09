import { supabaseInsert, supabasePatchMinimal, supabaseRpc } from "../../supabase/rest";
import type { ReplyRow } from "./types";

async function createCandidateFirstMessageRepository(input: {
  candidateId: string;
  district: string;
  content: string;
}) {
  const rows = await supabaseInsert<
    Array<{ id: string; public_uuid: string; created_at: string }>
  >("posts?select=id,public_uuid,created_at", {
    content: input.content,
    administrative_dong_name: input.district,
    administrative_dong_code: `candidate:${input.candidateId}`,
    is_pinned: true,
    author_type: "candidate",
    candidate_id: input.candidateId,
    location_scope: "district",
    location_source: "system",
  });

  return rows?.[0] ?? null;
}

async function createCandidateQuarantinedFirstMessageRepository(input: {
  aadVersion: number;
  authTagBase64: string;
  candidateId: string;
  casePublicId: string;
  ciphertextBase64: string;
  contentHmac: string;
  createdAt: string;
  district: string;
  keyVersion: string;
  nonceBase64: string;
  normalizationVersion: number;
  policyVersion: string;
  priority: "high" | "normal" | "urgent";
  reasonCodes: string[];
  riskBand: "critical" | "high" | "medium";
}) {
  const rows = await supabaseRpc<Array<{
    case_public_id: string;
    post_created_at: string;
    post_id: string;
    post_public_uuid: string;
  }>>("create_quarantined_post", {
    p_aad_version: input.aadVersion,
    p_administrative_dong_code: `candidate:${input.candidateId}`,
    p_administrative_dong_name: input.district,
    p_auth_tag_base64: input.authTagBase64,
    p_author_device_id: null,
    p_author_type: "candidate",
    p_candidate_id: input.candidateId,
    p_case_public_id: input.casePublicId,
    p_ciphertext_base64: input.ciphertextBase64,
    p_client_request_id: null,
    p_content_hmac: input.contentHmac,
    p_evidence_created_at: input.createdAt,
    p_key_version: input.keyVersion,
    p_latitude: null,
    p_latitude_bucket_100m: null,
    p_location_scope: "district",
    p_location_source: "system",
    p_longitude: null,
    p_longitude_bucket_100m: null,
    p_nonce_base64: input.nonceBase64,
    p_normalization_version: input.normalizationVersion,
    p_notification_email: null,
    p_notification_email_verification_expires_at: null,
    p_notification_email_verification_hash: null,
    p_placeholder_content: "안전 확인 중인 글입니다.",
    p_policy_version: input.policyVersion,
    p_priority: input.priority,
    p_reason_codes: input.reasonCodes,
    p_risk_band: input.riskBand,
    p_source: "candidate_first_message",
  });
  return rows?.[0] ?? null;
}

async function createCandidateFirstMessageUpdateCaseRepository(input: {
  aadVersion: number;
  authTagBase64: string;
  casePublicId: string;
  ciphertextBase64: string;
  contentHmac: string;
  createdAt: string;
  keyVersion: string;
  nonceBase64: string;
  normalizationVersion: number;
  policyVersion: string;
  postId: string;
  priority: "high" | "normal" | "urgent";
  reasonCodes: string[];
  riskBand: "critical" | "high" | "medium";
}) {
  return supabaseRpc<string>("create_moderation_update_case", {
    p_aad_version: input.aadVersion,
    p_auth_tag_base64: input.authTagBase64,
    p_case_public_id: input.casePublicId,
    p_ciphertext_base64: input.ciphertextBase64,
    p_content_hmac: input.contentHmac,
    p_evidence_created_at: input.createdAt,
    p_key_version: input.keyVersion,
    p_nonce_base64: input.nonceBase64,
    p_normalization_version: input.normalizationVersion,
    p_policy_version: input.policyVersion,
    p_post_id: input.postId,
    p_priority: input.priority,
    p_reason_codes: input.reasonCodes,
    p_risk_band: input.riskBand,
  });
}

async function attachCandidateFirstMessageRepository(
  candidateId: string,
  postId: string,
) {
  await supabasePatchMinimal(`candidates?id=eq.${candidateId}`, {
    first_message_id: postId,
  });
}

async function updateCandidateFirstMessageRepository(
  postId: string,
  content: string,
) {
  await supabasePatchMinimal(`posts?id=eq.${postId}`, {
    content,
  });
}

async function createReply(input: {
  postId: string;
  candidateId: string;
  content: string;
  isPromise: boolean;
  promiseDeadline: string | null;
}) {
  const rows = await supabaseInsert<ReplyRow[]>(
    "replies?select=id,post_id,candidate_id,content,is_promise,promise_deadline,created_at",
    {
      post_id: input.postId,
      candidate_id: input.candidateId,
      content: input.content,
      is_promise: input.isPromise,
      ...(input.promiseDeadline ? { promise_deadline: input.promiseDeadline } : {}),
    },
  );

  return rows?.[0] ?? null;
}

type AtomicReplyResult =
  | {
      status: "ok";
      notification: "queued";
      reply: {
        id: string;
        postId: string;
        candidateId: string;
        content: string;
        isPromise: boolean;
        promiseDeadline: string | null;
        publicUuid: string;
        createdAt: string;
      };
    }
  | {
      status:
        | "already_replied"
        | "candidate_inactive"
        | "candidate_not_found"
        | "idempotency_conflict"
        | "post_not_eligible"
        | "validation_error";
      publicUuid?: string;
    };

async function createCandidateReplyAtomicRepository(input: {
  authUserId: string;
  clientRequestId: string;
  requestHash: string;
  postId: string;
  content: string;
  isPromise: boolean;
  promiseDeadline: string | null;
}) {
  return supabaseRpc<AtomicReplyResult>("create_candidate_reply_atomic", {
    p_auth_user_id: input.authUserId,
    p_client_request_id: input.clientRequestId,
    p_request_hash: input.requestHash,
    p_post_id: input.postId,
    p_content: input.content,
    p_is_promise: input.isPromise,
    p_promise_deadline: input.promiseDeadline,
  });
}

export {
  attachCandidateFirstMessageRepository,
  createCandidateFirstMessageRepository,
  createCandidateFirstMessageUpdateCaseRepository,
  createCandidateReplyAtomicRepository,
  createCandidateQuarantinedFirstMessageRepository,
  createReply,
  updateCandidateFirstMessageRepository,
};
