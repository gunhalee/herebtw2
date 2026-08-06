export type LocationResolutionErrorCode =
  | "AUTHENTICATION"
  | "CONFIGURATION"
  | "INVALID_COORDINATES"
  | "INVALID_RESPONSE"
  | "OUTSIDE_SERVICE_AREA"
  | "QUOTA"
  | "TIMEOUT"
  | "UNAVAILABLE";

export class LocationResolutionError extends Error {
  readonly code: LocationResolutionErrorCode;
  readonly status: number | null;

  constructor(
    code: LocationResolutionErrorCode,
    message: string,
    options: { cause?: unknown; status?: number } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "LocationResolutionError";
    this.code = code;
    this.status = options.status ?? null;
  }
}

export function isLocationResolutionError(
  error: unknown,
): error is LocationResolutionError {
  return error instanceof LocationResolutionError;
}
