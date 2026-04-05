import { deletePostAction } from "../../../../../actions/posts/delete-post";
import { fail, ok } from "../../../../../lib/api/response";
import { loadPostDetailRepository } from "../../../../../lib/posts/repository";

type DeletePostRequest = {
  anonymousDeviceId: string;
};

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const { postId } = await context.params;
  const body = (await request.json()) as DeletePostRequest;
  const postDetailState = await loadPostDetailRepository({
    postId,
    anonymousDeviceId: body.anonymousDeviceId,
  });

  if (!postDetailState) {
    return fail(
      {
        code: "POST_NOT_FOUND",
        message: "삭제할 글을 찾지 못했습니다.",
      },
      404,
    );
  }

  const result = await deletePostAction(
    {
      ...postDetailState,
      postId,
    },
    body.anonymousDeviceId,
  );

  if (!result.ok) {
    return fail(
      {
        code: "DELETE_WINDOW_EXPIRED",
        message: result.errorMessage ?? "삭제할 수 없는 글입니다.",
      },
      400,
    );
  }

  return ok({
    postId: result.postId,
    deleted: true,
  });
}
