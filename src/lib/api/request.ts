import { fail } from "./response";

const DEFAULT_INVALID_REQUEST_MESSAGE = "요청 형식을 다시 확인해 주세요.";
const DEFAULT_MAX_JSON_BODY_BYTES = 16 * 1024;

type ReadJsonBodyFailure = {
  ok: false;
  response: ReturnType<typeof fail>;
};

type ReadJsonBodySuccess<T> = {
  body: T;
  ok: true;
};

export async function readJsonBody<T>(
  request: Request,
  options?: {
    invalidRequestMessage?: string;
    maxBytes?: number;
  },
): Promise<ReadJsonBodyFailure | ReadJsonBodySuccess<T>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: fail(
        {
          code: "UNSUPPORTED_MEDIA_TYPE",
          message: "JSON 형식으로 요청해 주세요.",
        },
        415,
      ),
    };
  }

  const maxBytes = options?.maxBytes ?? DEFAULT_MAX_JSON_BODY_BYTES;
  const declaredLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return {
      ok: false,
      response: fail(
        {
          code: "REQUEST_TOO_LARGE",
          message: "요청 내용이 너무 큽니다.",
        },
        413,
      ),
    };
  }

  try {
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
      return {
        ok: false,
        response: fail(
          {
            code: "REQUEST_TOO_LARGE",
            message: "요청 내용이 너무 큽니다.",
          },
          413,
        ),
      };
    }

    return {
      body: JSON.parse(rawBody) as T,
      ok: true,
    };
  } catch {
    return {
      ok: false,
      response: fail(
        {
          code: "INVALID_REQUEST",
          message:
            options?.invalidRequestMessage ?? DEFAULT_INVALID_REQUEST_MESSAGE,
        },
        400,
      ),
    };
  }
}
