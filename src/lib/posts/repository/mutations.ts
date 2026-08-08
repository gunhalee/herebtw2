import type { PostLocation } from "../../../types/post";
import type {
  LocationScope,
  LocationSource,
} from "../../geo/location-resolution-token";
import { quantizeLocationTo100MeterGrid } from "../../geo/location-buckets";
import {
  supabaseInsert,
  supabaseRpc,
  supabaseSelect,
  supabaseUpsert,
} from "../../supabase/rest";
import { ensureDeviceIdentity } from "./shared";
import type { PostRow, ToggleAgreeRpcRow } from "./types";

type CreatePostRepositoryInput = {
  authorDeviceId?: string;
  anonymousDeviceId?: string;
  clientRequestId?: string;
  content: string;
  contentFingerprint?: string;
  fingerprintVersion?: number;
  location: PostLocation;
  locationScope: LocationScope;
  locationSource: LocationSource;
  resolvedDongCode: string | null;
  resolvedDongName: string;
  notificationEmail?: string;
  notificationEmailVerificationExpiresAt?: string;
  notificationEmailVerificationHash?: string;
  normalizedContentLoose?: string;
  normalizedContentStrict?: string;
};

type SimilarPostRpcRow = {
  post_id: string;
  same_device: boolean;
  similarity_score: number;
};

async function syncDeviceRepository(anonymousDeviceId: string) {
  const device = await ensureDeviceIdentity(anonymousDeviceId);

  return { device };
}

async function createPostRepository(input: CreatePostRepositoryInput) {
  if (!input.authorDeviceId && !input.anonymousDeviceId) {
    throw new Error("Missing anonymous device id.");
  }

  const device = input.authorDeviceId
    ? { id: input.authorDeviceId }
    : await ensureDeviceIdentity(input.anonymousDeviceId ?? "");

  if (!device) {
    throw new Error("Failed to ensure device identity.");
  }

  const quantizedLocation = quantizeLocationTo100MeterGrid(input.location);
  const rows = await supabaseInsert<PostRow[]>(
    "posts?select=id,public_uuid,content,administrative_dong_name,created_at,delete_expires_at",
    {
      author_device_id: device.id,
      client_request_id: input.clientRequestId ?? null,
      content: input.content.trim(),
      content_fingerprint: input.contentFingerprint ?? null,
      fingerprint_version: input.fingerprintVersion ?? 1,
      normalized_content_loose: input.normalizedContentLoose ?? null,
      normalized_content_strict: input.normalizedContentStrict ?? null,
      administrative_dong_name: input.resolvedDongName,
      administrative_dong_code: input.resolvedDongCode,
      latitude: quantizedLocation.latitude,
      longitude: quantizedLocation.longitude,
      latitude_bucket_100m: quantizedLocation.latitudeBucket100m,
      longitude_bucket_100m: quantizedLocation.longitudeBucket100m,
      location_scope: input.locationScope,
      location_source: input.locationSource,
      ...(input.notificationEmail ? { notification_email: input.notificationEmail } : {}),
      ...(input.notificationEmailVerificationHash
        ? {
            notification_email_verification_hash:
              input.notificationEmailVerificationHash,
            notification_email_verification_expires_at:
              input.notificationEmailVerificationExpiresAt,
          }
        : {}),
    },
  );

  return { post: rows?.[0] ?? null };
}

async function findPostByClientRequestIdRepository(
  authorDeviceId: string,
  clientRequestId: string,
) {
  const rows = await supabaseSelect<PostRow[]>(
    `posts?author_device_id=eq.${encodeURIComponent(authorDeviceId)}&client_request_id=eq.${encodeURIComponent(clientRequestId)}&select=id,public_uuid,content,administrative_dong_name,created_at,delete_expires_at&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function findPostByFingerprintRepository(
  authorDeviceId: string,
  contentFingerprint: string,
) {
  const rows = await supabaseSelect<PostRow[]>(
    `posts?author_device_id=eq.${encodeURIComponent(authorDeviceId)}&content_fingerprint=eq.${encodeURIComponent(contentFingerprint)}&status=in.(active,quarantined)&select=id,public_uuid,content,administrative_dong_name,created_at,delete_expires_at&limit=1`,
  );

  return rows?.[0] ?? null;
}

async function findSimilarRecentPostsRepository(
  authorDeviceId: string,
  normalizedContentLoose: string,
) {
  return (
    (await supabaseRpc<SimilarPostRpcRow[]>("find_similar_recent_posts", {
      p_device_id: authorDeviceId,
      p_limit: 10,
      p_normalized_content: normalizedContentLoose,
    })) ?? []
  );
}

async function toggleAgreeRepository(postId: string, deviceId?: string) {
  if (!deviceId?.trim()) {
    throw new Error("Missing anonymous device id.");
  }

  const rpcRows =
    (await supabaseRpc<ToggleAgreeRpcRow[]>("toggle_post_agree_for_device", {
      target_post_id: postId,
      viewer_device_id: deviceId,
    })) ?? [];
  const rpcRow = rpcRows[0];

  return {
    postId,
    agreed: Boolean(rpcRow?.agreed),
    agreeCount: Number(rpcRow?.agree_count ?? 0),
  };
}

async function reportPostRepository(
  postId: string,
  reasonCode: string,
  deviceId?: string,
) {
  if (!deviceId?.trim()) {
    throw new Error("Missing anonymous device id.");
  }

  await supabaseUpsert(
    "post_reports?on_conflict=post_id,reporter_device_id&select=id,post_id,reporter_device_id,reason_code",
    {
      post_id: postId,
      reporter_device_id: deviceId,
      reason_code: reasonCode,
    },
  );

  return { postId, reasonCode };
}

export {
  createPostRepository,
  findPostByClientRequestIdRepository,
  findPostByFingerprintRepository,
  findSimilarRecentPostsRepository,
  reportPostRepository,
  syncDeviceRepository,
  toggleAgreeRepository,
};
