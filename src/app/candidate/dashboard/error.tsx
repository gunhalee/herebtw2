"use client";

import { ErrorState } from "../../../components/common/error-state";
import { uiSpacing } from "../../../lib/ui/tokens";

export default function CandidateDashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ minHeight: "100dvh", padding: uiSpacing.pageX }}>
      <div style={{ margin: "0 auto", maxWidth: "640px" }}>
        <ErrorState message="대시보드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." />
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: uiSpacing.md, padding: "10px 14px" }}
        >
          다시 시도
        </button>
      </div>
    </main>
  );
}
