import { fail, ok } from "../../../../../../lib/api/response";
import { toggleAgreeAction } from "../../../../../../actions/posts/toggle-agree";

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

  if (!body.anonymousDeviceId?.trim()) {
    return fail(
      {
        code: "INVALID_DEVICE_ID",
        message: "anonymousDeviceId가 필요합니다.",
      },
      400,
    );
  }

  const result = await toggleAgreeAction(postId, body.anonymousDeviceId);

  return ok({
    postId,
    agreed: result.myAgree,
    agreeCount: result.agreeCount,
  });
}
