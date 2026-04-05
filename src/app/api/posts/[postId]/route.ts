import { fail, ok } from "../../../../lib/api/response";
import { loadPostDetailRepository } from "../../../../lib/posts/repository";

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function GET(request: Request, context: Context) {
  const { postId } = await context.params;
  const url = new URL(request.url);
  const postDetailState = await loadPostDetailRepository({
    postId,
    anonymousDeviceId: url.searchParams.get("anonymousDeviceId") ?? undefined,
  });

  if (!postDetailState || postDetailState.postId !== postId) {
    return fail(
      {
        code: "POST_NOT_FOUND",
        message: "포스트를 찾을 수 없습니다.",
      },
      404,
    );
  }

  return ok({
    post: {
      id: postDetailState.postId,
      content: postDetailState.content,
      administrativeDongName: postDetailState.administrativeDongName,
      distanceMeters: postDetailState.distanceMeters,
      relativeTime: postDetailState.relativeTime,
      agreeCount: postDetailState.agreeCount,
      myAgree: postDetailState.myAgree,
      canReport: postDetailState.canReport,
      canDelete: postDetailState.canDelete,
      deleteRemainingSeconds: postDetailState.deleteRemainingSeconds,
    },
  });
}
