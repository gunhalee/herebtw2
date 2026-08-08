export type BrowserLocationFailureCode =
  | "GEOLOCATION_UNAVAILABLE"
  | "GEOLOCATION_INSECURE_CONTEXT"
  | "GEOLOCATION_POLICY_BLOCKED"
  | "GEOLOCATION_PERMISSION_DENIED"
  | "GEOLOCATION_POSITION_UNAVAILABLE"
  | "GEOLOCATION_TIMEOUT"
  | "GEOLOCATION_ABORTED"
  | "GEOLOCATION_INVALID_POSITION"
  | "GEOLOCATION_FAILED";

export type BrowserGeolocationPermissionState = PermissionState | "unsupported";

export class BrowserLocationError extends Error {
  readonly code: BrowserLocationFailureCode;

  constructor(code: BrowserLocationFailureCode, options?: ErrorOptions) {
    super(code, options);
    this.name = "BrowserLocationError";
    this.code = code;
  }
}

type GeolocationPolicyDocument = Document & {
  featurePolicy?: {
    allowsFeature(feature: string): boolean;
  };
  permissionsPolicy?: {
    allowsFeature(feature: string): boolean;
  };
};

export function makeGeolocationError(
  code: BrowserLocationFailureCode,
  cause?: unknown,
) {
  return new BrowserLocationError(code, cause === undefined ? undefined : { cause });
}

function isGeolocationAllowedByDocumentPolicy() {
  if (typeof document === "undefined") {
    return true;
  }

  const policyDocument = document as GeolocationPolicyDocument;
  const policy =
    policyDocument.permissionsPolicy ?? policyDocument.featurePolicy;

  if (!policy || typeof policy.allowsFeature !== "function") {
    return true;
  }

  try {
    return policy.allowsFeature("geolocation");
  } catch {
    return true;
  }
}

export function assertBrowserGeolocationSupport(method: "current" | "watch") {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    throw makeGeolocationError("GEOLOCATION_UNAVAILABLE");
  }

  if (window.isSecureContext === false) {
    throw makeGeolocationError("GEOLOCATION_INSECURE_CONTEXT");
  }

  if (!isGeolocationAllowedByDocumentPolicy()) {
    throw makeGeolocationError("GEOLOCATION_POLICY_BLOCKED");
  }

  if (
    !navigator.geolocation ||
    typeof navigator.geolocation.getCurrentPosition !== "function"
  ) {
    throw makeGeolocationError("GEOLOCATION_UNAVAILABLE");
  }

  if (
    method === "watch" &&
    typeof navigator.geolocation.watchPosition !== "function"
  ) {
    throw makeGeolocationError("GEOLOCATION_UNAVAILABLE");
  }
}

export function toBrowserLocationError(error: unknown) {
  if (error instanceof BrowserLocationError) {
    return error;
  }

  if (
    error instanceof DOMException &&
    (error.name === "NotAllowedError" || error.name === "SecurityError")
  ) {
    return makeGeolocationError("GEOLOCATION_PERMISSION_DENIED", error);
  }

  return makeGeolocationError("GEOLOCATION_FAILED", error);
}

export function fromNativeGeolocationError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) {
    return makeGeolocationError("GEOLOCATION_PERMISSION_DENIED", error);
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return makeGeolocationError("GEOLOCATION_POSITION_UNAVAILABLE", error);
  }

  if (error.code === error.TIMEOUT) {
    return makeGeolocationError("GEOLOCATION_TIMEOUT", error);
  }

  return makeGeolocationError("GEOLOCATION_FAILED", error);
}

export function getBrowserLocationFailureCode(
  error: unknown,
): BrowserLocationFailureCode | null {
  if (error instanceof BrowserLocationError) {
    return error.code;
  }

  if (!(error instanceof Error)) {
    return null;
  }

  const knownCodes: BrowserLocationFailureCode[] = [
    "GEOLOCATION_UNAVAILABLE",
    "GEOLOCATION_INSECURE_CONTEXT",
    "GEOLOCATION_POLICY_BLOCKED",
    "GEOLOCATION_PERMISSION_DENIED",
    "GEOLOCATION_POSITION_UNAVAILABLE",
    "GEOLOCATION_TIMEOUT",
    "GEOLOCATION_ABORTED",
    "GEOLOCATION_INVALID_POSITION",
    "GEOLOCATION_FAILED",
  ];

  return knownCodes.includes(error.message as BrowserLocationFailureCode)
    ? (error.message as BrowserLocationFailureCode)
    : null;
}

export async function getBrowserGeolocationPermissionState(): Promise<BrowserGeolocationPermissionState> {
  if (
    typeof navigator === "undefined" ||
    !navigator.permissions ||
    typeof navigator.permissions.query !== "function"
  ) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unsupported";
  }
}

export async function canRetryDeniedBrowserGeolocation() {
  return (await getBrowserGeolocationPermissionState()) !== "denied";
}

export async function observeBrowserGeolocationPermission(
  onChange: (state: PermissionState) => void,
): Promise<() => void> {
  if (
    typeof navigator === "undefined" ||
    !navigator.permissions ||
    typeof navigator.permissions.query !== "function"
  ) {
    return () => undefined;
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    const handleChange = () => onChange(status.state);
    status.addEventListener("change", handleChange);

    return () => status.removeEventListener("change", handleChange);
  } catch {
    return () => undefined;
  }
}
