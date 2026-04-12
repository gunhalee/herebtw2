import type { ApiResponse } from "../../types/api";

const CLIENT_API_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_CLIENT_API_TIMEOUT_MESSAGE =
  "요청이 오래 걸리고 있어요. 다시 시도해주세요.";

type FetchClientApiDataParams = {
  errorMessage: string;
  init?: RequestInit;
  path: string;
  allowNoContent?: boolean;
  timeoutErrorMessage?: string;
  timeoutMs?: number;
};

type ClientRequestAbortState = {
  cleanup: () => void;
  didTimeout: () => boolean;
  signal: AbortSignal;
};

type JsonRequestMethod = "DELETE" | "PATCH" | "POST" | "PUT";

export function createJsonRequestInit(
  method: JsonRequestMethod,
  body?: unknown,
): RequestInit {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export function createJsonPostRequestInit(body: unknown): RequestInit {
  return createJsonRequestInit("POST", body);
}

export function createJsonPatchRequestInit(body: unknown): RequestInit {
  return createJsonRequestInit("PATCH", body);
}

function createClientRequestAbortState(
  inputSignal: AbortSignal | null | undefined,
  timeoutMs: number,
): ClientRequestAbortState {
  const controller = new AbortController();
  let didTimeout = false;

  const abortFromInput = () => {
    controller.abort(inputSignal?.reason);
  };

  if (inputSignal) {
    if (inputSignal.aborted) {
      abortFromInput();
    } else {
      inputSignal.addEventListener("abort", abortFromInput, { once: true });
    }
  }

  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort(new DOMException("Timed out.", "AbortError"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    didTimeout: () => didTimeout,
    cleanup: () => {
      clearTimeout(timeout);
      inputSignal?.removeEventListener("abort", abortFromInput);
    },
  };
}

function parseApiResponse<T>(responseText: string) {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export async function fetchClientApiData<T>(
  params: FetchClientApiDataParams & {
    allowNoContent: true;
  },
): Promise<T | null>;
export async function fetchClientApiData<T>(
  params: FetchClientApiDataParams & {
    allowNoContent?: false;
  },
): Promise<T>;
export async function fetchClientApiData<T>({
  allowNoContent,
  errorMessage,
  init,
  path,
  timeoutErrorMessage,
  timeoutMs = CLIENT_API_REQUEST_TIMEOUT_MS,
}: FetchClientApiDataParams): Promise<T | null> {
  const abortState = createClientRequestAbortState(
    init?.signal,
    timeoutMs,
  );

  try {
    const response = await fetch(path, {
      ...init,
      signal: abortState.signal,
    });

    if (allowNoContent && response.status === 204) {
      return null;
    }

    const responseText = await response.text();
    const json = parseApiResponse<T>(responseText);

    if (!response.ok || !json?.success || json.data === null) {
      throw new Error(json?.error?.message ?? errorMessage);
    }

    return json.data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        abortState.didTimeout()
          ? timeoutErrorMessage ?? DEFAULT_CLIENT_API_TIMEOUT_MESSAGE
          : errorMessage,
      );
    }

    throw error;
  } finally {
    abortState.cleanup();
  }
}
