import { fail, ok } from "../../../../lib/api/response";
import { syncDeviceRepository } from "../../../../lib/posts/repository";

type RegisterDeviceRequest = {
  anonymousDeviceId: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterDeviceRequest;

  if (!body.anonymousDeviceId?.trim()) {
    return fail(
      {
        code: "INVALID_DEVICE_ID",
        message: "anonymousDeviceId가 필요합니다.",
      },
      400,
    );
  }

  const result = await syncDeviceRepository(body.anonymousDeviceId);

  return ok({
    device: {
      id: result.device?.id ?? null,
      anonymousDeviceId:
        result.device?.anonymous_device_id ?? body.anonymousDeviceId,
    },
  });
}
