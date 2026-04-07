import { readJsonBody } from "../../../../lib/api/request";
import { fail, ok } from "../../../../lib/api/response";
import { createPostEngagementSnapshotToken } from "../../../../lib/posts/engagement-snapshot-token";
import { loadPostEngagementSnapshotRepository } from "../../../../lib/posts/repository";

type PostEngagementSnapshotRequest = {
  anonymousDeviceId?: string;
  postIds?: string[];
  snapshotToken?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(request: Request) {
  const bodyResult = await readJsonBody<PostEngagementSnapshotRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const { anonymousDeviceId, postIds: inputPostIds, snapshotToken } =
    bodyResult.body;
  const postIds = Array.from(
    new Set(
      (Array.isArray(inputPostIds) ? inputPostIds : [])
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
    anonymousDeviceId: anonymousDeviceId?.trim() || undefined,
    postIds,
  });
  const nextSnapshotToken = createPostEngagementSnapshotToken(snapshot.items);

  if (snapshotToken === nextSnapshotToken) {
    return new Response(null, {
      status: 204,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    });
  }

  return ok(
    {
      ...snapshot,
      snapshotToken: nextSnapshotToken,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
