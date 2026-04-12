import type { PostLocation } from "../../../types/post";
import { quantizeLocationTo100MeterGrid } from "../../geo/location-buckets";
import {
  supabaseInsert,
  supabaseRpc,
  supabaseUpsert,
} from "../../supabase/rest";
import { ensureDeviceIdentity } from "./shared";
import type { PostRow, ToggleAgreeRpcRow } from "./types";

type CreatePostRepositoryInput = {
  anonymousDeviceId?: string;
  content: string;
  location: PostLocation;
  resolvedDongCode: string | null;
  resolvedDongName: string;
  notificationEmail?: string;
};

async function syncDeviceRepository(anonymousDeviceId: string) {
  const device = await ensureDeviceIdentity(anonymousDeviceId);

  return { device };
}

async function createPostRepository(input: CreatePostRepositoryInput) {
  if (!input.anonymousDeviceId) {
    throw new Error("Missing anonymous device id.");
  }

  const device = await ensureDeviceIdentity(input.anonymousDeviceId);

  if (!device) {
    throw new Error("Failed to ensure device identity.");
  }

  const quantizedLocation = quantizeLocationTo100MeterGrid(input.location);
  const rows = await supabaseInsert<PostRow[]>(
    "posts?select=id,public_uuid,content,administrative_dong_name,created_at,delete_expires_at",
    {
      author_device_id: device.id,
      content: input.content.trim(),
      administrative_dong_name: input.resolvedDongName,
      administrative_dong_code: input.resolvedDongCode,
      latitude: quantizedLocation.latitude,
      longitude: quantizedLocation.longitude,
      latitude_bucket_100m: quantizedLocation.latitudeBucket100m,
      longitude_bucket_100m: quantizedLocation.longitudeBucket100m,
      ...(input.notificationEmail ? { notification_email: input.notificationEmail } : {}),
    },
  );

  return { post: rows?.[0] ?? null };
}

async function toggleAgreeRepository(postId: string, anonymousDeviceId?: string) {
  if (!anonymousDeviceId?.trim()) {
    throw new Error("Missing anonymous device id.");
  }

  const rpcRows =
    (await supabaseRpc<ToggleAgreeRpcRow[]>("toggle_post_agree", {
      target_post_id: postId,
      viewer_anonymous_device_id: anonymousDeviceId,
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
  anonymousDeviceId?: string,
) {
  if (!anonymousDeviceId?.trim()) {
    throw new Error("Missing anonymous device id.");
  }

  const device = await ensureDeviceIdentity(anonymousDeviceId);

  if (!device) {
    throw new Error("Failed to ensure device identity.");
  }

  await supabaseUpsert(
    "post_reports?on_conflict=post_id,reporter_device_id&select=id,post_id,reporter_device_id,reason_code",
    {
      post_id: postId,
      reporter_device_id: device.id,
      reason_code: reasonCode,
    },
  );

  return { postId, reasonCode };
}

export {
  createPostRepository,
  reportPostRepository,
  syncDeviceRepository,
  toggleAgreeRepository,
};
