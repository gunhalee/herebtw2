import type { ApiResponse } from "../../types/api";

const ANONYMOUS_DEVICE_STORAGE_KEY = "shout.anonymousDeviceId";
const ANONYMOUS_DEVICE_COOKIE_KEY = "shout_anonymous_device_id";
const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

type RegisterDeviceResponse = {
  device: {
    id: string | null;
    anonymousDeviceId: string;
  };
};

function generateAnonymousDeviceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `anon_${crypto.randomUUID()}`;
  }

  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function persistAnonymousDeviceId(anonymousDeviceId: string) {
  window.localStorage.setItem(
    ANONYMOUS_DEVICE_STORAGE_KEY,
    anonymousDeviceId,
  );
  document.cookie =
    `${ANONYMOUS_DEVICE_COOKIE_KEY}=${encodeURIComponent(anonymousDeviceId)}; ` +
    `Max-Age=${ONE_YEAR_IN_SECONDS}; Path=/; SameSite=Lax`;
}

export function getOrCreateBrowserAnonymousDeviceId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existingAnonymousDeviceId = window.localStorage.getItem(
    ANONYMOUS_DEVICE_STORAGE_KEY,
  );

  if (existingAnonymousDeviceId) {
    persistAnonymousDeviceId(existingAnonymousDeviceId);
    return existingAnonymousDeviceId;
  }

  const nextAnonymousDeviceId = generateAnonymousDeviceId();
  persistAnonymousDeviceId(nextAnonymousDeviceId);

  return nextAnonymousDeviceId;
}

export async function ensureRegisteredBrowserDevice() {
  const anonymousDeviceId = getOrCreateBrowserAnonymousDeviceId();

  if (!anonymousDeviceId) {
    throw new Error("브라우저에서 디바이스를 준비하지 못했습니다.");
  }

  const response = await fetch("/api/device/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      anonymousDeviceId,
    }),
  });
  const json = (await response.json()) as ApiResponse<RegisterDeviceResponse>;

  if (!response.ok || !json.success || !json.data) {
    throw new Error(
      json.error?.message ?? "디바이스 등록에 실패했습니다.",
    );
  }

  persistAnonymousDeviceId(json.data.device.anonymousDeviceId);

  return json.data.device.anonymousDeviceId;
}
