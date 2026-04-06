import { fail, ok } from "../../../../lib/api/response";
import { loadPostEngagementSnapshotRepository } from "../../../../lib/posts/repository";

type PostEngagementSnapshotRequest = {
  anonymousDeviceId?: string;
  postIds?: string[];
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as PostEngagementSnapshotRequest;
  const postIds = Array.from(
    new Set(
      (Array.isArray(body.postIds) ? body.postIds : [])
        .map((postId) => postId.trim())
        .filter((postId) => isUuid(postId)),
    ),
  ).slice(0, 50);

  if (postIds.length === 0) {
    return fail(
      {
        code: "INVALID_POST_IDS",
        message: "Engagement sync requires at least one post id.",
      },
      400,
    );
  }

  const snapshot = await loadPostEngagementSnapshotRepository({
    anonymousDeviceId: body.anonymousDeviceId?.trim() || undefined,
    postIds,
  });

  return ok(snapshot, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
