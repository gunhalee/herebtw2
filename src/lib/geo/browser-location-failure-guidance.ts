import type { BrowserLocationFailureCode } from "./browser-location-support";
import type { BrowserLocationGuidance } from "./browser-location-guidance";

export function getManualLocationFallbackGuidance(): BrowserLocationGuidance {
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

function isEmbeddedBrowser(userAgent: string) {
  return /KAKAOTALK|NAVER\(|NAVER\/|Instagram|FBAN|FBAV|Line\/|wv\)/i.test(
    userAgent,
  );
}

function getExternalBrowserSteps() {
  return [
    "앱의 메뉴에서 ‘Safari로 열기’ 또는 ‘Chrome으로 열기’를 선택해 주세요.",
    "외부 브라우저에서 위치 권한을 다시 요청해 주세요.",
  ];
}

type BrowserLocationFailureGuidanceInput = {
  code: BrowserLocationFailureCode | null;
  recoveryAttemptCompleted: boolean;
  transientRetryCompleted: boolean;
  userAgent: string;
};

export function getBrowserLocationFailureGuidance({
  code,
  recoveryAttemptCompleted,
  transientRetryCompleted,
  userAgent,
}: BrowserLocationFailureGuidanceInput): BrowserLocationGuidance {
  const canOpenAndroidChrome =
    /Android/i.test(userAgent) && isEmbeddedBrowser(userAgent);
  const isStructuralFailure =
    code === "GEOLOCATION_INSECURE_CONTEXT" ||
    code === "GEOLOCATION_POLICY_BLOCKED" ||
    code === "GEOLOCATION_UNAVAILABLE" ||
    code === "GEOLOCATION_PERMISSION_DENIED";

  if (
    code === "GEOLOCATION_PERMISSION_DENIED" &&
    transientRetryCompleted &&
    !recoveryAttemptCompleted
  ) {
    return {
      title: "위치 권한을 한 번 더 요청할게요",
      message: "페이지를 새로고침한 뒤 위치 권한 요청을 바로 다시 시작합니다.",
      steps: [],
      retryLabel: "새로고침 후 다시 요청",
      retryAction: "reload",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (
    transientRetryCompleted ||
    (recoveryAttemptCompleted && isStructuralFailure)
  ) {
    return getManualLocationFallbackGuidance();
  }

  if (code === "GEOLOCATION_INSECURE_CONTEXT") {
    return {
      title: "안전한 연결이 필요해요",
      message: "브라우저는 HTTPS로 열린 페이지에서만 현재 위치를 제공합니다.",
      steps: ["주소가 https://로 시작하는지 확인한 뒤 다시 접속해 주세요."],
      retryLabel: canOpenAndroidChrome ? "Chrome에서 열기" : "HTTPS로 다시 열기",
      retryAction: canOpenAndroidChrome ? "external-browser" : "secure-page",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
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
      retryLabel: canOpenAndroidChrome ? "Chrome에서 열기" : "새 창에서 열기",
      retryAction: canOpenAndroidChrome ? "external-browser" : "new-window",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (code === "GEOLOCATION_UNAVAILABLE") {
    if (!canOpenAndroidChrome) {
      return getManualLocationFallbackGuidance();
    }

    return {
      title: "이 브라우저에서는 위치를 사용할 수 없어요",
      message: "크롬, 사파리 등 다른 브라우저에서 접속해주세요.",
      steps: getExternalBrowserSteps(),
      retryLabel: "Chrome에서 열기",
      retryAction: "external-browser",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (code === "GEOLOCATION_PERMISSION_DENIED") {
    if (canOpenAndroidChrome) {
      return {
        title: "이 브라우저에서는 위치 권한을 받기 어려워요",
        message: "Chrome에서 열어 위치 권한을 다시 요청해 주세요.",
        steps: getExternalBrowserSteps(),
        retryLabel: "Chrome에서 열기",
        retryAction: "external-browser",
        retryAvailable: true,
        manualSearchAvailable: false,
        primaryAction: "retry",
      };
    }

    return {
      title: "위치 권한이 필요해요",
      message:
        "주변 글을 불러오고 글을 남기려면 위치 권한이 필요합니다. 다시 요청해 볼게요.",
      steps: [],
      retryLabel: "위치 권한 다시 요청",
      retryAction: "fresh-location",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (code === "GEOLOCATION_POSITION_UNAVAILABLE") {
    return {
      title: "휴대전화가 현재 위치를 찾지 못했어요",
      message: "위치 서비스가 꺼져 있거나 위치 신호가 약합니다.",
      steps: [
        "휴대전화의 위치 서비스와 Wi-Fi를 켜 주세요.",
        "창가나 실외처럼 신호가 잘 잡히는 곳에서 다시 시도해 주세요.",
      ],
      retryLabel: "위치 다시 확인",
      retryAction: "fresh-location",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (code === "GEOLOCATION_TIMEOUT") {
    return {
      title: "위치 확인이 오래 걸리고 있어요",
      message: "위치를 찾기 위해 노력하고 있습니다. 조금만 기다려주세요!",
      steps: [
        "휴대전화의 위치 서비스와 Wi-Fi가 켜져 있는지 확인해 주세요.",
        "가능하면 하늘이 보이는 곳에서 잠시 기다린 뒤 다시 시도해 주세요.",
      ],
      retryLabel: "위치 다시 확인",
      retryAction: "fresh-location",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  if (code === "GEOLOCATION_INVALID_POSITION") {
    return {
      title: "오래되거나 잘못된 위치를 받았어요",
      message: "위치 정보를 다시 받아오겠습니다.",
      steps: ["화면을 켠 상태로 잠시 기다린 뒤 다시 시도해 주세요."],
      retryLabel: "새 위치 확인",
      retryAction: "fresh-location",
      retryAvailable: true,
      manualSearchAvailable: false,
      primaryAction: "retry",
    };
  }

  return {
    title: "현재 위치를 확인하지 못했어요",
    message: "네트워크 또는 위치 서비스가 일시적으로 불안정할 수 있습니다.",
    steps: [
      "인터넷 연결과 휴대전화의 위치 서비스를 확인한 뒤 다시 시도해 주세요.",
    ],
    retryLabel: "다시 시도",
    retryAction: "fresh-location",
    retryAvailable: true,
    manualSearchAvailable: false,
    primaryAction: "retry",
  };
}
