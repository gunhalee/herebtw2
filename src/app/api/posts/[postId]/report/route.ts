import { ok } from "../../../../../lib/api/response";
import { reportPostAction } from "../../../../../actions/posts/report-post";

type ReportPostRequest = {
  anonymousDeviceId: string;
  reasonCode: string;
};

type Context = {
  params: Promise<{
    postId: string;
  }>;
};

export async function POST(request: Request, context: Context) {
  const { postId } = await context.params;
  const body = (await request.json()) as ReportPostRequest;
  const result = await reportPostAction(
    postId,
    body.reasonCode,
    body.anonymousDeviceId,
  );

  return ok({
    postId: result.postId,
    reported: result.ok,
  });
}
