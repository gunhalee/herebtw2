import { readJsonBody } from "../../../../../lib/api/request";
import { fail, ok } from "../../../../../lib/api/response";
import { reportPost } from "../../../../../lib/posts/mutations";

type ReportPostRequest = {
  anonymousDeviceId?: string;
  reasonCode?: string;
};

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const { postId } = await context.params;
  const bodyResult = await readJsonBody<ReportPostRequest>(request);

  if (!bodyResult.ok) {
    return bodyResult.response;
  }

  const result = await reportPost({
    anonymousDeviceId: bodyResult.body.anonymousDeviceId,
    postId,
    reasonCode: bodyResult.body.reasonCode,
  });

  if (!result.ok) {
    return fail(
      {
        code: result.code,
        message: result.message,
      },
      400,
    );
  }

  return ok({
    postId: result.postId,
    reported: true,
  });
}
