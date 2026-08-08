import type { AppShellState } from "../../types/device";
import {
  getBrowserLocationFailureCode,
  type BrowserLocationFailureCode,
} from "./browser-location-support";
import { LOCATION_POLICY } from "./location-policy";

export type BrowserLocationGuidance = {
  manualSearchAvailable: boolean;
  message: string;
  primaryAction: "manual" | "retry";
  retryAction?: "external-browser";
  retryLabel: string;
  retryAvailable: boolean;
  steps: string[];
  title: string;
};

type BrowserLocationGuidanceInput = {
  accuracyMeters?: number | null;
  accuracyRetryCompleted?: boolean;
  error?: unknown;
  permissionMode?: AppShellState["permissionMode"];
  userAgent?: string;
};

function getUserAgent(inputUserAgent?: string) {
  if (typeof inputUserAgent === "string") {
    return inputUserAgent;
  }

  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

function isEmbeddedBrowser(userAgent: string) {
  return /KAKAOTALK|NAVER\(|NAVER\/|Instagram|FBAN|FBAV|Line\/|wv\)/i.test(
    userAgent,
  );
}

function getPermissionSteps(userAgent: string) {
  if (isEmbeddedBrowser(userAgent)) {
    return [
      "앱의 메뉴에서 ‘Safari로 열기’ 또는 ‘Chrome으로 열기’를 선택해 주세요.",
      "외부 브라우저에서 이 사이트의 위치 권한을 허용한 뒤 다시 시도해 주세요.",
    ];
  }

  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return [
      "Safari 주소창의 페이지 메뉴에서 이 웹 사이트의 위치를 ‘허용’으로 바꿔 주세요.",
      "iPhone 설정의 위치 서비스에서 Safari의 위치 접근과 ‘정확한 위치’를 켜 주세요.",
    ];
  }

  if (/Android/i.test(userAgent)) {
    return [
      "Chrome 주소창의 사이트 정보 → 권한에서 위치를 허용해 주세요.",
      "휴대전화 설정에서 위치를 켜고 Chrome의 위치 권한을 ‘허용’ 및 ‘정확한 위치’로 바꿔 주세요.",
    ];
  }

  return [
    "주소창의 사이트 정보에서 이 사이트의 위치 권한을 허용해 주세요.",
    "기기의 위치 서비스를 켠 뒤 다시 시도해 주세요.",
  ];
}

function getGuidanceForFailure(
  code: BrowserLocationFailureCode | null,
  userAgent: string,
): BrowserLocationGuidance {
  const canOpenAndroidChrome =
    /Android/i.test(userAgent) && isEmbeddedBrowser(userAgent);

  if (code === "GEOLOCATION_INSECURE_CONTEXT") {
    return {
      title: "안전한 연결이 필요해요",
      message: "브라우저는 HTTPS로 열린 페이지에서만 현재 위치를 제공합니다.",
      steps: ["주소가 https://로 시작하는지 확인한 뒤 다시 접속해 주세요."],
      retryLabel: canOpenAndroidChrome ? "Chrome에서 열기" : "다시 확인",
      retryAction: canOpenAndroidChrome ? "external-browser" : undefined,
      retryAvailable: true,
      manualSearchAvailable: true,
      primaryAction: "manual",
    };
  }

  if (code === "GEOLOCATION_POLICY_BLOCKED") {
    return {
      title: "이 화면에서는 위치를 사용할 수 없어요",
      message:
        "다른 사이트나 앱 안에 삽입된 화면이 위치 사용을 막고 있을 수 있습니다.",
      steps: [
        "현재 페이지를 Safari 또는 Chrome의 새 창에서 직접 열어 주세요.",
      ],
      retryLabel: canOpenAndroidChrome ? "Chrome에서 열기" : "다시 확인",
      retryAction: canOpenAndroidChrome ? "external-browser" : undefined,
      retryAvailable: true,
      manualSearchAvailable: true,
      primaryAction: "manual",
    };
  }

  if (code === "GEOLOCATION_UNAVAILABLE") {
    return {
      title: "이 브라우저에서는 위치를 사용할 수 없어요",
      message:
        "크롬, 사파리 등 다른 브라우저에서 접속해주세요.",
      steps: isEmbeddedBrowser(userAgent)
        ? getPermissionSteps(userAgent)
        : ["최신 Safari 또는 Chrome에서 페이지를 다시 열어 주세요."],
      retryLabel: canOpenAndroidChrome ? "Chrome에서 열기" : "다시 확인",
      retryAction: canOpenAndroidChrome ? "external-browser" : undefined,
      retryAvailable: true,
      manualSearchAvailable: true,
      primaryAction: "manual",
    };
  }

  if (code === "GEOLOCATION_PERMISSION_DENIED") {
    return {
      title: "위치 권한을 허용해 주세요",
      message:
        "사이트를 이용하기 위해서는 위치 정보가 필요합니다.",
      steps: getPermissionSteps(userAgent),
      retryLabel: canOpenAndroidChrome
        ? "Chrome에서 열기"
        : "권한 다시 확인",
      retryAction: canOpenAndroidChrome ? "external-browser" : undefined,
      retryAvailable: true,
      manualSearchAvailable: true,
      primaryAction: "manual",
    };
  }

  if (code === "GEOLOCATION_POSITION_UNAVAILABLE") {
    return {
      title: "휴대전화가 현재 위치를 찾지 못했어요",
      message:
        "위치 서비스가 꺼져 있거나 위치 신호가 약합니다.",
      steps: [
        "휴대전화의 위치 서비스와 Wi-Fi를 켜 주세요.",
        "창가나 실외처럼 신호가 잘 잡히는 곳에서 다시 시도해 주세요.",
      ],
      retryLabel: "위치 다시 확인",
      retryAvailable: true,
      manualSearchAvailable: true,
      primaryAction: "retry",
    };
  }

  if (code === "GEOLOCATION_TIMEOUT") {
    return {
      title: "위치 확인이 오래 걸리고 있어요",
      message:
        "위치를 찾기 위해 노력하고 있습니다. 조금만 기다려주세요!",
      steps: [
        "휴대전화의 위치 서비스와 Wi-Fi가 켜져 있는지 확인해 주세요.",
        "가능하면 하늘이 보이는 곳에서 잠시 기다린 뒤 다시 시도해 주세요.",
      ],
      retryLabel: "위치 다시 확인",
      retryAvailable: true,
      manualSearchAvailable: true,
      primaryAction: "retry",
    };
  }

  if (code === "GEOLOCATION_INVALID_POSITION") {
    return {
      title: "오래되거나 잘못된 위치를 받았어요",
      message: "위치 정보를 다시 받아오겠습니다.",
      steps: ["화면을 켠 상태로 잠시 기다린 뒤 다시 시도해 주세요."],
      retryLabel: "새 위치 확인",
      retryAvailable: true,
      manualSearchAvailable: true,
      primaryAction: "retry",
    };
  }

  return {
    title: "현재 위치를 확인하지 못했어요",
    message:
      "네트워크 또는 위치 서비스가 일시적으로 불안정할 수 있습니다.",
    steps: [
      "인터넷 연결과 휴대전화의 위치 서비스를 확인한 뒤 다시 시도해 주세요.",
    ],
    retryLabel: "다시 시도",
    retryAvailable: true,
    manualSearchAvailable: true,
    primaryAction: "retry",
  };
}

export function getBrowserLocationGuidance({
  accuracyMeters,
  accuracyRetryCompleted = false,
  error,
  permissionMode = "unknown",
  userAgent,
}: BrowserLocationGuidanceInput = {}): BrowserLocationGuidance {
  const resolvedUserAgent = getUserAgent(userAgent);

  if (
    typeof accuracyMeters === "number" &&
    accuracyMeters > LOCATION_POLICY.submitBlockAboveMeters
  ) {
    if (
      accuracyRetryCompleted &&
      accuracyMeters > LOCATION_POLICY.submitFallbackMaxMeters
    ) {
      return {
        title: "정확한 위치를 확인할 수 없습니다.",
        message: "작성할 지역을 직접 검색해 선택해 주세요.",
        steps: [],
        retryLabel: "위치 다시 확인",
        retryAvailable: false,
        manualSearchAvailable: true,
        primaryAction: "manual",
      };
    }

    return {
      title: "위치 오차 범위가 넓은 상태입니다.",
      message:
        "정확한 동네를 확인하기 위해 위치를 한 번 더 받아올게요. 가능하면 창가나 실외에서 다시 시도해 주세요.",
      steps: [],
      retryLabel: "위치 다시 확인",
      retryAvailable: true,
      manualSearchAvailable: true,
      primaryAction: "retry",
    };
  }

  if (
    (permissionMode === "prompt" || permissionMode === "unknown") &&
    !error
  ) {
    return {
      title: "내 주변 이야기를 찾아볼까요?",
      message:
        "위치 정보는 주변 글을 불러오기 위해 사용하며, 저장되지 않습니다.",
      steps: [],
      retryLabel: "내 주변 보기",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (permissionMode === "denied" && !error) {
    return getGuidanceForFailure(
      "GEOLOCATION_PERMISSION_DENIED",
      resolvedUserAgent,
    );
  }

  return getGuidanceForFailure(
    getBrowserLocationFailureCode(error),
    resolvedUserAgent,
  );
}
