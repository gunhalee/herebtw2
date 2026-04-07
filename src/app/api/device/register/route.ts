import { readJsonBody } from "../../../../lib/api/request";
import { fail, ok } from "../../../../lib/api/response";
import { syncDeviceRepository } from "../../../../lib/posts/repository";

type RegisterDeviceRequest = {
  anonymousDeviceId?: string;
};

export async function POST(request: Request) {
  const bodyResult = await readJsonBody<RegisterDeviceRequest>(request);

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

  const result = await syncDeviceRepository(anonymousDeviceId);

  return ok({
    device: {
      id: result.device?.id ?? null,
      anonymousDeviceId:
        result.device?.anonymous_device_id ?? anonymousDeviceId,
    },
  });
}
