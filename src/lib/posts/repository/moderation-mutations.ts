import type { LocationScope, LocationSource } from "../../geo/location-resolution-token";
import { supabaseRpc, supabaseSelect } from "../../supabase/rest";

type CreateQuarantinedPostRepositoryInput = {
  aadVersion: number;
  administrativeDongCode: string | null;
  administrativeDongName: string;
  authTagBase64: string;
  authorDeviceId: string;
  casePublicId: string;
  ciphertextBase64: string;
  clientRequestId: string;
  contentHmac: string;
  createdAt: string;
  keyVersion: string;
  latitude: number;
  latitudeBucket100m: number;
  locationScope: LocationScope;
  locationSource: LocationSource;
  longitude: number;
  longitudeBucket100m: number;
  nonceBase64: string;
  normalizationVersion: number;
  notificationEmail?: string;
  notificationEmailVerificationExpiresAt?: string;
  notificationEmailVerificationHash?: string;
  policyVersion: string;
  priority: "high" | "normal" | "urgent";
  reasonCodes: string[];
  riskBand: "critical" | "high" | "medium";
};

export async function createQuarantinedPostRepository(input: CreateQuarantinedPostRepositoryInput) {
  const rows = await supabaseRpc<Array<{
    case_public_id: string;
    post_created_at: string;
    post_delete_expires_at: string;
    post_id: string;
    post_public_uuid: string;
  }>>("create_quarantined_post", {
    p_aad_version: input.aadVersion,
    p_administrative_dong_code: input.administrativeDongCode,
    p_administrative_dong_name: input.administrativeDongName,
    p_auth_tag_base64: input.authTagBase64,
    p_author_device_id: input.authorDeviceId,
    p_author_type: "citizen",
    p_candidate_id: null,
    p_case_public_id: input.casePublicId,
    p_ciphertext_base64: input.ciphertextBase64,
    p_client_request_id: input.clientRequestId,
    p_content_hmac: input.contentHmac,
    p_evidence_created_at: input.createdAt,
    p_key_version: input.keyVersion,
    p_latitude: input.latitude,
    p_latitude_bucket_100m: input.latitudeBucket100m,
    p_location_scope: input.locationScope,
    p_location_source: input.locationSource,
    p_longitude: input.longitude,
    p_longitude_bucket_100m: input.longitudeBucket100m,
    p_nonce_base64: input.nonceBase64,
    p_normalization_version: input.normalizationVersion,
    p_notification_email: input.notificationEmail ?? null,
    p_notification_email_verification_expires_at: input.notificationEmailVerificationExpiresAt ?? null,
    p_notification_email_verification_hash: input.notificationEmailVerificationHash ?? null,
    p_placeholder_content: "안전 확인 중인 글입니다.",
    p_policy_version: input.policyVersion,
    p_priority: input.priority,
    p_reason_codes: input.reasonCodes,
    p_risk_band: input.riskBand,
    p_source: "citizen_post",
  });
  return rows?.[0] ?? null;
}

export async function loadPostForReportModerationRepository(postId: string) {
  const rows = await supabaseSelect<Array<{ content: string; id: string; status: string }>>(
    `posts?select=id,content,status&id=eq.${encodeURIComponent(postId)}&status=eq.active&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function createReportModerationCaseRepository(input: {
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
  reportReasonCode: string;
}) {
  return supabaseRpc<string>("create_report_moderation_case", {
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
    p_report_reason_code: input.reportReasonCode,
  });
}
