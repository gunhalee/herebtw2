import { VeilOverlay } from "../../../../../components/common/veil-overlay";
import { uiColors, uiSpacing } from "../../../../../lib/ui/tokens";

export default function Loading() {
  return (
    <main
      style={{
        background: uiColors.surface,
        minHeight: "100dvh",
        position: "relative",
      }}
    >
      <section
        className="global-feed-preview"
        data-obscured="true"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.md,
          minHeight: "100dvh",
          padding: `${uiSpacing.lg} ${uiSpacing.pageX} calc(108px + env(safe-area-inset-bottom, 0px))`,
          position: "relative",
        }}
      >
        <div className="global-feed-preview__content" style={{ minHeight: "100%" }} />
        <VeilOverlay
          message="\ud6c4\ubcf4 \ub2f5\ubcc0 \ubaa8\uc544\ubcf4\uae30\ub97c \ubd88\ub7ec\uc624\ub294 \uc911\uc785\ub2c8\ub2e4."
        />
      </section>
    </main>
  );
}
