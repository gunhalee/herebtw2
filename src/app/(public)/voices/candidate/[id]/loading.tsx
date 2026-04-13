import { LoadingState } from "../../../../../components/common/loading-state";
import { uiColors, uiSpacing } from "../../../../../lib/ui/tokens";

export default function Loading() {
  return (
    <main
      style={{
        background: uiColors.surface,
        minHeight: "100dvh",
      }}
    >
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          gap: uiSpacing.md,
          minHeight: "100dvh",
          padding: `${uiSpacing.lg} ${uiSpacing.pageX} calc(108px + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <LoadingState label="Loading candidate replies" />
      </section>
    </main>
  );
}
