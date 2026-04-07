import { fail } from "./response";

const DEFAULT_INVALID_REQUEST_MESSAGE = "요청 형식을 다시 확인해 주세요.";

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
  },
): Promise<ReadJsonBodyFailure | ReadJsonBodySuccess<T>> {
  try {
    return {
      body: (await request.json()) as T,
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
