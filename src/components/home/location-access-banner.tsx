import type {
  BrowserLocationContinuationAction,
  BrowserLocationGuidance,
} from "../../lib/geo/browser-location-guidance";
import { runBrowserLocationRetryAction } from "../../lib/geo/browser-location-recovery";
import {
  uiBrandYellow,
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";

type LocationAccessBannerProps = {
  guidance: BrowserLocationGuidance;
  locating: boolean;
  onManualSearch?: () => void;
  onRequest: (action: BrowserLocationContinuationAction) => void;
};

export function LocationAccessBanner({
  guidance,
  locating,
  onManualSearch,
  onRequest,
}: LocationAccessBannerProps) {
  const actionLabel = guidance.retryAvailable
    ? guidance.retryLabel
    : "지역 직접 선택";

  function handleAction() {
    if (!guidance.retryAvailable && onManualSearch) {
      onManualSearch();
      return;
    }

    runBrowserLocationRetryAction(guidance.retryAction, onRequest);
  }

  return (
    <aside
      aria-live="polite"
      style={{
        alignItems: "center",
        background: uiBrandYellow.surfaceSoft,
        borderBottom: `1px solid ${uiBrandYellow.borderSoft}`,
        display: "flex",
        gap: uiSpacing.md,
        justifyContent: "space-between",
        padding: `${uiSpacing.sm} ${uiSpacing.pageX}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            color: uiColors.textStrong,
            fontSize: uiTypography.meta.fontSize,
            fontWeight: 700,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {guidance.title}
        </p>
        <p
          style={{
            color: uiColors.textMuted,
            fontSize: "11px",
            lineHeight: 1.4,
            margin: "2px 0 0",
          }}
        >
          {guidance.message}
        </p>
      </div>
      <button
        disabled={locating}
        onClick={handleAction}
        style={{
          appearance: "none",
          background: "#ffffff",
          border: `1px solid ${uiBrandYellow.borderWarm}`,
          borderRadius: uiRadius.pill,
          color: uiColors.textStrong,
          cursor: locating ? "default" : "pointer",
          flexShrink: 0,
          fontSize: "11px",
          fontWeight: 700,
          minHeight: "44px",
          opacity: locating ? 0.65 : 1,
          padding: `${uiSpacing.xs} ${uiSpacing.md}`,
        }}
        type="button"
      >
        {locating ? "위치 확인 중..." : actionLabel}
      </button>
    </aside>
  );
}
