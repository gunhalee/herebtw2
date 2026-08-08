import {
  uiColors,
  uiRadius,
  uiSpacing,
  uiTypography,
} from "../../lib/ui/tokens";
import type { BrowserLocationGuidance } from "../../lib/geo/browser-location-guidance";
import { openCurrentPageInAndroidChrome } from "../../lib/geo/browser-external-navigation";

type ComposePermissionDialogProps = {
  guidance: BrowserLocationGuidance;
  onClose: () => void;
  onManualSearch?: () => void;
  onRetry: () => void;
};

export function ComposePermissionDialog({
  guidance,
  onClose,
  onManualSearch,
  onRetry,
}: ComposePermissionDialogProps) {
  const manualSearchButton =
    guidance.manualSearchAvailable && onManualSearch ? (
      <button
        onClick={onManualSearch}
        style={{
          background: "linear-gradient(180deg, #fff89a 0%, #ffed00 100%)",
          border: "1px solid #e7dccd",
          borderRadius: uiRadius.pill,
          color: uiColors.textStrong,
          cursor: "pointer",
          fontSize: uiTypography.body.fontSize,
          fontWeight: 700,
          minHeight: "46px",
          padding: `${uiSpacing.sm} ${uiSpacing.lg}`,
          width: "100%",
        }}
        type="button"
      >
        지역 직접 선택
      </button>
    ) : null;

  const retryButton = guidance.retryAvailable ? (
    <button
      onClick={() => {
        if (guidance.retryAction === "external-browser") {
          openCurrentPageInAndroidChrome();
          return;
        }

        onRetry();
      }}
      style={{
        background: "#ffffff",
        border: `1px solid ${uiColors.border}`,
        borderRadius: uiRadius.pill,
        color: uiColors.textStrong,
        cursor: "pointer",
        fontSize: uiTypography.body.fontSize,
        fontWeight: 600,
        minHeight: "44px",
        padding: `${uiSpacing.sm} ${uiSpacing.lg}`,
      }}
      type="button"
    >
      {guidance.retryLabel}
    </button>
  ) : null;

  return (
    <div
      aria-label={guidance.title}
      aria-modal="true"
      role="dialog"
      style={{
        alignItems: "center",
        background: "rgba(17, 24, 39, 0.28)",
        display: "flex",
        inset: 0,
        justifyContent: "center",
        padding: uiSpacing.pageX,
        position: "absolute",
        zIndex: 14,
      }}
    >
      <section
        style={{
          background: "#fffdfa",
          borderRadius: uiRadius.lg,
          boxShadow: "0 18px 38px rgba(17, 24, 39, 0.18)",
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.xl,
          maxWidth: "320px",
          padding: uiSpacing.xl,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.sm,
          }}
        >
          <h2
            style={{
              color: uiColors.textStrong,
              fontSize: "17px",
              lineHeight: 1.4,
              margin: 0,
              textAlign: "center",
            }}
          >
            {guidance.title}
          </h2>
          <p
            style={{
              color: uiColors.textMuted,
              fontSize: "13px",
              lineHeight: 1.55,
              margin: 0,
              textAlign: "center",
            }}
          >
            {guidance.message}
          </p>
          {guidance.steps.length > 0 ? (
            <ol
              style={{
                color: uiColors.textStrong,
                display: "flex",
                flexDirection: "column",
                fontSize: "12px",
                gap: uiSpacing.xs,
                lineHeight: 1.5,
                margin: `${uiSpacing.sm} 0 0`,
                paddingLeft: "20px",
              }}
            >
              {guidance.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: uiSpacing.sm,
          }}
        >
          {guidance.primaryAction === "manual"
            ? manualSearchButton
            : retryButton}
          <div
            style={{
              display: "grid",
              gap: uiSpacing.sm,
              gridTemplateColumns:
                guidance.primaryAction === "manual" && guidance.retryAvailable
                  ? "1fr 1fr"
                  : guidance.primaryAction === "retry" && manualSearchButton
                    ? "1fr 1fr"
                    : "1fr",
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: "#ffffff",
                border: `1px solid ${uiColors.border}`,
                borderRadius: uiRadius.pill,
                color: uiColors.textStrong,
                cursor: "pointer",
                fontSize: uiTypography.body.fontSize,
                fontWeight: 600,
                minHeight: "44px",
                padding: `${uiSpacing.sm} ${uiSpacing.lg}`,
              }}
              type="button"
            >
              나중에
            </button>
            {guidance.primaryAction === "manual"
              ? retryButton
              : manualSearchButton}
          </div>
        </div>
      </section>
    </div>
  );
}
