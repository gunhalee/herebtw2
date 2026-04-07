import { readJsonBody } from "../../../../../../lib/api/request";
import { fail, ok } from "../../../../../../lib/api/response";
import { toggleAgreeState } from "../../../../../../lib/posts/mutations";

type ToggleAgreeRequest = {
  anonymousDeviceId?: string;
};

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const { postId } = await context.params;
  const bodyResult = await readJsonBody<ToggleAgreeRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const anonymousDeviceId = bodyResult.body.anonymousDeviceId?.trim();

  if (!anonymousDeviceId) {
    return fail(
      {
        code: "INVALID_DEVICE_ID",
        message: "anonymousDeviceId가 필요합니다.",
      },
      400,
    );
  }

  const result = await toggleAgreeState(postId, anonymousDeviceId);

  return ok({
    postId,
    agreed: result.myAgree,
    agreeCount: result.agreeCount,
  });
}
