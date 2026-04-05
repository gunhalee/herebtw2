import { ok } from "../../../../../../lib/api/response";
import { toggleAgreeAction } from "../../../../../../actions/posts/toggle-agree";
import { loadPostDetailRepository } from "../../../../../../lib/posts/repository";

type ToggleAgreeRequest = {
  anonymousDeviceId: string;
};

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const { postId } = await context.params;
  const body = (await request.json()) as ToggleAgreeRequest;
  const postDetailState = await loadPostDetailRepository({
    postId,
    anonymousDeviceId: body.anonymousDeviceId,
  });

  if (!postDetailState) {
    return ok({
      postId,
      agreed: false,
      agreeCount: 0,
    });
  }

  const result = await toggleAgreeAction({
    ...postDetailState,
    postId,
  }, body.anonymousDeviceId);

  return ok({
    postId,
    agreed: result.myAgree,
    agreeCount: result.agreeCount,
  });
}
