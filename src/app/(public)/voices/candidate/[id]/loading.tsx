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
          message="후보 답변 모아보기를 불러오는 중입니다."
        />
      </section>
    </main>
  );
}
